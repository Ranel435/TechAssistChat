package repository

import (
	"backend/internal/database"
	"backend/internal/models"
	"fmt"
	"log"
)

type MessageRepository interface {
	Save(msg *models.Message) error
	GetChatHistory(user1, user2 string, limit int) ([]models.Message, error)
	GetUserChats(userID string) ([]string, error)
}

type PostgresMessageRepository struct{}

func NewMessageRepository() MessageRepository {
	return &PostgresMessageRepository{}
}

func (r *PostgresMessageRepository) Save(msg *models.Message) error {
	log.Printf("Попытка сохранения: FromUser=%s, ToUser=%s, Message=%s", msg.FromUser, msg.ToUser, msg.Message)

	query := `
		INSERT INTO messages (from_user, to_user, message, created_at)
		VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
		RETURNING id, created_at`

	err := database.DB.QueryRow(query, msg.FromUser, msg.ToUser, msg.Message).
		Scan(&msg.ID, &msg.CreatedAt)

	if err != nil {
		log.Printf("SQL ошибка: %v", err)
		log.Printf("Параметры: FromUser=%s, ToUser=%s, Message=%s", msg.FromUser, msg.ToUser, msg.Message)
		return fmt.Errorf("ошибка сохранения сообщения: %w", err)
	}

	log.Printf("💾 Сообщение сохранено: ID=%d, От=%s, Кому=%s, Время=%v",
		msg.ID, msg.FromUser, msg.ToUser, msg.CreatedAt)

	return nil
}

func (r *PostgresMessageRepository) GetChatHistory(user1, user2 string, limit int) ([]models.Message, error) {
	query := `
		SELECT id, from_user, to_user, message, created_at
		FROM messages
		WHERE (from_user = $1 AND to_user = $2) OR (from_user = $2 AND to_user = $1)
		ORDER BY created_at ASC
		LIMIT $3`

	rows, err := database.DB.Query(query, user1, user2, limit)
	if err != nil {
		return nil, fmt.Errorf("ошибка получения истории чата: %w", err)
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		err := rows.Scan(&msg.ID, &msg.FromUser, &msg.ToUser, &msg.Message, &msg.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("ошибка сканирования сообщения: %w", err)
		}
		messages = append(messages, msg)
	}

	log.Printf("Загружена история чата %s-%s: %d сообщений", user1, user2, len(messages))
	return messages, nil
}

func (r *PostgresMessageRepository) GetUserChats(userID string) ([]string, error) {
	query := `
		SELECT DISTINCT 
			CASE 
				WHEN from_user = $1 THEN to_user 
				ELSE from_user 
			END as chat_partner
		FROM messages
		WHERE from_user = $1 OR to_user = $1
		ORDER BY chat_partner`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("ошибка получения списка чатов: %w", err)
	}
	defer rows.Close()

	var partners []string
	for rows.Next() {
		var partner string
		if err := rows.Scan(&partner); err != nil {
			return nil, fmt.Errorf("ошибка сканирования партнера: %w", err)
		}
		partners = append(partners, partner)
	}

	return partners, nil
}
