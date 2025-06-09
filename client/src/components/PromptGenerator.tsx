import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config';
import './PromptGenerator.css';

interface PromptGeneratorProps {
  sessionId: string;
  onSongsGenerated: () => void;
  onPlaylistNameGenerated: (name: string) => void;
  onError: (error: string) => void;
}

interface SpotifyArtist {
  id: string;
  name: string;
  genres: string[];
}

interface SpotifyTopItem {
  id: string;
  name: string;
  artists?: SpotifyArtist[];
}

interface UserPreferences {
  topTracks: SpotifyTopItem[];
  topArtists: SpotifyArtist[];
}

const POPULAR_LANGUAGES = [
  'English',
  'Hebrew',
  'Spanish',
  'French',
  'Italian',
  'German',
  'Portuguese',
  'Japanese',
  'Korean',
  'Chinese',
  'Hindi',
  'Arabic',
  'Russian',
  'Dutch',
  
];

const EXAMPLE_PROMPTS = [
  "Upbeat songs for a workout session",
  "Chill indie songs for studying",
  "Feel-good pop hits from the 2010s",
  "Emotional ballads for a rainy day",
  "High-energy dance music for a party",
  "Classic rock anthems",
  "Relaxing acoustic songs for meditation",
  "Hip-hop tracks with great beats",
  "Love songs for a romantic dinner",
  "Motivational songs to start the day"
];

const PromptGenerator: React.FC<PromptGeneratorProps> = ({ 
  sessionId, 
  onSongsGenerated, 
  onPlaylistNameGenerated,
  onError 
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [songCount, setSongCount] = useState(25);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Fetch user preferences to personalize recommendations
  const fetchUserPreferences = async () => {
    if (preferencesLoaded || loadingPreferences) return;
    
    setLoadingPreferences(true);
    try {
      const response = await fetch(buildApiUrl(`api/user-preferences/${sessionId}`), {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserPreferences(data);
          console.log('✅ User preferences loaded:', data);
        }
      }
    } catch (error) {
      console.log('⚠️ Could not load user preferences:', error);
    } finally {
      setLoadingPreferences(false);
      setPreferencesLoaded(true);
    }
  };

  // Fetch user preferences when user starts typing (but only once)
  useEffect(() => {
    if (prompt.length > 3 && !preferencesLoaded && !loadingPreferences) {
      fetchUserPreferences();
    }
  }, [prompt, preferencesLoaded, loadingPreferences]);

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    );
  };

  const handleExampleClick = (examplePrompt: string) => {
    setPrompt(examplePrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      onError('Please enter a description for your playlist');
      return;
    }

    setIsGenerating(true);
    try {
      
      const response = await fetch(buildApiUrl('api/generate-songs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          sessionId,
          prompt: prompt.trim(),
          languages: selectedLanguages,
          count: songCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate songs');
      }

      const data = await response.json();
      if (data.success) {
        if (data.playlistName) {
          onPlaylistNameGenerated(data.playlistName);
        }
        onSongsGenerated();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Song generation error:', error);
      onError(error instanceof Error ? error.message : 'Failed to generate songs');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="prompt-generator">
      <div className="generator-container">
        <div className="header-section">
          <h2>🤖 Create AI Playlist</h2>
        </div>

        {/* User Preferences Section */}
        {(loadingPreferences || userPreferences) && (
          <div className="preferences-section">
            {loadingPreferences && (
              <div className="preferences-loading">
                <span className="spinner">🔄</span>
                <span>Analyzing your Spotify taste to personalize recommendations...</span>
              </div>
            )}
            {userPreferences && !loadingPreferences && (
              <div className="preferences-loaded">
                <div className="preferences-header">
                  <span className="icon">🎯</span>
                  <span>
                    {userPreferences.topArtists.length > 0 || userPreferences.topTracks.length > 0 
                      ? "Personalizing based on your Spotify listening history"
                      : "Using default recommendations (no listening history found)"
                    }
                  </span>
                </div>
                {(userPreferences.topArtists.length > 0 || userPreferences.topTracks.length > 0) && (
                  <div className="preferences-details">
                    {userPreferences.topArtists.length > 0 && (
                      <div className="preference-item">
                        <strong>Top Artists:</strong> {userPreferences.topArtists.slice(0, 3).map(a => a.name).join(', ')}
                        {userPreferences.topArtists.length > 3 && ` +${userPreferences.topArtists.length - 3} more`}
                      </div>
                    )}
                    {userPreferences.topTracks.length > 0 && (
                      <div className="preference-item">
                        <strong>Recent Favorites:</strong> {userPreferences.topTracks.slice(0, 2).map(t => `"${t.name}"`).join(', ')}
                        {userPreferences.topTracks.length > 2 && ` +${userPreferences.topTracks.length - 2} more`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="prompt-section">
          <label htmlFor="prompt">Describe your music mood:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Upbeat workout songs, chill study music..."
            rows={2}
            maxLength={200}
            disabled={isGenerating}
          />
        </div>

        <div className="settings-section">
          <div className="setting-row">
            <div className="language-compact">
              <label>🌍 Languages:</label>
              <div className="selected-languages">
                {selectedLanguages.join(', ')}
                <button 
                  className="change-btn"
                  onClick={() => setShowLanguages(!showLanguages)}
                  type="button"
                >
                  Change
                </button>
              </div>
            </div>
            
            <div className="song-count">
              <label htmlFor="songCount">🎵 Songs:</label>
              <select
                id="songCount"
                value={songCount}
                onChange={(e) => setSongCount(Number(e.target.value))}
                disabled={isGenerating}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={25}>25</option>
                <option value={30}>30</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {showLanguages && (
            <div className="languages-grid">
              {POPULAR_LANGUAGES.map((language) => (
                <label key={language} className="language-option">
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(language)}
                    onChange={() => handleLanguageToggle(language)}
                    disabled={isGenerating}
                  />
                  <span className="checkbox-custom"></span>
                  {language}
                </label>
              ))}
              <button 
                className="done-btn"
                onClick={() => setShowLanguages(false)}
              >
                Done
              </button>
            </div>
          )}
        </div>

        <div className="examples-section">
          <h3>💡 Quick Ideas:</h3>
          <div className="examples-grid">
            {EXAMPLE_PROMPTS.slice(0, 6).map((example, index) => (
              <button
                key={index}
                className="example-btn"
                onClick={() => handleExampleClick(example)}
                disabled={isGenerating}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="generate-section">
          <button 
            className="generate-btn"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <span className="spinner">🔄</span>
                Generating {songCount} songs...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate Playlist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptGenerator; 