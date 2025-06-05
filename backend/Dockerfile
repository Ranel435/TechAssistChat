# Многоэтапная сборка для оптимизации размера образа
FROM golang:1.23-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Настройка Go proxy и переменных окружения
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org
ENV GO111MODULE=on
ENV CGO_ENABLED=0
ENV GOOS=linux

# Установка git для возможности загрузки зависимостей
RUN apk add --no-cache git ca-certificates

# Копируем go mod файлы для кеширования зависимостей
COPY go.mod go.sum ./

# Скачиваем зависимости с retry логикой
RUN go mod download || \
    (sleep 5 && go mod download) || \
    (sleep 10 && go mod download) || \
    (echo "Fallback to direct mode" && GOPROXY=direct go mod download)

# Копируем исходный код
COPY . .

# Добавляем недостающие зависимости
RUN go get golang.org/x/crypto/bcrypt
RUN go get github.com/golang-jwt/jwt/v5
RUN go get github.com/lib/pq

# Обновляем модули
RUN go mod tidy

# Собираем приложение
RUN go build -a -installsuffix cgo -ldflags="-w -s" -o main ./cmd/server

# Финальный образ
FROM alpine:latest

# Устанавливаем ca-certificates для HTTPS запросов
RUN apk --no-cache add ca-certificates tzdata wget

# Создаем непривилегированного пользователя
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

WORKDIR /root/

# Копируем собранное приложение из builder стадии
COPY --from=builder /app/main .

# Меняем владельца файлов
RUN chown -R appuser:appgroup /root/

# Переключаемся на непривилегированного пользователя
USER appuser

# Открываем порт
EXPOSE 8080

# Healthcheck для проверки состояния
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Запускаем приложение
CMD ["./main"] 