import React, { useState } from 'react';
import { User } from '../App';
import { buildApiUrl } from '../config';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: (user: User, sessionId: string) => void;
  onError: (error: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onError }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSpotifyLogin = async (event?: React.MouseEvent | React.TouchEvent) => {
    // Prevent default behavior on mobile
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    setIsLoading(true);
    try {
      console.log('🔑 Starting Spotify login...');
      console.log('📱 User Agent:', navigator.userAgent);
      console.log('🌐 API URL:', buildApiUrl('api/auth/login'));
      console.log('🌍 Current hostname:', window.location.hostname);
      
      // Check if we're using ngrok and add bypass header
      const isNgrok = window.location.hostname.includes('ngrok-free.app') || window.location.hostname.includes('ngrok.io');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      
      // Add ngrok bypass header when using ngrok
      if (isNgrok) {
        headers['ngrok-skip-browser-warning'] = 'true';
        console.log('🔧 Added ngrok bypass header for ngrok environment');
      }

      const response = await fetch(buildApiUrl('api/auth/login'), {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.log('⚠️ Could not parse error response as JSON');
          const textResponse = await response.text();
          console.log('📄 Raw error response:', textResponse);
          errorMessage = textResponse || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('✅ Login response:', data);
      
      if (data.success && data.authUrl) {
        console.log('🔄 Redirecting to Spotify...');
        console.log('🔗 Auth URL:', data.authUrl);
        
        // Use location.assign for better mobile compatibility
        setTimeout(() => {
          window.location.assign(data.authUrl);
        }, 100);
        return; // Exit function after redirect
      } else {
        throw new Error('Invalid response from server: ' + JSON.stringify(data));
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.log("error",error)
      onError(error instanceof Error ? error.message : 'Login failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h2>🎵 Music Selector</h2>
          <p>AI-powered playlist creation</p>
        </div>
        
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <div className="feature-text">
              <h3>AI Song Generation</h3>
              <p>Describe your mood, get perfect songs</p>
            </div>
          </div>
          
          <div className="feature">
            <span className="feature-icon">❤️</span>
            <div className="feature-text">
              <h3>Swipe to Select</h3>
              <p>Tinder-style interface to choose favorites</p>
            </div>
          </div>
          
          <div className="feature">
            <span className="feature-icon">🎶</span>
            <div className="feature-text">
              <h3>Instant Playlists</h3>
              <p>Create Spotify playlists in seconds</p>
            </div>
          </div>
        </div>

        <button 
          className="spotify-login-btn" 
          onClick={handleSpotifyLogin}
          onTouchStart={(e) => e.preventDefault()}
          onTouchEnd={handleSpotifyLogin}
          disabled={isLoading}
          type="button"
        >
          {isLoading ? (
            <span>🔄 Connecting...</span>
          ) : (
            <span>🎵 Continue with Spotify</span>
          )}
        </button>
        
        <p className="privacy-note">
          We only access your public profile and playlist permissions.
        </p>
      </div>
    </div>
  );
};

export default LoginPage; 