import * as fs from 'fs';
import * as path from 'path';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export class TokenStorage {
  private tokenFile: string;

  constructor(tokenFile: string = '.spotify-tokens.json') {
    this.tokenFile = path.resolve(tokenFile);
  }

  saveTokens(tokens: StoredTokens): void {
    try {
      const tokenData = {
        ...tokens,
        savedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(this.tokenFile, JSON.stringify(tokenData, null, 2));
      console.log('💾 Tokens saved successfully');
    } catch (error) {
      console.error('❌ Failed to save tokens:', error);
    }
  }

  loadTokens(): StoredTokens | null {
    try {
      if (!fs.existsSync(this.tokenFile)) {
        return null;
      }

      const data = fs.readFileSync(this.tokenFile, 'utf8');
      const tokens = JSON.parse(data);
      
      // Validate token structure
      if (!tokens.accessToken || !tokens.refreshToken || !tokens.expiresAt) {
        console.log('⚠️  Invalid token file format, will re-authenticate');
        return null;
      }

      console.log('📖 Loaded saved tokens');
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      };
    } catch (error) {
      console.error('❌ Failed to load tokens:', error);
      return null;
    }
  }

  deleteTokens(): void {
    try {
      if (fs.existsSync(this.tokenFile)) {
        fs.unlinkSync(this.tokenFile);
        console.log('🗑️  Tokens deleted');
      }
    } catch (error) {
      console.error('❌ Failed to delete tokens:', error);
    }
  }

  getTokenFile(): string {
    return this.tokenFile;
  }
} 