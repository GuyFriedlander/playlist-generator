import React, { useState, useEffect } from 'react';
import { MatchedSong } from '../App';
import { buildApiUrl } from '../config';
import './SongMatcher.css';

interface SongMatcherProps {
  sessionId: string;
  onSongsMatched: (songs: MatchedSong[]) => void;
  onError: (error: string) => void;
}

const SongMatcher: React.FC<SongMatcherProps> = ({ sessionId, onSongsMatched, onError }) => {
  const [isMatching, setIsMatching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSong, setCurrentSong] = useState('');

  useEffect(() => {
    startMatching();
  }, []);

  const startMatching = async () => {
    setIsMatching(true);
    try {
      const response = await fetch(buildApiUrl('api/match-songs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sessionId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Song matching failed');
      }

      const data = await response.json();
      if (data.success && data.songs) {
        onSongsMatched(data.songs);
      } else {
        throw new Error('No songs matched');
      }
    } catch (error) {
      console.error('Matching error:', error);
      onError(error instanceof Error ? error.message : 'Song matching failed');
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div className="song-matcher-page">
      <div className="matcher-container">
        <h2>🔍 Finding Your Songs on Spotify</h2>
        <p>We're searching for your songs in Spotify's catalog...</p>
        
        <div className="matching-progress">
          <div className="progress-circle">
            <div className="circle-progress">
              <span className="progress-icon">🎵</span>
            </div>
          </div>
          
          <div className="progress-text">
            <h3>Searching...</h3>
            <p>This may take a moment depending on your list size</p>
            {currentSong && (
              <p className="current-song">Currently matching: {currentSong}</p>
            )}
          </div>
        </div>

        <div className="matching-info">
          <div className="info-item">
            <span className="info-icon">🎯</span>
            <div>
              <h4>Smart Matching</h4>
              <p>We use advanced search to find the best matches</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">⚡</span>
            <div>
              <h4>Fast Processing</h4>
              <p>Our system quickly searches millions of tracks</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">🎶</span>
            <div>
              <h4>High Quality</h4>
              <p>We find the original, highest quality versions</p>
            </div>
          </div>
        </div>

        {isMatching && (
          <div className="loading-spinner">
            <div className="spinner-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongMatcher; 