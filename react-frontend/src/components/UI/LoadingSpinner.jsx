import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 40, color = 'white' }) => {
  return (
    <div className="loading-spinner-container">
      <div 
        className="loading-spinner"
        style={{
          width: size,
          height: size,
          borderTopColor: color
        }}
      >
        <span className="sr-only">Загрузка...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner; 