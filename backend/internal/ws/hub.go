package ws

import (
	"backend/internal/database"
	"backend/internal/repository"
	"log"
	"sync"
)

type Hub struct {
	clients     map[*Client]bool
	register    chan *Client
	unregister  chan *Client
	broadcast   chan Message
	mu          sync.Mutex
	messageRepo database.MessageRepository
}

var hubInstance *Hub
var once sync.Once

func GetHub() *Hub {
	once.Do(func() {
		hubInstance = &Hub{
			clients:     make(map[*Client]bool),
			register:    make(chan *Client),
			unregister:  make(chan *Client),
			broadcast:   make(chan Message, 256),
			messageRepo: repository.NewMessageRepository(),
		}
		log.Println("Hub инициализирован с БД поддержкой")
	})
	return hubInstance
}

func (h *Hub) Run() {
	log.Println("Hub запущен и ожидает соединения...")

	for {
		select {
		case client := <-h.register:
			h.mu.Lock()

			for existingClient := range h.clients {
				if existingClient.UserID == client.UserID {
					delete(h.clients, existingClient)
					close(existingClient.Send)
					log.Printf("Отключено предыдущее соединение пользователя %s", client.UserID)
				}
			}

			h.clients[client] = true
			h.mu.Unlock()
			log.Printf("Клиент %s подключен. Всего клиентов: %d",
				client.UserID, len(h.clients))

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.Send)
				log.Printf("Клиент %s отключен. Осталось клиентов: %d",
					client.UserID, len(h.clients))
			}
			h.mu.Unlock()

		case msg := <-h.broadcast:
			dbMessage := msg.ToDBMessage()
			if err := h.messageRepo.Save(dbMessage); err != nil {
				log.Printf("Ошибка сохранения сообщения в БД: %v", err)
			}

			h.mu.Lock()
			delivered := false
			for client := range h.clients {
				if client.UserID == msg.To {
					select {
					case client.Send <- msg:
						delivered = true
						log.Printf("Сообщение доставлено пользователю %s", msg.To)
						break
					default:
						delete(h.clients, client)
						close(client.Send)
						log.Printf("Отключен неотвечающий клиент: %s", client.UserID)
					}
				}
			}
			if !delivered {
				log.Printf("Пользователь %s оффлайн, сообщение сохранено в БД", msg.To)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) GetConnectedUsers() []string {
	h.mu.Lock()
	defer h.mu.Unlock()

	users := make([]string, 0, len(h.clients))
	for client := range h.clients {
		users = append(users, client.UserID)
	}
	return users
}

func (h *Hub) GetChatHistory(user1, user2 string, limit int) ([]Message, error) {
	dbMessages, err := h.messageRepo.GetChatHistory(user1, user2, limit)
	if err != nil {
		return nil, err
	}

	messages := make([]Message, len(dbMessages))
	for i, dbMsg := range dbMessages {
		messages[i] = *FromDBMessage(&dbMsg)
	}

	return messages, nil
}

func (h *Hub) GetBroadcastChannel() chan<- Message {
	return h.broadcast
}
