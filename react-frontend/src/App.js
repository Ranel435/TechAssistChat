import React from 'react';
import { useAuth } from './hooks/useAuth';
import AuthForm from './components/Auth/AuthForm';
import ChatContainer from './components/Chat/ChatContainer';
import LoadingSpinner from './components/UI/LoadingSpinner';
import './App.css';

function App() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="app">
      {isAuthenticated ? (
        <ChatContainer />
      ) : (
        <AuthForm onLogin={login} />
      )}
    </div>
  );
}

export default App;