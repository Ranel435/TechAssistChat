package database

import "backend/internal/models"

type UserRepository interface {
	CreateUser(user *models.User) error
	GetUserByUsername(username string) (*models.User, error)
	GetUserByID(id int64) (*models.User, error)
	UpdateLastSeen(userID int64) error
}

type MessageRepository interface {
	Save(msg *models.Message) error
	GetChatHistory(user1, user2 string, limit int) ([]models.Message, error)
	GetChatHistoryByID(userID1, userID2 int64, limit int) ([]models.Message, error)
	GetUserChats(userID string) ([]string, error)
	GetUserChatsByID(userID int64) ([]models.User, error)
}
