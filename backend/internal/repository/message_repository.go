package repository

import (
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/queries"
	"fmt"
	"log"
)

type PostgresMessageRepository struct{}

func NewMessageRepository() database.MessageRepository {
	return &PostgresMessageRepository{}
}

func (r *PostgresMessageRepository) Save(msg *models.Message) error {
	log.Printf("Попытка сохранения: FromUserID=%d, ToUserID=%d, Message=%s", msg.FromUserID, msg.ToUserID, msg.Message)

	err := database.DB.QueryRow(queries.SaveMessageQuery, msg.FromUserID, msg.ToUserID, msg.FromUser, msg.ToUser, msg.Message).
		Scan(&msg.ID, &msg.CreatedAt)

	if err != nil {
		log.Printf("SQL ошибка: %v", err)
		return fmt.Errorf("ошибка сохранения сообщения: %w", err)
	}

	log.Printf("Сообщение сохранено: ID=%d, От=%d, Кому=%d, Время=%v",
		msg.ID, msg.FromUserID, msg.ToUserID, msg.CreatedAt)

	return nil
}

// Старый метод для обратной совместимости
func (r *PostgresMessageRepository) GetChatHistory(user1, user2 string, limit int) ([]models.Message, error) {
	rows, err := database.DB.Query(queries.GetChatHistoryByUsernameQuery, user1, user2, limit)
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
	rows, err := database.DB.Query(queries.GetChatHistoryByIDQuery, userID1, userID2, limit)
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
	rows, err := database.DB.Query(queries.GetUserChatsByUsernameQuery, userID)
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
	rows, err := database.DB.Query(queries.GetUserChatsByIDQuery, userID)
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
