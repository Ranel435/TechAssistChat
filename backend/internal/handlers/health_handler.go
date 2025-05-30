package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

func (h *HealthHandler) GetHealth(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "healthy",
		"service": "techassistchat-backend",
	})
}

func (h *HealthHandler) HeadHealth(c *gin.Context) {
	c.Status(http.StatusOK)
}
