package ws

import (
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

type Client struct {
	Conn   *websocket.Conn `json:"-"`
	Send   chan Message    `json:"-"`
	UserID string          `json:"user_id"`
	Hub    *Hub            `json:"-"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewClient(conn *websocket.Conn, userID string, hub *Hub) *Client {
	return &Client{
		Conn:   conn,
		Send:   make(chan Message, 256),
		UserID: userID,
		Hub:    hub,
	}
}

func (c *Client) read() {
	defer func() {
		c.Hub.unregister <- c
		c.Conn.Close()
		log.Printf("Пользователь %s отключился", c.UserID)
	}()

	for {
		var msg Message
		if err := c.Conn.ReadJSON(&msg); err != nil {
			log.Printf("Ошибка чтения от %s: %v", c.UserID, err)
			break
		}

		msg.From = c.UserID
		log.Printf("Получено сообщение от %s для %s: %s", msg.From, msg.To, msg.Message)

		c.Hub.broadcast <- msg
	}
}

func (c *Client) write() {
	defer c.Conn.Close()

	for msg := range c.Send {
		if err := c.Conn.WriteJSON(msg); err != nil {
			log.Printf("Ошибка отправки для %s: %v", c.UserID, err)
			break
		}
		log.Printf("Отправлено сообщение для %s от %s", c.UserID, msg.From)
	}
}

func UpgradeConnection(w http.ResponseWriter, r *http.Request) (*websocket.Conn, error) {
	return upgrader.Upgrade(w, r, nil)
}

func (h *Hub) RegisterClient(c *Client) {
	log.Printf("Регистрация пользователя: %s", c.UserID)
	h.register <- c
	go c.read()
	go c.write()
}
