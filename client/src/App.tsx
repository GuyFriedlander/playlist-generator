import React, { useState, useEffect } from 'react';
import { buildApiUrl } from './config';
import './App.css';
import LoginPage from './components/LoginPage';
import PromptGenerator from './components/PromptGenerator';
import SongMatcher from './components/SongMatcher';
import SongSwiper from './components/SongSwiper';
import PlaylistCreator from './components/PlaylistCreator';
import LoadingSpinner from './components/LoadingSpinner';

export interface Song {
  title: string;
  artist: string;
}

export interface MatchedSong {
  original: Song;
  spotify: {
    id: string;
    name: string;
    artists: string[];
    uri: string;
    albumArt: string | null;
    previewUrl: string | null;
  };
}

export interface User {
  id: string;
  name: string;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  trackCount: number;
}

type AppStep = 'login' | 'generate' | 'matching' | 'swiping' | 'playlist' | 'complete';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>('login');
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [songs, setSongs] = useState<MatchedSong[]>([]
    /*[
    {
      original: { title: "Shape of You", artist: "Ed Sheeran" },
      spotify: {
        id: "1",
        name: "Shape of You",
        artists: ["Ed Sheeran"],
        uri: "spotify:track:1",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Blinding Lights", artist: "The Weeknd" },
      spotify: {
        id: "2",
        name: "Blinding Lights",
        artists: ["The Weeknd"],
        uri: "spotify:track:2",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Watermelon Sugar", artist: "Harry Styles" },
      spotify: {
        id: "3",
        name: "Watermelon Sugar",
        artists: ["Harry Styles"],
        uri: "spotify:track:3",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Levitating", artist: "Dua Lipa" },
      spotify: {
        id: "4",
        name: "Levitating",
        artists: ["Dua Lipa"],
        uri: "spotify:track:4",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "good 4 u", artist: "Olivia Rodrigo" },
      spotify: {
        id: "5",
        name: "good 4 u",
        artists: ["Olivia Rodrigo"],
        uri: "spotify:track:5",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "STAY", artist: "The Kid LAROI, Justin Bieber" },
      spotify: {
        id: "6",
        name: "STAY",
        artists: ["The Kid LAROI", "Justin Bieber"],
        uri: "spotify:track:6",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Heat Waves", artist: "Glass Animals" },
      spotify: {
        id: "7",
        name: "Heat Waves",
        artists: ["Glass Animals"],
        uri: "spotify:track:7",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "As It Was", artist: "Harry Styles" },
      spotify: {
        id: "8",
        name: "As It Was",
        artists: ["Harry Styles"],
        uri: "spotify:track:8",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Bad Habit", artist: "Steve Lacy" },
      spotify: {
        id: "9",
        name: "Bad Habit",
        artists: ["Steve Lacy"],
        uri: "spotify:track:9",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Anti-Hero", artist: "Taylor Swift" },
      spotify: {
        id: "10",
        name: "Anti-Hero",
        artists: ["Taylor Swift"],
        uri: "spotify:track:10",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Flowers", artist: "Miley Cyrus" },
      spotify: {
        id: "11",
        name: "Flowers",
        artists: ["Miley Cyrus"],
        uri: "spotify:track:11",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Unholy", artist: "Sam Smith ft. Kim Petras" },
      spotify: {
        id: "12",
        name: "Unholy",
        artists: ["Sam Smith", "Kim Petras"],
        uri: "spotify:track:12",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Calm Down", artist: "Rema & Selena Gomez" },
      spotify: {
        id: "13",
        name: "Calm Down",
        artists: ["Rema", "Selena Gomez"],
        uri: "spotify:track:13",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha" },
      spotify: {
        id: "14",
        name: "I'm Good (Blue)",
        artists: ["David Guetta", "Bebe Rexha"],
        uri: "spotify:track:14",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage" },
      spotify: {
        id: "15",
        name: "Creepin'",
        artists: ["Metro Boomin", "The Weeknd", "21 Savage"],
        uri: "spotify:track:15",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Vampire", artist: "Olivia Rodrigo" },
      spotify: {
        id: "16",
        name: "Vampire",
        artists: ["Olivia Rodrigo"],
        uri: "spotify:track:16",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "What It Is", artist: "Doechii" },
      spotify: {
        id: "17",
        name: "What It Is",
        artists: ["Doechii"],
        uri: "spotify:track:17",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Paint The Town Red", artist: "Doja Cat" },
      spotify: {
        id: "18",
        name: "Paint The Town Red",
        artists: ["Doja Cat"],
        uri: "spotify:track:18",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Greedy", artist: "Tate McRae" },
      spotify: {
        id: "19",
        name: "Greedy",
        artists: ["Tate McRae"],
        uri: "spotify:track:19",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Cruel Summer", artist: "Taylor Swift" },
      spotify: {
        id: "20",
        name: "Cruel Summer",
        artists: ["Taylor Swift"],
        uri: "spotify:track:20",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Golden", artist: "Harry Styles" },
      spotify: {
        id: "21",
        name: "Golden",
        artists: ["Harry Styles"],
        uri: "spotify:track:21",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar & Giveon" },
      spotify: {
        id: "22",
        name: "Peaches",
        artists: ["Justin Bieber", "Daniel Caesar", "Giveon"],
        uri: "spotify:track:22",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "drivers license", artist: "Olivia Rodrigo" },
      spotify: {
        id: "23",
        name: "drivers license",
        artists: ["Olivia Rodrigo"],
        uri: "spotify:track:23",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Therefore I Am", artist: "Billie Eilish" },
      spotify: {
        id: "24",
        name: "Therefore I Am",
        artists: ["Billie Eilish"],
        uri: "spotify:track:24",
        albumArt: null,
        previewUrl: null
      }
    },
    {
      original: { title: "Positions", artist: "Ariana Grande" },
      spotify: {
        id: "25",
        name: "Positions",
        artists: ["Ariana Grande"],
        uri: "spotify:track:25",
        albumArt: null,
        previewUrl: null
      }
    }
  ]*/
  );
  const [acceptedSongs, setAcceptedSongs] = useState<MatchedSong[]>([]);
  const [createdPlaylist, setCreatedPlaylist] = useState<Playlist | null>(null);
  const [generatedPlaylistName, setGeneratedPlaylistName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authSuccess = urlParams.get('auth');
    const sessionParam = urlParams.get('session');
    const userParam = urlParams.get('user');
    const errorParam = urlParams.get('error');

    if (authSuccess === 'success' && sessionParam && userParam) {
      // OAuth successful
      const userData = { id: userParam, name: decodeURIComponent(userParam) };
      handleLogin(userData, sessionParam);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (errorParam) {
      setError(`Authentication failed: ${errorParam}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLogin = (userData: User, userSessionId: string) => {
    setUser(userData);
    setSessionId(userSessionId);
    setCurrentStep('generate');
  };

  const handleSongsGenerated = () => {
    setCurrentStep('matching');
  };

  const handleSongsMatched = (matchedSongs: MatchedSong[]) => {
    setSongs(matchedSongs);
    setCurrentStep('swiping');
  };

  const handleSongsSelected = async (selectedSongs: MatchedSong[]) => {
    // Set accepted songs to the selected songs from the UI
    setAcceptedSongs(selectedSongs);
    console.log("in app", selectedSongs);
  };

  const handleSwipingComplete = (selectedSongs: MatchedSong[]) => {
    setAcceptedSongs(selectedSongs);
    if (selectedSongs.length > 0) {
      setCurrentStep('playlist');
    } else {
      setError('No songs were selected. Please try again.');
    }
  };

  const handlePlaylistCreated = (playlist: Playlist) => {
    setCreatedPlaylist(playlist);
    setCurrentStep('complete');
  };

  const handleStartOver = () => {
    setSongs([]);
    setAcceptedSongs([]);
    setCreatedPlaylist(null);
    setGeneratedPlaylistName('');
    setError(null);
    setCurrentStep('generate');
  };

  const handleLogout = async () => {
    if (sessionId) {
      try {
        await fetch(buildApiUrl('api/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    setUser(null);
    setSessionId(null);
    setSongs([]);
    setAcceptedSongs([]);
    setCreatedPlaylist(null);
    setError(null);
    setCurrentStep('login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Music Selector</h1>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.name}!</span>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </header>

      <main className="App-main">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {currentStep === 'login' && (
          <LoginPage onLogin={handleLogin} onError={setError} />
        )}

        {currentStep === 'generate' && sessionId && (
          <PromptGenerator
            sessionId={sessionId}
            onSongsGenerated={handleSongsGenerated}
            onPlaylistNameGenerated={setGeneratedPlaylistName}
            onError={setError}
          />
        )}

        {currentStep === 'matching' && sessionId && (
          <SongMatcher
            sessionId={sessionId}
            onSongsMatched={handleSongsMatched}
            onError={setError}
          />
        )}

        {currentStep === 'swiping' && (
          <SongSwiper
            songs={songs}
            onSongsSelected={handleSongsSelected}
            onComplete={handleSwipingComplete}
            acceptedCount={acceptedSongs.length}
          />
        )}

        {currentStep === 'playlist' && sessionId && (
          <PlaylistCreator
            sessionId={sessionId}
            acceptedSongs={acceptedSongs}
            defaultPlaylistName={generatedPlaylistName}
            onPlaylistCreated={handlePlaylistCreated}
            onError={setError}
          />
        )}

        {currentStep === 'complete' && createdPlaylist && (
          <div className="completion-screen">
            <div className="completion-card">
              <h2>🎉 Playlist Created Successfully!</h2>
              <div className="playlist-info">
                <h3>{createdPlaylist.name}</h3>
                <p>{createdPlaylist.trackCount} tracks added</p>
                <a 
                  href={createdPlaylist.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="spotify-link"
                >
                  Open in Spotify
                </a>
              </div>
              <button onClick={handleStartOver} className="start-over-btn">
                Create Another Playlist
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App; 