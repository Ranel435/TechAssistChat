import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8080';
const WS_URL = process.env.NODE_ENV === 'production' ? 
  `ws://${window.location.host}/ws` : 'ws://localhost:8080/ws';

// Утилиты для работы с токенами
const TokenManager = {
  getToken: () => localStorage.getItem('jwt_token'),
  setToken: (token) => localStorage.setItem('jwt_token', token),
  removeToken: () => localStorage.removeItem('jwt_token'),
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  },
  setUserData: (data) => localStorage.setItem('user_data', JSON.stringify(data)),
  removeUserData: () => localStorage.removeItem('user_data'),
  isAuthenticated: () => !!TokenManager.getToken()
};

// Компонент авторизации
const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/login' : '/register';
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        TokenManager.setToken(data.token);
        TokenManager.setUserData({
          user_id: data.user_id,
          username: data.username
        });
        onLogin(data);
      } else {
        setError(data.error || 'Ошибка аутентификации');
      }
    } catch (error) {
      setError('Ошибка соединения с сервером');
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
        
        <p>
          {isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
          <button 
            type="button" 
            className="link-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </p>
      </div>
    </div>
  );
};

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

// Главный компонент приложения
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(TokenManager.isAuthenticated());
  const [userData, setUserData] = useState(TokenManager.getUserData());
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const [showNewChatForm, setShowNewChatForm] = useState(false);
  const [newChatUser, setNewChatUser] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // API helper с авторизацией
  const apiCall = async (url, options = {}) => {
    const token = TokenManager.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      handleLogout();
      throw new Error('Unauthorized');
    }

    return response;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthenticated && userData) {
      connect();
    }
  }, [isAuthenticated, userData]);

  const handleLogin = (authData) => {
    setIsAuthenticated(true);
    setUserData(authData);
  };

  const handleLogout = () => {
    if (ws) {
      ws.close();
    }
    TokenManager.removeToken();
    TokenManager.removeUserData();
    setIsAuthenticated(false);
    setUserData(null);
    setCurrentChat(null);
    setMessages([]);
    setChats([]);
    setIsConnected(false);
  };

  const connect = () => {
    if (!userData || !TokenManager.getToken()) {
      return;
    }

    const token = TokenManager.getToken();
    const websocket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
      console.log(`✅ Подключен как ${userData.username}`);
      loadChats();
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Получено сообщение:', data);
        
        // Обработка сообщения с новыми полями
        const newMessage = {
          from_user_id: data.from_user_id,
          to_user_id: data.to_user_id,
          from_username: data.from_username,
          to_username: data.to_username,
          message: data.message,
          created_at: new Date().toISOString(),
          type: 'received'
        };

        setMessages(prev => [...prev, newMessage]);
        
        // Обновляем список чатов
        setTimeout(() => loadChats(), 500);
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

  const loadChats = async () => {
    try {
      const response = await apiCall('/api/auth/chats');
      const data = await response.json();
      
      if (response.ok) {
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    }
  };

  const selectChat = async (otherUser) => {
    if (!otherUser || !otherUser.id) {
      console.error('Неверные данные пользователя:', otherUser);
      return;
    }

    setCurrentChat(otherUser);
    setLoading(true);

    try {
      const response = await apiCall(`/api/auth/history?userB_id=${otherUser.id}`);
      const data = await response.json();
      
      if (response.ok && data.messages) {
        const formattedMessages = data.messages.map(msg => ({
          ...msg,
          type: msg.from_user_id === userData.user_id ? 'sent' : 'received'
        }));
        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !currentChat || !ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const messageData = {
      to_user_id: currentChat.id,
      message: message.trim()
    };

    try {
      ws.send(JSON.stringify(messageData));
      
      // Добавляем отправленное сообщение в UI
      const sentMessage = {
        from_user_id: userData.user_id,
        to_user_id: currentChat.id,
        from_username: userData.username,
        to_username: currentChat.username,
        message: message.trim(),
        created_at: new Date().toISOString(),
        type: 'sent'
      };

      setMessages(prev => [...prev, sentMessage]);
      setMessage('');
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    }
  };

  const createNewChat = async () => {
    if (!newChatUser.trim()) {
      return;
    }

    try {
      // Проверяем, является ли введенное значение числом (ID пользователя)
      const userIdMatch = newChatUser.trim().match(/^\d+$/);
      
      if (userIdMatch) {
        // Если это число, создаем фиктивного пользователя с этим ID
        const userId = parseInt(newChatUser.trim(), 10);
        const mockUser = {
          id: userId,
          username: `user_${userId}`, // Временное имя
          last_seen: new Date().toISOString()
        };
        
        // Выбираем этого пользователя как текущий чат
        setCurrentChat(mockUser);
        
        // Если есть первое сообщение, отправляем его
        if (newChatMessage.trim() && ws && ws.readyState === WebSocket.OPEN) {
          const messageData = {
            to_user_id: userId,
            message: newChatMessage.trim()
          };

          ws.send(JSON.stringify(messageData));
          
          // Добавляем сообщение в UI
          const sentMessage = {
            from_user_id: userData.user_id,
            to_user_id: userId,
            from_username: userData.username,
            to_username: mockUser.username,
            message: newChatMessage.trim(),
            created_at: new Date().toISOString(),
            type: 'sent'
          };

          setMessages([sentMessage]);
        } else {
          setMessages([]);
        }
        
        // Обновляем список чатов
        setTimeout(() => loadChats(), 500);
      } else {
        alert('Пока поддерживается только поиск по ID пользователя. Введите числовой ID.');
        return;
      }
    } catch (error) {
      console.error('Ошибка создания чата:', error);
      alert('Ошибка создания чата');
    } finally {
      // Закрываем модальное окно и очищаем поля
      setShowNewChatForm(false);
      setNewChatUser('');
      setNewChatMessage('');
    }
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Если не авторизован, показываем форму входа
  if (!isAuthenticated) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="chat-app">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <MessageIcon />
          <h1>TechAssist Chat</h1>
        </div>
        <div className="header-right">
          <span className="username">👋 {userData?.username}</span>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? <WifiIcon /> : <WifiOffIcon />}
            {isConnected ? 'Онлайн' : 'Офлайн'}
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </div>

      <div className="chat-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-header">
            <h3>Чаты</h3>
            <button onClick={() => setShowNewChatForm(true)} className="new-chat-btn">
              <PlusIcon />
            </button>
          </div>

          <div className="chats-list">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${currentChat?.id === chat.id ? 'active' : ''}`}
                onClick={() => selectChat(chat)}
              >
                <div className="chat-avatar">
                  <UserIcon />
                </div>
                <div className="chat-info">
                  <div className="chat-name">{chat.username}</div>
                  <div className="chat-last-seen">
                    {formatTime(chat.last_seen)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat">
          {currentChat ? (
            <>
              <div className="chat-header">
                <div className="chat-user-info">
                  <UserIcon />
                  <span>{currentChat.username}</span>
                </div>
              </div>

              <div className="messages-container">
                {loading && <div className="loading">Загрузка сообщений...</div>}
                
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.type}`}>
                    <div className="message-content">
                      <div className="message-text">{msg.message}</div>
                      <div className="message-time">
                        {formatTime(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input-container">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Сообщение для ${currentChat.username}...`}
                  rows="1"
                  disabled={!isConnected}
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || !isConnected}
                  className="send-button"
                >
                  <SendIcon />
                </button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <MessageIcon />
              <h3>Выберите чат для начала общения</h3>
              <p>Выберите существующий чат из списка или создайте новый</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatForm && (
        <div className="modal-overlay" onClick={() => setShowNewChatForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Новый чат</h3>
            <input
              type="text"
              placeholder="ID пользователя (например: 2)"
              value={newChatUser}
              onChange={(e) => setNewChatUser(e.target.value)}
            />
            <textarea
              placeholder="Первое сообщение (необязательно)"
              value={newChatMessage}
              onChange={(e) => setNewChatMessage(e.target.value)}
              rows="3"
            />
            <div className="modal-buttons">
              <button onClick={() => setShowNewChatForm(false)}>
                Отмена
              </button>
              <button onClick={createNewChat} disabled={!newChatUser.trim()}>
                Создать чат
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;