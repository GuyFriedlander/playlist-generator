import React, { useState } from 'react';
import { MatchedSong, Playlist } from '../App';
import { buildApiUrl } from '../config';
import './PlaylistCreator.css';

interface PlaylistCreatorProps {
  sessionId: string;
  acceptedSongs: MatchedSong[];
  defaultPlaylistName?: string;
  onPlaylistCreated: (playlist: Playlist) => void;
  onError: (error: string) => void;
}

const PlaylistCreator: React.FC<PlaylistCreatorProps> = ({ 
  sessionId, 
  acceptedSongs, 
  defaultPlaylistName,
  onPlaylistCreated, 
  onError 
}) => {
  const [playlistName, setPlaylistName] = useState(defaultPlaylistName || 'My Music Selector Playlist');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      onError('Please enter a playlist name');
      return;
    }

    if (acceptedSongs.length === 0) {
      onError('No songs selected for the playlist');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch(buildApiUrl('api/create-playlist'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          sessionId, 
          playlistName: playlistName.trim(),
          selectedSongs: acceptedSongs
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create playlist');
      }

      const data = await response.json();
      if (data.success && data.playlist) {
        onPlaylistCreated(data.playlist);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Playlist creation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to create playlist');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="playlist-creator">
      <div className="creator-container">
        <div className="header-section">
          <h2>🎶 Create Playlist</h2>
          <div className="playlist-stats">
            <div className="stat">
              <span className="stat-icon">🎵</span>
              <span><strong>{acceptedSongs.length}</strong> songs</span>
            </div>
            <div className="stat">
              <span className="stat-icon">⏱️</span>
              <span><strong>~{Math.round(acceptedSongs.length * 3.5)}</strong> min</span>
            </div>
          </div>
        </div>

        <div className="playlist-preview">
          <h3>Selected Songs:</h3>
          <div className="songs-list">
            {acceptedSongs.slice(0, 3).map((song, index) => (
              <div key={index} className="song-item">
                <div className="song-art">
                  {song.spotify.albumArt ? (
                    <img src={song.spotify.albumArt} alt="Album art" />
                  ) : (
                    <div className="placeholder-art">🎵</div>
                  )}
                </div>
                <div className="song-details">
                  <h4>{song.spotify.name}</h4>
                  <p>{song.spotify.artists.join(', ')}</p>
                </div>
              </div>
            ))}
            {acceptedSongs.length > 3 && (
              <div className="more-songs">
                + {acceptedSongs.length - 3} more songs
              </div>
            )}
          </div>
        </div>

        <div className="playlist-form">
          <div className="form-group">
            <label htmlFor="playlistName">Playlist Name:</label>
            <input
              id="playlistName"
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              placeholder="Enter playlist name..."
              maxLength={100}
              disabled={isCreating}
            />
          </div>
        </div>
      </div>

      <div className="create-button-fixed">
        <button 
          className="create-playlist-btn"
          onClick={handleCreatePlaylist}
          disabled={isCreating || !playlistName.trim()}
        >
          {isCreating ? (
            <>
              <span className="spinner">🔄</span>
              Creating Playlist...
            </>
          ) : (
            <>
              <span>🎶</span>
              Create Spotify Playlist
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PlaylistCreator; 