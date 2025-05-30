package handlers

import (
	"backend/internal/database"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type DebugHandler struct{}

func NewDebugHandler() *DebugHandler {
	return &DebugHandler{}
}

func (h *DebugHandler) GetAllMessages(c *gin.Context) {
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
}
