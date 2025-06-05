package ws

import (
	"backend/internal/models"
	"time"
)

type Message struct {
	From         string `json:"from"` // Для обратной совместимости
	To           string `json:"to"`   // Для обратной совместимости
	FromUserID   int64  `json:"from_user_id"`
	ToUserID     int64  `json:"to_user_id"`
	FromUsername string `json:"from_username"`
	ToUsername   string `json:"to_username"`
	Message      string `json:"message"`
}

func (m *Message) ToDBMessage() *models.Message {
	return &models.Message{
		FromUserID: m.FromUserID,
		ToUserID:   m.ToUserID,
		FromUser:   m.FromUsername, // Для обратной совместимости
		ToUser:     m.ToUsername,   // Для обратной совместимости
		Message:    m.Message,
		CreatedAt:  time.Now(),
	}
}

func FromDBMessage(dbMsg *models.Message) *Message {
	return &Message{
		From:         dbMsg.FromUser,
		To:           dbMsg.ToUser,
		FromUserID:   dbMsg.FromUserID,
		ToUserID:     dbMsg.ToUserID,
		FromUsername: dbMsg.FromUser,
		ToUsername:   dbMsg.ToUser,
		Message:      dbMsg.Message,
	}
}
