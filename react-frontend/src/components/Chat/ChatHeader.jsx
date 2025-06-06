import React from 'react';
import { MessageIcon, WifiIcon, WifiOffIcon, LogoutIcon } from '../UI/Icons';
import './ChatHeader.css';

const ChatHeader = ({ user, isConnected, onLogout }) => {
  return (
    <div className="chat-header">
      <div className="header-left">
        <MessageIcon size={24} />
        <h1>TechAssist Chat</h1>
      </div>
      <div className="header-right">
        <span className="username">👋 {user?.username}</span>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? <WifiIcon /> : <WifiOffIcon />}
          {isConnected ? 'Онлайн' : 'Офлайн'}
        </div>
        <button onClick={onLogout} className="logout-btn">
          <LogoutIcon />
          Выйти
        </button>
      </div>
    </div>
  );
};

export default ChatHeader; 