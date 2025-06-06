const API_BASE = '';

class ApiService {
  constructor() {
    this.baseURL = API_BASE;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Метод для запросов с авторизацией
  async authenticatedRequest(endpoint, options = {}, token) {
    const authHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    return this.request(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        ...authHeaders,
      },
    });
  }

  // Методы для аутентификации
  async login(credentials) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(credentials) {
    return this.request('/register', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Методы для работы с чатами
  async getChats(token) {
    return this.authenticatedRequest('/api/auth/chats', {}, token);
  }

  async getChatHistory(userBId, token) {
    return this.authenticatedRequest(
      `/api/auth/history?userB_id=${userBId}`, 
      {}, 
      token
    );
  }

  async getUserById(userId, token) {
    return this.authenticatedRequest(
      `/api/auth/user/${userId}`, 
      {}, 
      token
    );
  }
}

export const apiService = new ApiService(); 