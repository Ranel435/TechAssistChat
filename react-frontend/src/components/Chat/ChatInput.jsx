import React, { useState } from 'react';
import { SendIcon } from '../UI/Icons';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, disabled, placeholder }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      const success = onSendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="input-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder || 'Введите сообщение...'}
          rows="1"
          disabled={disabled}
          className="message-input"
        />
        <button 
          type="submit"
          disabled={!message.trim() || disabled}
          className="send-button"
          title="Отправить сообщение"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};

export default ChatInput; 