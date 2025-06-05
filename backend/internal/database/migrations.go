package database

import (
	"backend/internal/config"
	"fmt"
	"log"
)

func runMigrations(cfg *config.DatabaseConfig) error {
	log.Println("Применение миграций...")

	// Миграция 1: Создание таблицы пользователей
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
		last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	// Миграция 2: Индексы для таблицы пользователей
	createUsersIndexes := `
	CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
	CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users (last_seen);`

	// Миграция 3: Создание таблицы сообщений (сначала без внешних ключей)
	createMessagesTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		from_user VARCHAR(255), 
		to_user VARCHAR(255),   
		message TEXT NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
	);`

	// Миграция 4: Добавление колонок user_id (если их нет)
	addUserIdColumns := `
	ALTER TABLE messages 
	ADD COLUMN IF NOT EXISTS from_user_id INTEGER,
	ADD COLUMN IF NOT EXISTS to_user_id INTEGER;`

	// Миграция 5: Добавление внешних ключей (если их нет)
	addForeignKeys := `
	DO $$ 
	BEGIN
		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_name = 'messages_from_user_id_fkey' 
			AND table_name = 'messages'
		) THEN
			ALTER TABLE messages 
			ADD CONSTRAINT messages_from_user_id_fkey 
			FOREIGN KEY (from_user_id) REFERENCES users(id);
		END IF;

		IF NOT EXISTS (
			SELECT 1 FROM information_schema.table_constraints 
			WHERE constraint_name = 'messages_to_user_id_fkey' 
			AND table_name = 'messages'
		) THEN
			ALTER TABLE messages 
			ADD CONSTRAINT messages_to_user_id_fkey 
			FOREIGN KEY (to_user_id) REFERENCES users(id);
		END IF;
	END $$;`

	// Миграция 6: Индексы для таблицы сообщений
	createMessagesIndexes := `
	CREATE INDEX IF NOT EXISTS idx_messages_from_user_id ON messages (from_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user_id ON messages (to_user_id);
	CREATE INDEX IF NOT EXISTS idx_messages_from_user ON messages (from_user);
	CREATE INDEX IF NOT EXISTS idx_messages_to_user ON messages (to_user);
	CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);`

	// Применяем миграции по порядку
	migrations := []struct {
		name string
		sql  string
	}{
		{"Создание таблицы users", createUsersTable},
		{"Индексы для users", createUsersIndexes},
		{"Создание таблицы messages", createMessagesTable},
		{"Добавление колонок user_id", addUserIdColumns},
		{"Добавление внешних ключей", addForeignKeys},
		{"Индексы для messages", createMessagesIndexes},
	}

	for i, migration := range migrations {
		log.Printf("Выполнение миграции %d: %s", i+1, migration.name)
		if _, err := DB.Exec(migration.sql); err != nil {
			return fmt.Errorf("ошибка миграции %d (%s): %w", i+1, migration.name, err)
		}
		log.Printf("Миграция %d выполнена успешно", i+1)
	}

	log.Println("Все миграции применены успешно")
	return nil
}
