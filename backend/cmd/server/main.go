package main

import (
	"backend/internal/handlers"
	"backend/internal/ws"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	hub := ws.GetHub()
	go hub.Run()

	r.GET("/ws", func(c *gin.Context) {
		handlers.HandleWebSocket(c, hub)
	})

	r.Run(":8080")
}
