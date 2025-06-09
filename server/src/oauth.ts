import express from 'express';
import axios from 'axios';
import * as crypto from 'crypto';
import open from 'open';
import { Server } from 'http';

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface SpotifyTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class SpotifyOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private scopes: string[];
  private port: number;
  private codeVerifier: string;
  private codeChallenge: string;

  constructor(clientId: string, clientSecret: string, redirectUri?: string, port: number = 8888) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.port = port;
    
    // Use provided redirectUri (for ngrok) or fallback to localhost
    this.redirectUri = redirectUri || `http://localhost:${port}/callback`;
    
    this.scopes = [
      'user-read-private',
      'user-read-email',
      'playlist-modify-public',
      'playlist-modify-private',
      'user-top-read'  // Required to access user's top tracks and artists
    ];

    // Generate PKCE code verifier and challenge
    this.codeVerifier = this.generateCodeVerifier();
    this.codeChallenge = this.generateCodeChallenge(this.codeVerifier);
  }

  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  get getCodeVerifier(): string {
    return this.codeVerifier;
  }

  buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: this.codeChallenge,
      state: crypto.randomBytes(16).toString('hex')
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  buildAuthUrlWithState(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: this.scopes.join(' '),
      code_challenge_method: 'S256',
      code_challenge: this.codeChallenge,
      state: state
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
  }

  async authenticate(): Promise<SpotifyTokens> {
    return new Promise((resolve, reject) => {
      const app = express();
      let server: Server;

      // Handle the callback from Spotify
      app.get('/callback', async (req, res) => {
        const { code, error, state } = req.query;

        if (error) {
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e22134;">❌ Authentication Failed</h1>
                <p>Error: ${error}</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (!code) {
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e22134;">❌ No Authorization Code</h1>
                <p>No authorization code received from Spotify.</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
          server.close();
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          // Exchange authorization code for tokens
          const tokenResponse = await this.exchangeCodeForTokens(code as string);
          
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #1db954;">✅ Authentication Successful!</h1>
                <p>You have successfully authenticated with Spotify.</p>
                <p>You can now close this window and return to the application.</p>
                <script>
                  setTimeout(() => {
                    window.close();
                  }, 3000);
                </script>
              </body>
            </html>
          `);

          server.close();
          resolve({
            accessToken: tokenResponse.access_token,
            refreshToken: tokenResponse.refresh_token,
            expiresAt: Date.now() + (tokenResponse.expires_in * 1000)
          });

        } catch (error) {
          res.send(`
            <html>
              <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #e22134;">❌ Token Exchange Failed</h1>
                <p>Failed to exchange authorization code for tokens.</p>
                <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
                <p>You can close this window and try again.</p>
              </body>
            </html>
          `);
          server.close();
          reject(error);
        }
      });

      // Start the local server
      server = app.listen(this.port, () => {
        console.log(`🌐 OAuth server started on http://localhost:${this.port}`);
        console.log('🔐 Opening browser for Spotify authentication...');
        
        const authUrl = this.buildAuthUrl();
        open(authUrl).catch((err: any) => {
          console.log('❌ Failed to open browser automatically.');
          console.log(`Please manually open this URL in your browser:`);
          console.log(`${authUrl}\n`);
        });
      });

      // Handle server errors
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.port} is already in use. Please close any other applications using this port or change the port.`));
        } else {
          reject(err);
        }
      });

      // Set a timeout for the authentication process
      setTimeout(() => {
        server.close();
        reject(new Error('Authentication timeout. Please try again.'));
      }, 300000); // 5 minutes timeout
    });
  }

  async exchangeCodeForTokens(code: string): Promise<SpotifyTokenResponse> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: this.codeVerifier
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<SpotifyTokens> {
    try {
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.clientId
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          }
        }
      );

      const tokenData: SpotifyTokenResponse = response.data;

      return {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || refreshToken, // Some responses may not include refresh_token
        expiresAt: Date.now() + (tokenData.expires_in * 1000)
      };
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw new Error(`Failed to refresh tokens: ${error.response?.data?.error_description || error.message}`);
    }
  }

  isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= expiresAt - 60000; // Consider expired 1 minute before actual expiry
  }
} 