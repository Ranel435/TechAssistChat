# КУРСОВАЯ РАБОТА

## Тема: "Разработка веб-приложения для обмена сообщениями в реальном времени на основе технологии WebSocket"

### Выполнил: Хаметшин Ранэль
### Группа: БПМ-24-3
### Преподаватель: Киселев Станислав

---

## СОДЕРЖАНИЕ

1. [Введение](#введение)
2. [Теоретическая часть](#теоретическая-часть)
3. [Постановка задачи](#постановка-задачи)
4. [Архитектура системы](#архитектура-системы)
5. [Реализация](#реализация)
6. [Тестирование](#тестирование)
7. [Развертывание](#развертывание)
8. [Заключение](#заключение)
9. [Список использованных источников](#список-использованных-источников)
10. [Приложения](#приложения)

---

## ВВЕДЕНИЕ

### Актуальность темы

В современном мире мгновенного обмена информацией веб-приложения для общения в реальном времени играют ключевую роль. Технология WebSocket предоставляет эффективное решение для создания интерактивных приложений, обеспечивая двустороннюю связь между клиентом и сервером с минимальными задержками.

### Цель работы

Разработать полнофункциональное веб-приложение для обмена сообщениями в реальном времени с использованием технологии WebSocket, демонстрирующее принципы работы с сокетами, архитектуру современных веб-приложений и методы обеспечения надежности передачи данных.

### Задачи

1. Изучить принципы работы протокола WebSocket
2. Спроектировать архитектуру системы чата
3. Реализовать серверную часть на языке Go с использованием Gin Framework
4. Создать клиентскую часть на React.js
5. Интегрировать базу данных PostgreSQL для хранения истории сообщений
6. Настроить контейнеризацию с помощью Docker
7. Протестировать функциональность системы
8. Развернуть приложение

### Объект и предмет исследования

**Объект исследования:** Веб-технологии для создания приложений реального времени

**Предмет исследования:** Протокол WebSocket и его применение для разработки чат-приложений

---

## ТЕОРЕТИЧЕСКАЯ ЧАСТЬ

### WebSocket протокол

WebSocket — это протокол связи, обеспечивающий полнодуплексную связь между клиентом и сервером через одно TCP-соединение. В отличие от традиционного HTTP, WebSocket позволяет серверу инициировать передачу данных клиенту.

#### Преимущества WebSocket:

1. **Низкая задержка** - постоянное соединение устраняет накладные расходы на установку соединения
2. **Двусторонняя связь** - сервер может отправлять данные клиенту в любое время
3. **Эффективность** - меньше заголовков по сравнению с HTTP polling
4. **Реальное время** - мгновенная доставка сообщений

#### Жизненный цикл WebSocket соединения:

```
1. Handshake (HTTP Upgrade) - установка соединения
2. Data Transfer - обмен сообщениями
3. Closing - закрытие соединения
```

### Архитектурные паттерны

#### Hub Pattern (Концентратор)

Паттерн Hub используется для управления множественными WebSocket соединениями:
- Централизованное управление соединениями
- Маршрутизация сообщений между клиентами
- Отслеживание состояния пользователей

#### Repository Pattern

Паттерн Repository обеспечивает абстракцию доступа к данным:
- Инкапсуляция логики доступа к базе данных
- Упрощение тестирования
- Возможность смены источника данных

---

## ПОСТАНОВКА ЗАДАЧИ

### Функциональные требования

1. **Авторизация пользователей**
   - Вход по имени пользователя
   - Отображение статуса "онлайн/оффлайн"

2. **Обмен сообщениями**
   - Отправка текстовых сообщений в реальном времени
   - Уведомления о доставке сообщений
   - Отображение времени отправки

3. **Управление чатами**
   - Создание новых чатов
   - Просмотр списка активных чатов
   - История переписки

4. **Интерфейс пользователя**
   - Интуитивно понятный дизайн
   - Адаптивная верстка для мобильных устройств
   - Визуальные индикаторы состояния

### Нефункциональные требования

1. **Надежность**
   - Автоматическое переподключение при разрыве связи
   - Сохранение сообщений в базе данных

2. **Безопасность**
   - Валидация входящих данных
   - Защита от XSS атак

3. **Масштабируемость**
   - Контейнеризация приложения
   - Возможность развертывания на разных окружениях

---

## АРХИТЕКТУРА СИСТЕМЫ

### Общая архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Go Backend    │◄──►│   PostgreSQL    │
│                 │    │                 │    │                 │
│ - UI Components │    │ - WebSocket Hub │    │ - Messages      │
│ - WebSocket     │    │ - HTTP API      │    │ - Chat History  │
│ - State Mgmt    │    │ - Database      │    │ - Users         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Серверная архитектура (Go)

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # Точка входа
├── internal/
│   ├── config/                  # Конфигурация
│   ├── database/                # Подключение к БД и миграции
│   ├── handlers/                # HTTP обработчики
│   ├── middleware/              # Промежуточное ПО
│   ├── models/                  # Модели данных
│   ├── repository/              # Репозитории для работы с БД
│   ├── routes/                  # Маршруты
│   └── ws/                      # WebSocket логика
│       ├── hub.go              # Концентратор соединений
│       ├── client.go           # Клиентские соединения
│       └── message.go          # Модели сообщений
└── pkg/                         # Общие пакеты
```

### Клиентская архитектура (React)

```
react-frontend/
├── public/
├── src/
│   ├── components/              # React компоненты
│   ├── hooks/                   # Пользовательские хуки
│   ├── utils/                   # Утилиты
│   ├── App.js                   # Главный компонент
│   ├── App.css                  # Стили
│   └── index.js                 # Точка входа
└── package.json
```

---

## РЕАЛИЗАЦИЯ

### Backend (Go)

#### WebSocket Hub

```go
type Hub struct {
    clients    map[*Client]bool     // Активные клиенты
    broadcast  chan Message         // Канал для рассылки
    register   chan *Client         // Регистрация клиентов
    unregister chan *Client         // Отключение клиентов
    repository repository.MessageRepository
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.registerClient(client)
            
        case client := <-h.unregister:
            h.unregisterClient(client)
            
        case message := <-h.broadcast:
            h.broadcastMessage(message)
        }
    }
}
```

#### WebSocket Client

```go
type Client struct {
    Hub    *Hub
    Conn   *websocket.Conn
    Send   chan Message
    UserID string
}

func (c *Client) ReadPump() {
    defer func() {
        c.Hub.unregister <- c
        c.Conn.Close()
    }()
    
    for {
        var message Message
        err := c.Conn.ReadJSON(&message)
        if err != nil {
            break
        }
        
        message.From = c.UserID
        c.Hub.broadcast <- message
    }
}
```

#### Database Repository

```go
type MessageRepository interface {
    SaveMessage(message *models.Message) error
    GetChatHistory(user1, user2 string, limit int) ([]models.Message, error)
    GetUserChats(username string) ([]models.ChatPreview, error)
}

func (r *messageRepository) SaveMessage(message *models.Message) error {
    query := `
        INSERT INTO messages (from_user, to_user, message, created_at) 
        VALUES ($1, $2, $3, $4) RETURNING id`
    
    return r.db.QueryRow(query, 
        message.FromUser, 
        message.ToUser, 
        message.Message, 
        time.Now(),
    ).Scan(&message.ID)
}
```

### Frontend (React)

#### WebSocket Connection

```javascript
const connectWebSocket = () => {
    const websocket = new WebSocket(`ws://localhost:8080/ws?user=${username}`);
    
    websocket.onopen = () => {
        setIsConnected(true);
        setWs(websocket);
    };
    
    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        addMessage(data.from, data.to, data.message, 'received');
    };
    
    websocket.onclose = () => {
        setIsConnected(false);
        setWs(null);
        // Автоматическое переподключение
        setTimeout(connectWebSocket, 3000);
    };
};
```

#### Message Component

```jsx
const Message = ({ message }) => {
    return (
        <div className={`message ${message.type}`}>
            <div className="chat-message">
                <div className="message-content">
                    {message.message}
                </div>
                <div className="message-time">
                    {formatTime(message.timestamp)}
                </div>
            </div>
        </div>
    );
};
```

### Database Schema

```sql
-- Таблица сообщений
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    from_user VARCHAR(255) NOT NULL,
    to_user VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_from_user ON messages(from_user);
CREATE INDEX idx_to_user ON messages(to_user);
CREATE INDEX idx_created_at ON messages(created_at);
CREATE INDEX idx_chat_participants ON messages(from_user, to_user, created_at);
```

---

## ТЕСТИРОВАНИЕ

### Функциональное тестирование

#### Тестирование WebSocket соединения

1. **Установка соединения**
   - Подключение к серверу с валидным именем пользователя
   - Проверка статуса соединения

2. **Отправка сообщений**
   - Отправка текстового сообщения
   - Получение подтверждения доставки

3. **Получение сообщений**
   - Получение сообщений от других пользователей
   - Корректное отображение в интерфейсе

#### Тестирование API endpoints

1. **GET /api/chats/{username}**
   - Получение списка чатов пользователя
   - Проверка формата ответа

2. **GET /api/chat/{user1}/{user2}**
   - Загрузка истории переписки
   - Корректная сортировка по времени

3. **POST /api/chat**
   - Создание нового чата
   - Валидация входных данных

#### Тестирование пользовательского интерфейса

1. **Адаптивность**
   - Корректное отображение на мобильных устройствах
   - Масштабирование элементов интерфейса

2. **Интерактивность**
   - Работа кнопок и форм
   - Визуальная обратная связь

### Интеграционное тестирование

1. **Взаимодействие компонентов**
   - Frontend ↔ Backend через WebSocket
   - Backend ↔ Database

2. **Сохранение данных**
   - Сообщения сохраняются в базе данных
   - История загружается корректно

3. **Обработка ошибок**
   - Разрыв соединения
   - Ошибки базы данных
   - Некорректные данные

### Результаты тестирования

- ✅ WebSocket соединения устанавливаются стабильно
- ✅ Сообщения доставляются в реальном времени
- ✅ История чатов сохраняется и загружается корректно
- ✅ Автоматическое переподключение работает
- ✅ Интерфейс адаптивен для мобильных устройств
- ✅ CORS настроен правильно для cross-origin запросов

---

## РАЗВЕРТЫВАНИЕ

### Docker контейнеризация

#### Backend Dockerfile

```dockerfile
FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/server

FROM alpine:latest
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/

COPY --from=builder /app/main .
CMD ["./main"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

#### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: techassistchat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: techassistchat
    ports:
      - "8080:8080"

  frontend:
    build: ./react-frontend
    depends_on:
      - backend
    ports:
      - "3001:80"

volumes:
  postgres_data:
```

### Команды развертывания

```bash
# Сборка и запуск
make build
make up

# Просмотр логов
make logs

# Остановка
make down

# Полная пересборка
make rebuild
```

---

## ЗАКЛЮЧЕНИЕ

### Результаты работы

В ходе выполнения курсовой работы было разработано полнофункциональное веб-приложение для обмена сообщениями в реальном времени. Основные достижения:

1. **Изучены принципы работы WebSocket**
   - Протокол установки соединения
   - Обмен данными в реальном времени
   - Управление жизненным циклом соединения

2. **Реализована современная архитектура**
   - Микросервисная архитектура
   - Разделение на слои (handlers, services, repositories)
   - Использование паттернов проектирования

3. **Созданы компоненты системы**
   - Серверная часть на Go с Gin Framework
   - Клиентская часть на React.js
   - База данных PostgreSQL
   - Контейнеризация с Docker

4. **Обеспечена надежность**
   - Автоматическое переподключение
   - Сохранение истории сообщений
   - Обработка ошибок

### Полученные навыки

- Работа с WebSocket протоколом
- Разработка на Go и React.js
- Архитектурное проектирование
- Работа с базами данных
- Контейнеризация приложений
- Тестирование веб-приложений

### Возможные улучшения

1. **Функциональные**
   - Групповые чаты
   - Отправка файлов
   - Эмодзи и стикеры
   - Push уведомления

2. **Технические**
   - Horizontal scaling с Redis
   - Message queue для надежности
   - End-to-end шифрование
   - Мобильное приложение

3. **Производительность**
   - Оптимизация запросов к БД
   - Кеширование с Redis
   - CDN для статических файлов
   - Load balancing

### Выводы

Технология WebSocket показала себя как эффективное решение для создания приложений реального времени. Go язык продемонстрировал отличную производительность для серверных приложений, а React.js обеспечил создание современного пользовательского интерфейса.

Полученный опыт может быть применен при разработке различных типов приложений реального времени: онлайн-игр, коллаборативных редакторов, систем мониторинга и других интерактивных веб-приложений.

---

## СПИСОК ИСПОЛЬЗОВАННЫХ ИСТОЧНИКОВ

1. RFC 6455 - The WebSocket Protocol // IETF. - 2011
2. Golang Official Documentation // https://golang.org/doc/
3. React.js Documentation // https://reactjs.org/docs/
4. PostgreSQL Documentation // https://www.postgresql.org/docs/
5. Docker Documentation // https://docs.docker.com/
6. Gin Web Framework // https://gin-gonic.com/docs/
7. Gorilla WebSocket // https://github.com/gorilla/websocket
8. WebSocket API - Web APIs | MDN // Mozilla Developer Network

---

## ПРИЛОЖЕНИЯ

### Приложение А. Структура проекта

```
TechAssistChat/
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/
│   │   ├── database/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repository/
│   │   ├── routes/
│   │   └── ws/
│   └── Dockerfile
├── react-frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── README.md
```

### Приложение Б. Команды для работы с проектом

```bash
# Основные команды
make build      # Сборка Docker образов
make up         # Запуск всех сервисов
make down       # Остановка всех сервисов
make rebuild    # Полная пересборка
make logs       # Просмотр логов
make status     # Статус контейнеров
```

---

**Дата:** [Текущая дата]
**Подпись студента:** _______________
**Оценка:** _______________
**Подпись преподавателя:** _______________