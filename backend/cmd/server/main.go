package main

import (
	"backend/internal/config"
	"backend/internal/database"
	"backend/internal/routes"
	"backend/internal/ws"
	"log"
)

func main() {
	cfg := config.LoadConfig()

	if err := database.InitDB(&cfg.Database); err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer database.CloseDB()

	hub := ws.GetHub()
	go hub.Run()

	router := routes.SetupRoutes(hub)

	log.Printf("Сервер запущен на порту %s", cfg.Port)
	if err := router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}
