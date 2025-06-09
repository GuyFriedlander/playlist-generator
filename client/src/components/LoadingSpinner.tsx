import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="spinner">
        <div className="spotify-logo">🎵</div>
      </div>
      <p>Loading...</p>
    </div>
  );
};

export default LoadingSpinner; 