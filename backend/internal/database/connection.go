package database

import (
	"backend/internal/config"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB(cfg *config.DatabaseConfig) error {
	var err error

	log.Printf("Подключение к БД: %s:%s/%s", cfg.Host, cfg.Port, cfg.DBName)

	DB, err = sql.Open("postgres", cfg.GetDSN())
	if err != nil {
		return fmt.Errorf("Ошибка открытия БД: %w", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("Ошибка подключения к БД: %w", err)
	}

	log.Println("Успешное подключение к PostgreSQL")

	if err = runMigrations(cfg); err != nil {
		return fmt.Errorf("Ошибка миграций: %w", err)
	}

	return nil
}

func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}
