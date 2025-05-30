.PHONY: build up down restart logs clean dev stop

# Сборка всех образов
build:
	docker-compose build --no-cache

# Запуск всех сервисов
up:
	docker-compose up -d

# Запуск с выводом логов
dev:
	docker-compose up

# Остановка всех сервисов
down:
	docker-compose down

# Остановка с удалением volumes
stop:
	docker-compose down -v

# Перезапуск всех сервисов
restart:
	docker-compose restart

# Просмотр логов
logs:
	docker-compose logs -f

# Логи конкретного сервиса
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-postgres:
	docker-compose logs -f postgres

# Очистка Docker системы
clean:
	docker-compose down -v --rmi all
	docker system prune -f

# Проверка статуса
status:
	docker-compose ps

# Вход в контейнер backend
shell-backend:
	docker-compose exec backend sh

# Вход в контейнер postgres
shell-postgres:
	docker-compose exec postgres psql -U postgres -d techassistchat

# Полная пересборка и запуск
rebuild: clean build up

# Быстрый перезапуск только backend
restart-backend:
	docker-compose restart backend

# Быстрый перезапуск только frontend
restart-frontend:
	docker-compose restart frontend 