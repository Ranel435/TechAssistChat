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

const HistoryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12,6 12,12 16,14"/>
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
  const [targetUser, setTargetUser] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connect = () => {
    if (!username.trim()) {
      alert('Введите ваше имя');
      return;
    }

    const websocket = new WebSocket(`${WS_URL}?user=${encodeURIComponent(username)}`);
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
      addSystemMessage(`🟢 Подключен как ${username}`);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        addMessage(data.from, data.to, data.message, 'received');
      } catch (error) {
        console.error('Ошибка парсинга сообщения:', error);
      }
    };

    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
      addSystemMessage('🔴 Соединение закрыто');
    };

    websocket.onerror = (error) => {
      console.error('WebSocket ошибка:', error);
      addSystemMessage('❌ Ошибка соединения');
    };
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
    }
  };

  const sendMessage = () => {
    if (!ws || !isConnected || !targetUser.trim() || !message.trim()) {
      return;
    }

    const messageData = {
      to: targetUser,
      message: message
    };

    try {
      ws.send(JSON.stringify(messageData));
      addMessage(username, targetUser, message, 'sent');
      setMessage('');
      messageInputRef.current?.focus();
    } catch (error) {
      console.error('Ошибка отправки:', error);
      addSystemMessage('❌ Ошибка отправки сообщения');
    }
  };

  const addMessage = (from, to, text, type) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      from,
      to,
      message: text,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const addSystemMessage = (text) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      message: text,
      timestamp: new Date(),
      type: 'system'
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const loadHistory = async () => {
    if (!username.trim() || !targetUser.trim()) {
      alert('Укажите свое имя и имя собеседника');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/chat/${username}/${targetUser}`);
      const data = await response.json();
      
      if (data.messages) {
        setMessages([]);
        addSystemMessage(`📜 История чата между ${username} и ${targetUser}`);
        
        data.messages.forEach(msg => {
          const type = msg.from === username ? 'sent' : 'received';
          const messageWithTime = {
            id: msg.id || Date.now() + Math.random(),
            from: msg.from,
            to: msg.to,
            message: msg.message,
            timestamp: new Date(msg.created_at),
            type
          };
          setMessages(prev => [...prev, messageWithTime]);
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
      addSystemMessage('❌ Ошибка загрузки истории');
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Intl.DateTimeFormat('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

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
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="user-controls">
              <h3>Подключение</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Ваше имя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isConnected}
                  className="input"
                />
                {!isConnected ? (
                  <button onClick={connect} className="btn btn-primary">
                    Подключиться
                  </button>
                ) : (
                  <button onClick={disconnect} className="btn btn-secondary">
                    Отключиться
                  </button>
                )}
              </div>
            </div>

            <div className="chat-controls">
              <h3>Чат</h3>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Кому отправить"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="input"
                />
              </div>
              
              <div className="action-buttons">
                <button onClick={loadHistory} className="btn btn-outline">
                  <HistoryIcon />
                  История
                </button>
                <button onClick={clearMessages} className="btn btn-outline">
                  Очистить
                </button>
              </div>
            </div>
          </aside>

          {/* Chat Area */}
          <main className="chat-area">
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <MessageIcon />
                  <h3>Добро пожаловать в TechAssistChat!</h3>
                  <p>Подключитесь и начните общение</p>
                </div>
              ) : (
                <div className="messages">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`message ${msg.type}`}>
                      {msg.type === 'system' ? (
                        <div className="system-message">
                          <span>{msg.message}</span>
                          <span className="timestamp">{formatTime(msg.timestamp)}</span>
                        </div>
                      ) : (
                        <div className="chat-message">
                          <div className="message-header">
                            <span className="sender">
                              {msg.type === 'sent' ? 'Вы' : msg.from}
                            </span>
                            <span className="recipient">
                              → {msg.type === 'sent' ? msg.to : 'Вам'}
                            </span>
                            <span className="timestamp">{formatTime(msg.timestamp)}</span>
                          </div>
                          <div className="message-content">{msg.message}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="message-input-container">
              <div className="message-input">
                <textarea
                  ref={messageInputRef}
                  placeholder="Введите сообщение..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={!isConnected || !targetUser.trim()}
                  rows={1}
                  className="input message-textarea"
                />
                <button
                  onClick={sendMessage}
                  disabled={!isConnected || !targetUser.trim() || !message.trim()}
                  className="btn btn-primary send-btn"
                >
                  <SendIcon />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default App; 