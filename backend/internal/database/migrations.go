package database

import (
	"backend/internal/config"
	"fmt"
	"log"
)

func runMigrations(cfg *config.DatabaseConfig) error {
	log.Println("Применение миграций...")

	createMessagesTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		from_user_id INTEGER REFERENCES users(id),
		to_user_id INTEGER REFERENCES users(id),
		from_user VARCHAR(255), -- Для обратной совместимости
		to_user VARCHAR(255),   -- Для обратной совместимости
		message TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	createMessagesIndexes := `
	CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages (from_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages (to_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages (from_user);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages (to_user);
	CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);`

	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	createUsersIndexes := `
	CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
	CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users (last_seen);`

	migrations := []string{
		createMessagesTable,
		createMessagesIndexes,
		createUsersTable,
		createUsersIndexes,
	}

	for i, migration := range migrations {
		if _, err := DB.Exec(migration); err != nil {
			return fmt.Errorf("ошибка миграции %d: %w", i+1, err)
		}
	}

	log.Println("Миграции применены успешно")
	return nil
}
