import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useChatData = (token, user) => {
  const [chats, setChats] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Загрузка списка чатов
  const loadChats = useCallback(async () => {
    if (!token) return;

    try {
      const data = await apiService.getChats(token);
      setChats(data.chats || []);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  }, [token]);

  // Выбор чата и загрузка истории
  const selectChat = useCallback(async (chat) => {
    if (currentChat?.user_id === chat.user_id) return;

    setCurrentChat(chat);
    setLoading(true);

    try {
      const data = await apiService.getChatHistory(chat.user_id, token);
      
      const formattedMessages = (data.messages || []).map(msg => ({
        ...msg,
        type: msg.from_user_id === user.user_id ? 'sent' : 'received'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentChat, token, user?.user_id]);

  // Добавление нового сообщения
  const addMessage = useCallback((message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Создание нового чата
  const createNewChat = useCallback(async (userId, initialMessage = '') => {
    try {
      const userData = await apiService.getUserById(userId, token);
      
      const newChat = {
        user_id: userData.user_id,
        username: userData.username,
        last_seen: new Date().toISOString()
      };

      setCurrentChat(newChat);
      setMessages([]);

      return { newChat, initialMessage: initialMessage.trim() };
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  }, [token]);

  return {
    chats,
    currentChat,
    messages,
    loading,
    loadChats,
    selectChat,
    addMessage,
    createNewChat,
    setCurrentChat,
    setMessages
  };
}; 