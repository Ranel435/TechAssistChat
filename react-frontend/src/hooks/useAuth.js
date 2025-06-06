import { useState, useEffect } from 'react';

const TOKEN_KEY = 'jwt_token';
const USER_DATA_KEY = 'user_data';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Проверяем наличие токена при загрузке
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_DATA_KEY);

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const userData = {
      user_id: authData.user_id,
      username: authData.username
    };

    localStorage.setItem(TOKEN_KEY, authData.token);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    setToken(authData.token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    getAuthHeaders
  };
}; 