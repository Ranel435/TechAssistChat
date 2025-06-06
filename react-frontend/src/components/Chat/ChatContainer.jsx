import React, { useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useChatData } from '../../hooks/useChatData';
import ChatHeader from './ChatHeader';
import ChatSidebar from './ChatSidebar';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import NewChatModal from './NewChatModal';
import { MessageIcon } from '../UI/Icons';
import './ChatContainer.css';

const ChatContainer = () => {
  const { user, token, logout } = useAuth();
  const {
    chats,
    currentChat,
    messages,
    loading,
    loadChats,
    selectChat,
    addMessage,
    createNewChat
  } = useChatData(token, user);

  const [showNewChatModal, setShowNewChatModal] = React.useState(false);

  // Обработчик входящих сообщений через WebSocket
  const handleWebSocketMessage = useCallback((message) => {
    console.log('Received WebSocket message:', message);
    
    // Добавляем новое сообщение в текущий чат
    if (currentChat && 
        (message.from_user_id === currentChat.user_id || 
         message.to_user_id === currentChat.user_id)) {
      
      const newMessage = {
        ...message,
        type: message.from_user_id === user.user_id ? 'sent' : 'received'
      };
      
      addMessage(newMessage);
    }

    // Обновляем список чатов
    setTimeout(() => loadChats(), 500);
  }, [currentChat, user?.user_id, addMessage, loadChats]);

  const { isConnected, sendMessage: wsSendMessage } = useWebSocket(
    token, 
    handleWebSocketMessage
  );

  // Отправка сообщения
  const sendMessage = useCallback((messageText) => {
    if (!currentChat || !messageText.trim() || !isConnected) {
      return false;
    }

    const messageData = {
      to_user_id: currentChat.user_id,
      message: messageText.trim()
    };

    const success = wsSendMessage(messageData);
    
    if (success) {
      // Добавляем сообщение в UI оптимистично
      const sentMessage = {
        from_user_id: user.user_id,
        to_user_id: currentChat.user_id,
        from_username: user.username,
        to_username: currentChat.username,
        message: messageText.trim(),
        created_at: new Date().toISOString(),
        type: 'sent'
      };

      addMessage(sentMessage);
    }

    return success;
  }, [currentChat, isConnected, wsSendMessage, user, addMessage]);

  // Создание нового чата
  const handleCreateNewChat = useCallback(async (userId, initialMessage = '') => {
    try {
      const { newChat, initialMessage: message } = await createNewChat(userId, initialMessage);

      // Отправляем первое сообщение, если есть
      if (message) {
        setTimeout(() => {
          sendMessage(message);
        }, 100);
      }

      // Обновляем список чатов
      setTimeout(() => {
        loadChats();
      }, 500);

    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
  }, [createNewChat, sendMessage, loadChats]);

  // Загружаем чаты при монтировании
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return (
    <div className="chat-app">
      <ChatHeader 
        user={user}
        isConnected={isConnected}
        onLogout={logout}
      />

      <div className="chat-container">
        <ChatSidebar
          chats={chats}
          currentChat={currentChat}
          onSelectChat={selectChat}
          onNewChat={() => setShowNewChatModal(true)}
        />

        <div className="main-chat">
          {currentChat ? (
            <>
              <div className="chat-room-header">
                <h3>{currentChat.username}</h3>
              </div>
              
              <ChatMessages 
                messages={messages}
                loading={loading}
                currentUser={user}
              />
              
              <ChatInput
                onSendMessage={sendMessage}
                disabled={!isConnected}
                placeholder={`Сообщение для ${currentChat.username}...`}
              />
            </>
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-content">
                <MessageIcon size={48} />
                <h3>Выберите чат для начала общения</h3>
                <p>Выберите существующий чат из списка или создайте новый</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onCreateChat={handleCreateNewChat}
        />
      )}
    </div>
  );
};

export default ChatContainer; 