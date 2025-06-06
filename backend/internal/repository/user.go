package repository

import (
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/queries"
	"database/sql"
	"fmt"
)

type userRepository struct {
	db *sql.DB
}

func NewUserRepository() database.UserRepository {
	return &userRepository{
		db: database.DB,
	}
}

func (r *userRepository) CreateUser(user *models.User) error {
	err := r.db.QueryRow(queries.CreateUserQuery, user.Username, user.PasswordHash).Scan(
		&user.ID, &user.CreatedAt, &user.LastSeen)
	if err != nil {
		return fmt.Errorf("ошибка создания пользователя: %w", err)
	}

	return nil
}

func (r *userRepository) GetUserByUsername(username string) (*models.User, error) {
	user := &models.User{}

	err := r.db.QueryRow(queries.GetUserByUsernameQuery, username).Scan(
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

	err := r.db.QueryRow(queries.GetUserByIDQuery, id).Scan(
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
	_, err := r.db.Exec(queries.UpdateLastSeenQuery, userID)
	if err != nil {
		return fmt.Errorf("ошибка обновления last_seen: %w", err)
	}
	return nil
}
