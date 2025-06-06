import React, { useState } from 'react';
import './NewChatModal.css';

const NewChatModal = ({ onClose, onCreateChat }) => {
  const [userId, setUserId] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId.trim()) {
      setError('Введите ID пользователя');
      return;
    }

    const id = parseInt(userId.trim());
    if (isNaN(id)) {
      setError('ID пользователя должен быть числом');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreateChat(id, initialMessage.trim());
      onClose();
    } catch (error) {
      setError(error.message || 'Ошибка создания чата');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-header">
          <h3>Новый чат</h3>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userId">ID пользователя</label>
            <input
              id="userId"
              type="text"
              placeholder="Например: 2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="initialMessage">Первое сообщение (необязательно)</label>
            <textarea
              id="initialMessage"
              placeholder="Привет! Как дела?"
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows="3"
              disabled={loading}
            />
          </div>
          
          <div className="modal-buttons">
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-button"
              disabled={loading}
            >
              Отмена
            </button>
            <button 
              type="submit" 
              className="create-button"
              disabled={!userId.trim() || loading}
            >
              {loading ? 'Создание...' : 'Создать чат'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewChatModal; 