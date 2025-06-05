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

	r.GET("/ws-legacy", func(c *gin.Context) {
		handlers.HandleWebSocketLegacy(c, hub)
	})

	api := r.Group("/api")
	{
		api.GET("/chats/:username", chatHandler.GetUserChats)
		api.GET("/chat/:user1/:user2", chatHandler.GetChatHistory)
		api.POST("/chat", chatHandler.CreateChat)

		api.GET("/users/online", userHandler.GetOnlineUsers)

		api.GET("/messages", debugHandler.GetAllMessages)
	}

	authAPI := r.Group("/api/auth")
	authAPI.Use(middleware.JWTAuth())
	{
		authAPI.GET("/history", chatHandler.GetHistory)

		authAPI.GET("/chats", chatHandler.GetUserChatsAuth)
	}

	return r
}
