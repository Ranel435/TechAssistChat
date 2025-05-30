package handlers

import (
	"net/http"

	"backend/internal/ws"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	hub *ws.Hub
}

func NewUserHandler(hub *ws.Hub) *UserHandler {
	return &UserHandler{hub: hub}
}

func (h *UserHandler) GetOnlineUsers(c *gin.Context) {
	users := h.hub.GetConnectedUsers()
	c.JSON(http.StatusOK, gin.H{"users": users})
}
