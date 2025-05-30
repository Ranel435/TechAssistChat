package models

import (
	"time"
)

type Message struct {
	ID        int64     `json:"id" db:"id"`
	FromUser  string    `json:"from_user" db:"from_user"`
	ToUser    string    `json:"to_user" db:"to_user"`
	Message   string    `json:"message" db:"message"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

type ChatHistory struct {
	Participant1 string    `json:"participant1"`
	Participant2 string    `json:"participant2"`
	Messages     []Message `json:"messages"`
}
