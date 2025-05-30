# Используем официальный образ Nginx
FROM nginx:alpine

# Копируем HTML файлы в директорию Nginx
COPY . /usr/share/nginx/html/

# Копируем кастомную конфигурацию Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Открываем порт 80
EXPOSE 80

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"] 