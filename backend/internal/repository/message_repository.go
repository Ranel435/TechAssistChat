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
	GetChatHistoryByID(userID1, userID2 int64, limit int) ([]models.Message, error)
	GetUserChats(userID string) ([]string, error)
	GetUserChatsByID(userID int64) ([]models.User, error)
}

type PostgresMessageRepository struct{}

func NewMessageRepository() MessageRepository {
	return &PostgresMessageRepository{}
}

func (r *PostgresMessageRepository) Save(msg *models.Message) error {
	log.Printf("Попытка сохранения: FromUserID=%d, ToUserID=%d, Message=%s", msg.FromUserID, msg.ToUserID, msg.Message)

	query := `
		INSERT INTO messages (from_user_id, to_user_id, from_user, to_user, message, created_at)
		VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
		RETURNING id, created_at`

	err := database.DB.QueryRow(query, msg.FromUserID, msg.ToUserID, msg.FromUser, msg.ToUser, msg.Message).
		Scan(&msg.ID, &msg.CreatedAt)

	if err != nil {
		log.Printf("SQL ошибка: %v", err)
		return fmt.Errorf("ошибка сохранения сообщения: %w", err)
	}

	log.Printf("💾 Сообщение сохранено: ID=%d, От=%d, Кому=%d, Время=%v",
		msg.ID, msg.FromUserID, msg.ToUserID, msg.CreatedAt)

	return nil
}

// Старый метод для обратной совместимости
func (r *PostgresMessageRepository) GetChatHistory(user1, user2 string, limit int) ([]models.Message, error) {
	query := `
		SELECT id, COALESCE(from_user_id, 0), COALESCE(to_user_id, 0), 
		       COALESCE(from_user, ''), COALESCE(to_user, ''), message, created_at
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
		err := rows.Scan(&msg.ID, &msg.FromUserID, &msg.ToUserID, &msg.FromUser, &msg.ToUser, &msg.Message, &msg.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("ошибка сканирования сообщения: %w", err)
		}
		messages = append(messages, msg)
	}

	log.Printf("Загружена история чата %s-%s: %d сообщений", user1, user2, len(messages))
	return messages, nil
}

// Новый метод для работы с user_id
func (r *PostgresMessageRepository) GetChatHistoryByID(userID1, userID2 int64, limit int) ([]models.Message, error) {
	query := `
		SELECT m.id, m.from_user_id, m.to_user_id, 
		       u1.username as from_user, u2.username as to_user,
		       m.message, m.created_at
		FROM messages m
		LEFT JOIN users u1 ON m.from_user_id = u1.id
		LEFT JOIN users u2 ON m.to_user_id = u2.id
		WHERE (m.from_user_id = $1 AND m.to_user_id = $2) OR (m.from_user_id = $2 AND m.to_user_id = $1)
		ORDER BY m.created_at ASC
		LIMIT $3`

	rows, err := database.DB.Query(query, userID1, userID2, limit)
	if err != nil {
		return nil, fmt.Errorf("ошибка получения истории чата: %w", err)
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		err := rows.Scan(&msg.ID, &msg.FromUserID, &msg.ToUserID, &msg.FromUser, &msg.ToUser, &msg.Message, &msg.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("ошибка сканирования сообщения: %w", err)
		}
		messages = append(messages, msg)
	}

	log.Printf("Загружена история чата %d-%d: %d сообщений", userID1, userID2, len(messages))
	return messages, nil
}

// Старый метод для обратной совместимости
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

// Новый метод для работы с user_id
func (r *PostgresMessageRepository) GetUserChatsByID(userID int64) ([]models.User, error) {
	query := `
		SELECT DISTINCT u.id, u.username, u.created_at, u.last_seen
		FROM users u
		JOIN messages m ON (u.id = m.from_user_id OR u.id = m.to_user_id)
		WHERE (m.from_user_id = $1 OR m.to_user_id = $1) AND u.id != $1
		ORDER BY u.username`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("ошибка получения списка чатов: %w", err)
	}
	defer rows.Close()

	var users []models.User
	for rows.Next() {
		var user models.User
		if err := rows.Scan(&user.ID, &user.Username, &user.CreatedAt, &user.LastSeen); err != nil {
			return nil, fmt.Errorf("ошибка сканирования пользователя: %w", err)
		}
		users = append(users, user)
	}

	return users, nil
}
