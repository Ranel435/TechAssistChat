package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/ws"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func main() {
	cfg := config.LoadConfig()

	if err := database.InitDB(&cfg.Database); err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer database.CloseDB()

	r := gin.Default()

	r.Use(corsMiddleware())

	hub := ws.GetHub()
	go hub.Run()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "techassistchat-backend",
		})
	})

	r.HEAD("/health", func(c *gin.Context) {
		c.Status(http.StatusOK)
	})

	r.GET("/ws", func(c *gin.Context) {
		handlers.HandleWebSocket(c, hub)
	})

	r.GET("/api/chat/:user1/:user2", func(c *gin.Context) {
		user1 := c.Param("user1")
		user2 := c.Param("user2")

		messages, err := hub.GetChatHistory(user1, user2, 50)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"messages": messages})
	})

	r.GET("/api/messages", func(c *gin.Context) {
		query := `SELECT id, from_user, to_user, message, created_at FROM messages ORDER BY created_at DESC LIMIT 20`

		rows, err := database.DB.Query(query)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var messages []map[string]interface{}
		for rows.Next() {
			var id int64
			var fromUser, toUser, message string
			var createdAt time.Time

			if err := rows.Scan(&id, &fromUser, &toUser, &message, &createdAt); err != nil {
				continue
			}

			messages = append(messages, map[string]interface{}{
				"id":         id,
				"from_user":  fromUser,
				"to_user":    toUser,
				"message":    message,
				"created_at": createdAt,
			})
		}

		c.JSON(http.StatusOK, gin.H{"messages": messages})
	})

	log.Printf("Сервер запущен на порту %s", cfg.Port)
	r.Run(":" + cfg.Port)
}
