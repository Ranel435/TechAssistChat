package database

import (
	"backend/internal/config"
	"backend/internal/queries"
	"fmt"
	"log"
)

func runMigrations(cfg *config.DatabaseConfig) error {
	log.Println("Применение миграций...")

	migrations := []struct {
		name string
		sql  string
	}{
		{"Создание таблицы users...", queries.CreateUsersTableQuery},
		{"Индексы для users...", queries.CreateUsersIndexesQuery},
		{"Создание таблицы messages...", queries.CreateMessagesTableQuery},
		{"Добавление колонок user_id...", queries.AddUserIdColumnsQuery},
		{"Добавление внешних ключей...", queries.AddForeignKeysQuery},
		{"Индексы для messages...", queries.CreateMessagesIndexesQuery},
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
