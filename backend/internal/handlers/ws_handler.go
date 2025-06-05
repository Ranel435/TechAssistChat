package handlers

import (
	"backend/internal/auth"
	"backend/internal/ws"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleWebSocket(c *gin.Context, hub *ws.Hub) {
	tokenString := c.Query("token")
	if tokenString == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Параметр token обязателен"})
		return
	}

	claims, err := auth.ValidateToken(tokenString)
	if err != nil {
		log.Printf("Ошибка валидации токена: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Невалидный токен"})
		return
	}

	conn, err := ws.UpgradeConnection(c.Writer, c.Request)
	if err != nil {
		log.Printf("Ошибка обновления соединения: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить соединение"})
		return
	}

	client := ws.NewClient(conn, claims.UserID, claims.Username, hub)

	log.Printf("Регистрация пользователя: %s (ID: %d)", claims.Username, claims.UserID)
	hub.RegisterClient(client)
}

// Старый обработчик для обратной совместимости
func HandleWebSocketLegacy(c *gin.Context, hub *ws.Hub) {
	userID := c.Query("user")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Параметр user обязателен"})
		return
	}

	conn, err := ws.UpgradeConnection(c.Writer, c.Request)
	if err != nil {
		log.Printf("Ошибка обновления соединения: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Не удалось обновить соединение"})
		return
	}

	client := &ws.Client{
		Conn:   conn,
		Send:   make(chan ws.Message, 256),
		UserID: userID,
		Hub:    hub,
	}

	log.Printf("Регистрация пользователя (legacy): %s", userID)
	hub.RegisterClient(client)
}
