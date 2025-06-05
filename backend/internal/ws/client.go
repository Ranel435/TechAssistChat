package ws

import (
	"backend/internal/repository"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn      *websocket.Conn `json:"-"`
	Send      chan Message    `json:"-"`
	UserID    string          `json:"user_id"`
	UserIDInt int64           `json:"user_id_int"`
	Username  string          `json:"username"`
	Hub       *Hub            `json:"-"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewClient(conn *websocket.Conn, userIDInt int64, username string, hub *Hub) *Client {
	return &Client{
		Conn:      conn,
		Send:      make(chan Message, 256),
		UserID:    strconv.FormatInt(userIDInt, 10),
		UserIDInt: userIDInt,
		Username:  username,
		Hub:       hub,
	}
}

func (c *Client) read() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
		log.Printf("Пользователь %s (%s) отключился", c.Username, c.UserID)
	}()

	userRepo := repository.NewUserRepository()

	for {
		var msg Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			log.Printf("Ошибка чтения от %s: %v", c.Username, err)
			break
		}

		msg.From = c.UserID
		msg.FromUserID = c.UserIDInt
		msg.FromUsername = c.Username

		if msg.ToUserID != 0 {
			toUser, err := userRepo.GetUserByID(msg.ToUserID)
			if err != nil {
				log.Printf("Ошибка получения пользователя %d: %v", msg.ToUserID, err)
				continue
			}
			msg.To = strconv.FormatInt(msg.ToUserID, 10)
			msg.ToUsername = toUser.Username
		} else if msg.To != "" {
			if toUserID, err := strconv.ParseInt(msg.To, 10, 64); err == nil {
				toUser, err := userRepo.GetUserByID(toUserID)
				if err == nil {
					msg.ToUserID = toUserID
					msg.ToUsername = toUser.Username
				}
			} else {
				toUser, err := userRepo.GetUserByUsername(msg.To)
				if err == nil {
					msg.ToUserID = toUser.ID
					msg.ToUsername = toUser.Username
					msg.To = strconv.FormatInt(toUser.ID, 10)
				}
			}
		}

		log.Printf("Получено сообщение от %s для %s: %s", msg.FromUsername, msg.ToUsername, msg.Message)

		c.Hub.broadcast <- msg
	}
}

func (c *Client) write() {
	defer c.Conn.Close()

	for msg := range c.Send {
		if err := c.Conn.WriteJSON(msg); err != nil {
			log.Printf("Ошибка отправки для %s: %v", c.Username, err)
			break
		}
		log.Printf("Отправлено сообщение для %s от %s", c.Username, msg.FromUsername)
	}
}

func UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func (h *Hub) RegisterClient(c *Client) {
	log.Printf("Регистрация пользователя: %s (%s)", c.Username, c.UserID)
	h.register <- c
	go c.read()
	go c.write()
}
