import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';
const WS_URL = process.env.NODE_ENV === 'production' ? 
  `ws://${window.location.host}/ws` : 'ws://localhost:8080/ws';

// Simple icons as SVG components
const MessageIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22,2 15,22 11,13 2,9 22,2"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const WifiIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

const WifiOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="2" y1="2" x2="22" y2="22"/>
    <path d="M8.5 16.5a5 5 0 0 1 7 0"/>
    <path d="M2 8.82a16 16 0 0 1 5.78-2.78"/>
    <path d="M10.78 5.04a16 16 0 0 1 11.48 7.78"/>
    <path d="M5 12.55a11 11 0 0 1 5.22-2.55"/>
    <line x1="12" y1="20" x2="12.01" y2="20"/>
  </svg>
);

function App() {
  const [username, setUsername] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatUser, setNewChatUser] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isConnected && username) {
      loadChats();
      loadOnlineUsers();
    }
  }, [isConnected, username]);

  // Безопасная функция форматирования времени
  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      // Обрабатываем разные форматы времени
      let date;
      if (typeof timestamp === 'string') {
        // Если строка пустая или только пробелы
        if (!timestamp.trim()) return '';
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return '';
      }
      
      // Проверяем валидность даты
      if (isNaN(date.getTime())) {
        console.warn('Невалидная дата:', timestamp);
        return '';
      }
      
      return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      console.error('Ошибка форматирования времени:', error, 'timestamp:', timestamp);
      return '';
    }
  };

  // Безопасная функция форматирования даты
  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return '';
      
      let date;
      if (typeof timestamp === 'string') {
        if (!timestamp.trim()) return '';
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return '';
      }
      
      if (isNaN(date.getTime())) {
        console.warn('Невалидная дата для formatDate:', timestamp);
        return '';
      }
      
      const now = new Date();
      const isToday = now.toDateString() === date.toDateString();
      
      if (isToday) {
        return formatTime(date);
      } else {
        return new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(date);
      }
    } catch (error) {
      console.error('Ошибка форматирования даты:', error, 'timestamp:', timestamp);
      return '';
    }
  };

  const connect = () => {
    if (!username.trim()) {
      alert('Введите ваше имя');
      return;
    }

    const websocket = new WebSocket(`${WS_URL}?user=${encodeURIComponent(username)}`);
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
      console.log(`✅ Подключен как ${username}`);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Получено сообщение:', data);
        addMessage(data.from, data.to, data.message, 'received');
        
        if (data.to === username) {
          setTimeout(() => loadChats(), 500);
        }
      } catch (error) {
        console.error('❌ Ошибка парсинга сообщения:', error);
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
      console.log('🔴 Соединение закрыто');
    };

    websocket.onerror = (error) => {
      console.error('❌ WebSocket ошибка:', error);
    };
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
    }
    setCurrentChat(null);
    setMessages([]);
    setChats([]);
  };

  const loadChats = async () => {
    if (!username) return;

    try {
      console.log(`📋 Загружаем чаты для ${username}`);
      const url = `${API_BASE}/api/chats/${username}`;
      console.log(`🔗 URL: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 Статус ответа: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Полученные чаты:', data);
      
      if (data.chats && Array.isArray(data.chats)) {
        setChats(data.chats);
      } else {
        console.log('📋 Чаты не найдены или неверный формат');
        setChats([]);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки чатов:', error);
      setChats([]);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users/online`);
      if (response.ok) {
        const data = await response.json();
        if (data.users) {
          setOnlineUsers(data.users.filter(user => user !== username));
        }
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки онлайн пользователей:', error);
    }
  };

  const selectChat = async (otherUser) => {
    console.log(`🔄 Выбираем чат с ${otherUser}`);
    
    setCurrentChat(otherUser);
    setLoading(true);
    
    // Показываем загрузку
    setMessages([{
      id: 'loading',
      message: `💬 Загружаем чат с ${otherUser}...`,
      timestamp: new Date(),
      type: 'system'
    }]);

    try {
      const url = `${API_BASE}/api/chat/${username}/${otherUser}`;
      console.log(`📡 Запрос истории: ${url}`);
      
      const response = await fetch(url);
      console.log(`📡 Статус ответа: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📨 Полученные данные чата:', data);
      
      // Создаем массив сообщений
      const newMessages = [{
        id: 'header',
        message: `💬 Чат с ${otherUser}`,
        timestamp: new Date(),
        type: 'system'
      }];
      
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        console.log(`📝 Найдено ${data.messages.length} сообщений`);
        
        data.messages.forEach((msg, index) => {
          try {
            const type = msg.from === username ? 'sent' : 'received';
            
            // Безопасное создание timestamp
            let timestamp;
            if (msg.created_at) {
              timestamp = new Date(msg.created_at);
              if (isNaN(timestamp.getTime())) {
                console.warn('Невалидная дата сообщения:', msg.created_at);
                timestamp = new Date();
              }
            } else {
              timestamp = new Date();
            }
            
            newMessages.push({
              id: msg.id || `msg-${index}-${Date.now()}`,
              from: msg.from,
              to: msg.to,
              message: msg.message,
              timestamp: timestamp,
              type
            });
          } catch (msgError) {
            console.error('❌ Ошибка обработки сообщения:', msgError, msg);
          }
        });
      } else {
        console.log('📝 Сообщений не найдено');
        newMessages.push({
          id: 'empty',
          message: 'Здесь пока нет сообщений. Напишите что-нибудь!',
          timestamp: new Date(),
          type: 'system'
        });
      }
      
      setMessages(newMessages);
      
    } catch (error) {
      console.error('❌ Ошибка загрузки чата:', error);
      setMessages([
        {
          id: 'error-header',
          message: `💬 Чат с ${otherUser}`,
          timestamp: new Date(),
          type: 'system'
        },
        {
          id: 'error',
          message: `❌ Ошибка загрузки: ${error.message}`,
          timestamp: new Date(),
          type: 'system'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!ws || !isConnected || !currentChat || !message.trim()) {
      console.log('❌ Не можем отправить сообщение:', {
        hasWs: !!ws,
        isConnected,
        currentChat,
        messageLength: message.trim().length
      });
      return;
    }

    const messageData = {
      to: currentChat,
      message: message.trim()
    };

    try {
      console.log('📤 Отправляем сообщение:', messageData);
      ws.send(JSON.stringify(messageData));
      addMessage(username, currentChat, message.trim(), 'sent');
      setMessage('');
      messageInputRef.current?.focus();
      
      setTimeout(() => loadChats(), 500);
    } catch (error) {
      console.error('❌ Ошибка отправки:', error);
    }
  };

  const createNewChat = async () => {
    if (!newChatUser.trim() || !newChatMessage.trim()) {
      alert('Заполните все поля');
      return;
    }

    if (newChatUser === username) {
      alert('Нельзя создать чат с самим собой');
      return;
    }

    try {
      console.log('🆕 Создаем новый чат');
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: username,
          to: newChatUser.trim(),
          message: newChatMessage.trim()
        })
      });

      if (response.ok) {
        console.log('✅ Чат создан успешно');
        setShowNewChatForm(false);
        setNewChatUser('');
        setNewChatMessage('');
        
        setTimeout(() => {
          loadChats();
          selectChat(newChatUser.trim());
        }, 500);
      } else {
        const errorText = await response.text();
        console.error('❌ Ошибка создания чата:', response.status, errorText);
        alert(`Ошибка создания чата: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Ошибка создания чата:', error);
      alert('Ошибка сети при создании чата');
    }
  };

  const addMessage = (from, to, text, type) => {
    const newMessage = {
      id: `${Date.now()}-${Math.random()}`,
      from,
      to,
      message: text,
      timestamp: new Date(),
      type
    };
    console.log('➕ Добавляем сообщение:', newMessage);
    setMessages(prev => [...prev, newMessage]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Тестируем подключение к API при загрузке
  useEffect(() => {
    const testAPI = async () => {
      try {
        const response = await fetch(`${API_BASE}/health`);
        if (response.ok) {
          console.log('✅ API доступен');
        } else {
          console.log('⚠️ API недоступен:', response.status);
        }
      } catch (error) {
        console.error('❌ Ошибка соединения с API:', error);
      }
    };
    testAPI();
  }, []);

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="logo">
              <MessageIcon />
              <h1>TechAssistChat</h1>
            </div>
            <div className="header-info">
              {username && <span className="username">👋 {username}</span>}
              <div className="connection-status">
                {isConnected ? (
                  <div className="status connected">
                    <WifiIcon />
                    <span>Онлайн</span>
                  </div>
                ) : (
                  <div className="status disconnected">
                    <WifiOffIcon />
                    <span>Оффлайн</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Sidebar */}
          <aside className="sidebar">
            {!isConnected ? (
              <div className="login-form">
                <h3>Войти в чат</h3>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Ваше имя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && connect()}
                    className="input"
                  />
                  <button onClick={connect} className="btn btn-primary">
                    Подключиться
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="sidebar-header">
                  <h3>Чаты ({chats.length})</h3>
                  <button 
                    onClick={() => setShowNewChatForm(true)}
                    className="new-chat-btn"
                    title="Создать новый чат"
                  >
                    +
                  </button>
                </div>

                {/* New Chat Form */}
                {showNewChatForm && (
                  <div className="new-chat-form">
                    <h4>Новый чат</h4>
                    <input
                      type="text"
                      placeholder="Имя пользователя"
                      value={newChatUser}
                      onChange={(e) => setNewChatUser(e.target.value)}
                      className="input"
                    />
                    <textarea
                      placeholder="Первое сообщение"
                      value={newChatMessage}
                      onChange={(e) => setNewChatMessage(e.target.value)}
                      className="input"
                      rows={2}
                    />
                    <div className="form-buttons">
                      <button onClick={createNewChat} className="btn btn-primary">
                        Создать
                      </button>
                      <button 
                        onClick={() => {
                          setShowNewChatForm(false);
                          setNewChatUser('');
                          setNewChatMessage('');
                        }}
                        className="btn btn-secondary"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}

                {/* Chats List */}
                <div className="chats-list">
                  {chats.length === 0 ? (
                    <div className="empty-chats">
                      <p>Нет чатов</p>
                      <small>Создайте новый чат чтобы начать общение</small>
                    </div>
                  ) : (
                    chats.map((chat, index) => (
                      <div
                        key={`chat-${index}-${chat.user}`}
                        className={`chat-item ${currentChat === chat.user ? 'active' : ''}`}
                        onClick={() => selectChat(chat.user)}
                      >
                        <div className="chat-avatar">
                          <UserIcon />
                          {onlineUsers.includes(chat.user) && (
                            <div className="online-indicator"></div>
                          )}
                        </div>
                        <div className="chat-info">
                          <div className="chat-name">{chat.user}</div>
                          <div className="chat-last-message">
                            {chat.last_message && chat.last_message.length > 30 
                              ? chat.last_message.substring(0, 30) + '...'
                              : chat.last_message || 'Нет сообщений'}
                          </div>
                        </div>
                        <div className="chat-time">
                          {formatDate(chat.last_message_time)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="sidebar-footer">
                  <button onClick={disconnect} className="btn btn-secondary">
                    Выйти
                  </button>
                </div>
              </>
            )}
          </aside>

          {/* Chat Area */}
          <main className="chat-area">
            {!currentChat ? (
              <div className="empty-state">
                <MessageIcon />
                <h3>Выберите чат</h3>
                <p>Выберите чат из списка или создайте новый</p>
              </div>
            ) : (
              <>
                <div className="chat-header">
                  <div className="chat-header-info">
                    <h3>{currentChat}</h3>
                    {onlineUsers.includes(currentChat) && (
                      <span className="online-badge">🟢 онлайн</span>
                    )}
                    {loading && <span className="loading-badge">⏳ загрузка...</span>}
                  </div>
                </div>

                <div className="messages-container">
                  <div className="messages">
                    {messages.length === 0 ? (
                      <div className="empty-messages">
                        <p>Загружаем сообщения...</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`message ${msg.type}`}>
                          {msg.type === 'system' ? (
                            <div className="system-message">
                              <span>{msg.message}</span>
                              <span className="timestamp">{formatTime(msg.timestamp)}</span>
                            </div>
                          ) : (
                            <div className="chat-message">
                              <div className="message-content">{msg.message}</div>
                              <div className="message-time">{formatTime(msg.timestamp)}</div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Message Input */}
                <div className="message-input-container">
                  <div className="message-input">
                    <textarea
                      ref={messageInputRef}
                      placeholder={`Сообщение для ${currentChat}...`}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={!isConnected || loading}
                      rows={1}
                      className="input message-textarea"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!isConnected || !message.trim() || loading}
                      className="btn btn-primary send-btn"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App; 