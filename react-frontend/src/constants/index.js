// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  CHATS: '/api/auth/chats',
  HISTORY: '/api/auth/history',
  USER: '/api/auth/user'
};

// WebSocket configuration
export const WS_CONFIG = {
  RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 3000
};

// Local Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'jwt_token',
  USER_DATA: 'user_data'
};

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 320,
  MESSAGE_MAX_LENGTH: 1000,
  USERNAME_MIN_LENGTH: 3,
  PASSWORD_MIN_LENGTH: 6
}; 