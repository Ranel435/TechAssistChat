package models

import (
	"time"
)

type Message struct {
	ID         int64     `json:"id" db:"id"`
	FromUserID int64     `json:"from_user_id" db:"from_user_id"`
	ToUserID   int64     `json:"to_user_id" db:"to_user_id"`
	FromUser   string    `json:"from_user,omitempty"` // Для обратной совместимости
	ToUser     string    `json:"to_user,omitempty"`   // Для обратной совместимости
	Message    string    `json:"message" db:"message"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

type ChatHistory struct {
	Participant1ID int64     `json:"participant1_id"`
	Participant2ID int64     `json:"participant2_id"`
	Participant1   string    `json:"participant1"`
	Participant2   string    `json:"participant2"`
	Messages       []Message `json:"messages"`
}
