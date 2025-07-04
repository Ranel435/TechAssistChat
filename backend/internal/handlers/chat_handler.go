package handlers

import (
	"backend/internal/database"
	"backend/internal/repository"
	"backend/internal/ws"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	hub         *ws.Hub
	messageRepo database.MessageRepository
	userRepo    database.UserRepository
}

func NewChatHandler(hub *ws.Hub) *ChatHandler {
	return &ChatHandler{
		hub:         hub,
		messageRepo: repository.NewMessageRepository(),
		userRepo:    repository.NewUserRepository(),
	}
}

func (h *ChatHandler) GetUserChats(c *gin.Context) {
	username := c.Param("username")

	query := `
		SELECT DISTINCT 
			CASE 
				WHEN from_user = $1 THEN to_user 
				ELSE from_user 
			END AS other_user,
			MAX(created_at) AS last_message_time,
			(SELECT message FROM messages m2 
			 WHERE (m2.from_user = $1 AND m2.to_user = CASE WHEN from_user = $1 THEN to_user ELSE from_user END)
			    OR (m2.to_user = $1 AND m2.from_user = CASE WHEN from_user = $1 THEN to_user ELSE from_user END)
			 ORDER BY m2.created_at DESC LIMIT 1) AS last_message
		FROM messages 
		WHERE from_user = $1 OR to_user = $1
		GROUP BY other_user
		ORDER BY last_message_time DESC`

	rows, err := database.DB.Query(query, username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var chats []map[string]interface{}
	for rows.Next() {
		var otherUser, lastMessage string
		var lastMessageTime time.Time

		if err := rows.Scan(&otherUser, &lastMessageTime, &lastMessage); err != nil {
			continue
		}

		chats = append(chats, map[string]interface{}{
			"user":              otherUser,
			"last_message":      lastMessage,
			"last_message_time": lastMessageTime,
		})
	}

	c.JSON(http.StatusOK, gin.H{"chats": chats})
}

func (h *ChatHandler) GetUserChatsAuth(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	users, err := h.messageRepo.GetUserChatsByID(userID.(int64))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"chats": users})
}

func (h *ChatHandler) GetChatHistory(c *gin.Context) {
	user1 := c.Param("user1")
	user2 := c.Param("user2")

	messages, err := h.hub.GetChatHistory(user1, user2, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func (h *ChatHandler) GetHistory(c *gin.Context) {
	userAID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Пользователь не авторизован"})
		return
	}

	userBIDStr := c.Query("userB_id")
	if userBIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Параметр userB_id обязателен"})
		return
	}

	userBID, err := strconv.ParseInt(userBIDStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Неверный формат userB_id"})
		return
	}

	userAIDStr := c.Query("userA_id")
	if userAIDStr != "" {
		userAIDFromQuery, err := strconv.ParseInt(userAIDStr, 10, 64)
		if err != nil || userAIDFromQuery != userAID.(int64) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Доступ запрещен"})
			return
		}
	}

	messages, err := h.messageRepo.GetChatHistoryByID(userAID.(int64), userBID, 50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func (h *ChatHandler) CreateChat(c *gin.Context) {
	var request struct {
		From    string `json:"from" binding:"required"`
		To      string `json:"to" binding:"required"`
		Message string `json:"message" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if request.From == request.To {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Нельзя отправить сообщение самому себе"})
		return
	}

	message := ws.Message{
		From:    request.From,
		To:      request.To,
		Message: request.Message,
	}

	h.hub.GetBroadcastChannel() <- message

	c.JSON(http.StatusOK, gin.H{"status": "ok", "message": "Чат создан и сообщение отправлено"})
}
