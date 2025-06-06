import React from 'react';
import { PlusIcon, UserIcon } from '../UI/Icons';
import { formatTime } from '../../utils/dateUtils';
import './ChatSidebar.css';

const ChatSidebar = ({ chats, currentChat, onSelectChat, onNewChat }) => {
  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Чаты</h3>
        <button onClick={onNewChat} className="new-chat-btn" title="Новый чат">
          <PlusIcon />
        </button>
      </div>

      <div className="chats-list">
        {chats.length === 0 ? (
          <div className="empty-chats">
            <p>Пока нет чатов</p>
            <small>Создайте новый чат для начала общения</small>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.user_id}
              className={`chat-item ${currentChat?.user_id === chat.user_id ? 'active' : ''}`}
              onClick={() => onSelectChat(chat)}
            >
              <div className="chat-avatar">
                <UserIcon size={20} />
              </div>
              <div className="chat-info">
                <div className="chat-name">{chat.username}</div>
                <div className="chat-last-seen">
                  {formatTime(chat.last_seen)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar; 