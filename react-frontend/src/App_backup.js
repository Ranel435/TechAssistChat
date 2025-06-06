import React, { useState, useEffect, useRef } from 'react';
import './App.css';

// Используем относительные пути - nginx будет проксировать запросы
const API_BASE = '';  // Пустая строка означает относительные пути
const WS_URL = `ws://${window.location.host}/ws`;  // WebSocket через тот же хост

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

// Минимальный компонент чата для тестирования
const ChatContainer = () => {
  return (
    <div className="chat-app">
      <div style={{padding: '20px', textAlign: 'center'}}>
        <h2>Рефакторинг в процессе...</h2>
        <p>Новая архитектура загружается</p>
      </div>
    </div>
  );
};

// Главный компонент приложения
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(TokenManager.isAuthenticated());
  const [userData, setUserData] = useState(TokenManager.getUserData());

  const handleLogin = (authData) => {
    setUserData({
      user_id: authData.user_id,
      username: authData.username
    });
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return <ChatContainer />;
}

export default App; 