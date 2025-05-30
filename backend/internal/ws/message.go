package ws

import (
	"backend/internal/models"
	"time"
)

type Message struct {
	From    string `json:"from"`
	To      string `json:"to"`
	Message string `json:"message"`
}

func (m *Message) ToDBMessage() *models.Message {
	return &models.Message{
		FromUser:  m.From,
		ToUser:    m.To,
		Message:   m.Message,
		CreatedAt: time.Now(),
	}
}

func FromDBMessage(dbMsg *models.Message) *Message {
	return &Message{
		From:    dbMsg.FromUser,
		To:      dbMsg.ToUser,
		Message: dbMsg.Message,
	}
}
