package routes

import (
	"backend/internal/handlers"
	"backend/internal/middleware"
	"backend/internal/ws"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(hub *ws.Hub) *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())

	healthHandler := handlers.NewHealthHandler()
	chatHandler := handlers.NewChatHandler(hub)
	userHandler := handlers.NewUserHandler(hub)
	debugHandler := handlers.NewDebugHandler()
	authHandler := handlers.NewAuthHandler()

	r.GET("/health", healthHandler.GetHealth)
	r.HEAD("/health", healthHandler.HeadHealth)

	r.POST("/register", authHandler.Register)
	r.POST("/login", authHandler.Login)

	r.GET("/ws", func(c *gin.Context) {
		handlers.HandleWebSocket(c, hub)
	})

	api := r.Group("/api")
	{
		// Chat
		api.GET("/chats/:username", chatHandler.GetUserChats)
		api.GET("/chat/:user1/:user2", chatHandler.GetChatHistory)
		api.POST("/chat", chatHandler.CreateChat)

		// User
		api.GET("/users/online", userHandler.GetOnlineUsers)

		// Debug
		api.GET("/messages", debugHandler.GetAllMessages)
	}

	return r
}
