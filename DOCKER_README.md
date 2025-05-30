# 🐳 TechAssistChat - Docker Development

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   PostgreSQL    │
│   (Nginx)       │    │   (Go/Gin)      │    │                 │
│   Port: 3000    │◄──►│   Port: 8080    │◄──►│   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Быстрый старт

### 1. Сборка и запуск всех сервисов:
```bash
make build
make up
```

### 2. Проверка статуса:
```bash
make status
```

### 3. Просмотр логов:
```bash
make logs
```

## 📱 Доступ к приложению

- **Frontend (Chat UI)**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Health Check**: http://localhost:8080/health
- **PostgreSQL**: localhost:5432

## 🛠️ Команды разработки

| Команда | Описание |
|---------|----------|
| `make build` | Сборка всех Docker образов |
| `make up` | Запуск всех сервисов в фоне |
| `make dev` | Запуск с выводом логов |
| `make down` | Остановка всех сервисов |
| `make restart` | Перезапуск всех сервисов |
| `make logs` | Просмотр логов всех сервисов |
| `make clean` | Полная очистка (удаление образов и данных) |

### Команды для отдельных сервисов:

```bash
# Логи конкретного сервиса
make logs-backend
make logs-frontend  
make logs-postgres

# Перезапуск конкретного сервиса
make restart-backend
make restart-frontend

# Вход в контейнер
make shell-backend
make shell-postgres
```

## 🗃️ База данных

PostgreSQL автоматически инициализируется с:
- **Database**: `techassistchat`
- **User**: `postgres` 
- **Password**: `password`

### Подключение к БД:
```bash
make shell-postgres
```

## 🔧 Конфигурация

### Environment переменные (в docker-compose.yml):

**Backend:**
- `DB_HOST=postgres`
- `DB_PORT=5432`
- `DB_USER=postgres`
- `DB_PASSWORD=password`
- `DB_NAME=techassistchat`
- `SERVER_PORT=8080`

## 📊 Healthchecks

Все сервисы имеют healthcheck:
- **Backend**: `GET /health`
- **Frontend**: `GET /`
- **PostgreSQL**: `pg_isready`

## 🐛 Отладка

### Проблемы с подключением:
```bash
# Проверить статус всех контейнеров
docker ps

# Проверить логи
make logs

# Проверить health
docker-compose ps
```

### Очистка и пересборка:
```bash
make clean
make rebuild
```

## 📝 Структура проекта

```
TechAssistChat/
├── backend/
│   ├── Dockerfile                 # Go приложение
│   ├── .dockerignore
│   └── ...
├── frontend/
│   ├── Dockerfile                 # Nginx + HTML
│   ├── nginx.conf
│   ├── .dockerignore
│   └── test_chat.html
├── docker-compose.yml             # Оркестрация всех сервисов
├── Makefile                       # Команды разработки
└── DOCKER_README.md              # Эта документация
```

## 🚨 Production готовность

Для production измените:

1. **Переменные окружения** в docker-compose.yml
2. **Secrets** вместо plain text паролей
3. **Volumes** для persistent данных
4. **Network security** настройки
5. **SSL/TLS** сертификаты
6. **Load balancer** для масштабирования

## ✅ Тестирование

1. Откройте http://localhost:3000
2. Введите имя пользователя (например, `user1`)
3. Нажмите "Подключиться"
4. Откройте еще одну вкладку с именем `user2`
5. Отправьте сообщение между пользователями

Сообщения автоматически сохраняются в PostgreSQL! 