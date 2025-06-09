import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MatchedSong } from '../App';
import './SongSwiper.css';

interface SongSwiperProps {
  songs: MatchedSong[];
  onSongsSelected: (songs: MatchedSong[]) => void;
  onComplete: (songs: MatchedSong[]) => void;
  acceptedCount: number;
}

const SongSwiper: React.FC<SongSwiperProps> = ({ 
  songs, 
  onSongsSelected, 
  onComplete,
  acceptedCount 
}) => {
  const [selectedSongs, setSelectedSongs] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<Set<string>>(new Set());
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Initialize all songs as selected by default
  useEffect(() => {
    const initialSelection = new Set(songs.map(song => song.spotify.id));
    setSelectedSongs(initialSelection);
  }, [songs]);

  const toggleSongSelection = (song: MatchedSong) => {
    const songId = song.spotify.id;
    setSelectedSongs(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(songId)) {
        newSelection.delete(songId);
      } else {
        newSelection.add(songId);
      }
      return newSelection;
    });

    // Stop audio if playing and song is deselected
    if (isPlaying === songId && !selectedSongs.has(songId)) {
      stopAudio(songId);
    }
  };

  const togglePreview = (song: MatchedSong, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent song selection toggle
    
    const songId = song.spotify.id;
    const hasPreview = song.spotify.previewUrl;
    
    if (!hasPreview) return;

    if (isPlaying === songId) {
      stopAudio(songId);
    } else {
      // Stop any currently playing audio
      if (isPlaying) {
        stopAudio(isPlaying as string);
      }

      // Start new audio
      const audio = new Audio(song.spotify.previewUrl || ''
      );
      audioRefs.current[songId] = audio;
      
      audio.play()
        .then(() => setIsPlaying(songId))
        .catch(() => {
          setAudioError(prev => new Set(prev).add(songId));
          setIsPlaying(null);
        });

      audio.onended = () => {
        setIsPlaying(null);
        delete audioRefs.current[songId];
      };

      audio.onerror = () => {
        setAudioError(prev => new Set(prev).add(songId));
        setIsPlaying(null);
        delete audioRefs.current[songId];
      };
    }
  };

     const stopAudio = (songId: string | null) => {
     if (!songId) return;
    const audio = audioRefs.current[songId];
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      delete audioRefs.current[songId];
    }
    setIsPlaying(null);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
      });
      audioRefs.current = {};
    };
  }, []);

  const handleComplete = () => {
    // Stop all audio
    Object.values(audioRefs.current).forEach(audio => {
      audio.pause();
    });
    
    // Get all selected songs and pass them to parent
    const selectedSongObjects = songs.filter(song => 
      selectedSongs.has(song.spotify.id)
    );

    console.log("in swiper", selectedSongObjects);
    
    
    onComplete(selectedSongObjects);
  };

  const selectedCount = selectedSongs.size;

  return (
    <div className="song-list-container">
      <div className="list-header">
        <h2>Choose your songs</h2>
        <p>{selectedCount} of {songs.length} songs selected</p>
      </div>

      <div className="songs-list-wrapper">
        <div className="songs-list">
          {songs.map((song, index) => {
            const isSelected = selectedSongs.has(song.spotify.id);
            const isCurrentlyPlaying = isPlaying === song.spotify.id;
            const hasError = audioError.has(song.spotify.id);
            const hasPreview = song.spotify.previewUrl;

            return (
              <motion.div
                key={song.spotify.id}
                className={`song-list-item ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSongSelection(song)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="song-art">
                  {song.spotify.albumArt ? (
                    <img src={song.spotify.albumArt} alt="Album art" />
                  ) : (
                    <div className="placeholder-art">🎵</div>
                  )}
                </div>

                <div className="song-details">
                  <h3>{song.spotify.name}</h3>
                  <p className="artist">{song.spotify.artists.join(', ')}</p>
                  <p className="original-info">
                    Original: "{song.original.title}" by {song.original.artist}
                  </p>
                </div>

                <div className="song-actions">
                  {hasPreview && (
                    <button
                      className={`preview-btn-small ${isCurrentlyPlaying ? 'playing' : ''} ${hasError ? 'error' : ''}`}
                      onClick={(e) => togglePreview(song, e)}
                      disabled={hasError}
                      title={hasError ? 'Preview not available' : isCurrentlyPlaying ? 'Pause preview' : 'Play preview'}
                    >
                      {hasError ? '🚫' : isCurrentlyPlaying ? '⏸️' : '▶️'}
                    </button>
                  )}
                  
                  <div className="checkbox-container">
                    <div className={`custom-checkbox ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="list-footer">
        <motion.button
          className="next-btn"
          onClick={handleComplete}
          disabled={selectedCount === 0}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>✨</span>
          <span>Create Playlist ({selectedCount} songs)</span>
        </motion.button>
      </div>
    </div>
  );
};

export default SongSwiper; 