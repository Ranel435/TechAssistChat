package repository

import (
	"backend/internal/database"
	"backend/internal/models"
	"database/sql"
	"fmt"
)

type UserRepository interface {
	CreateUser(user *models.User) error
	GetUserByUsername(username string) (*models.User, error)
	GetUserByID(id int64) (*models.User, error)
	UpdateLastSeen(userID int64) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository() UserRepository {
	return &userRepository{
		db: database.DB,
	}
}

func (r *userRepository) CreateUser(user *models.User) error {
	query := `
		INSERT INTO users (username, password_hash, created_at, last_seen)
		VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
		RETURNING id, created_at, last_seen`

	err := r.db.QueryRow(query, user.Username, user.PasswordHash).Scan(
		&user.ID, &user.CreatedAt, &user.LastSeen)
	if err != nil {
		return fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	return nil
}

func (r *userRepository) GetUserByUsername(username string) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, username, password_hash, created_at, last_seen
		FROM users
		WHERE username = $1`

	err := r.db.QueryRow(query, username).Scan(
		&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt, &user.LastSeen)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("пользователь не найден")
		}
		return nil, fmt.Errorf("ошибка получения пользователя: %w", err)
	}

	return user, nil
}

func (r *userRepository) GetUserByID(id int64) (*models.User, error) {
	user := &models.User{}
	query := `
		SELECT id, username, password_hash, created_at, last_seen
		FROM users
		WHERE id = $1`

	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Username, &user.PasswordHash, &user.CreatedAt, &user.LastSeen)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("пользователь не найден")
		}
		return nil, fmt.Errorf("ошибка получения пользователя: %w", err)
	}

	return user, nil
}

func (r *userRepository) UpdateLastSeen(userID int64) error {
	query := `UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = $1`
	_, err := r.db.Exec(query, userID)
	if err != nil {
		return fmt.Errorf("ошибка обновления last_seen: %w", err)
	}
	return nil
}
