package handlers

import (
	"backend/internal/ws"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

func HandleWebSocket(c *gin.Context, hub *ws.Hub) {
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

	client := ws.NewClient(conn, userID, hub)

	log.Printf("Регистрация пользователя: %s", userID)
	hub.RegisterClient(client)
}
