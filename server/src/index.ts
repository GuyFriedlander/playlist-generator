import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosResponse } from 'axios';
import { parse } from 'csv-parse';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Interfaces
interface Song {
  title: string;
  artist: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string;
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  external_urls: { spotify: string };
}

interface SpotifyUser {
  id: string;
  display_name: string;
}

interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

class SpotifyPlaylistCreator {
  private accessToken: string;
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.spotify.com/v1';

  constructor(accessToken: string, clientId: string, clientSecret: string) {
    this.accessToken = accessToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  static async create(clientId: string, clientSecret: string): Promise<SpotifyPlaylistCreator> {
    const accessToken = await SpotifyPlaylistCreator.getAccessToken(clientId, clientSecret);
    return new SpotifyPlaylistCreator(accessToken, clientId, clientSecret);
  }

  static async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    try {
      console.log('🔑 Getting access token from Spotify...');
      const response: AxiosResponse<SpotifyTokenResponse> = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          },
        }
      );
      console.log('✅ Successfully obtained access token');
      return response.data.access_token;
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.error('❌ Invalid client credentials!');
        console.error('   Please check your SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
      }
      console.error('Failed to get access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getCurrentUser(): Promise<SpotifyUser> {
    try {
      const headers = this.getHeaders();
      const response: AxiosResponse<SpotifyUser> = await axios.get(
        `${this.baseUrl}/me`,
        { headers }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.error('❌ Client credentials cannot access user information!');
        console.error('   Client credentials flow is limited to app-only requests.');
        console.error('   For user access and playlist creation, you need user authorization.');
        throw new Error('User access not available with client credentials');
      }
      console.error('Failed to get current user:', error.message);
      throw new Error('Failed to authenticate with Spotify');
    }
  }

  async searchTrack(title: string, artist: string): Promise<SpotifyTrack | null> {
    try {
      const query = encodeURIComponent(`track:"${title}" artist:"${artist}"`);
      const headers = this.getHeaders();
      const response: AxiosResponse<SpotifySearchResponse> = await axios.get(
        `${this.baseUrl}/search?q=${query}&type=track&limit=1`,
        { headers }
      );

      const tracks = response.data.tracks.items;
      return tracks.length > 0 ? tracks[0] : null;
    } catch (error) {
      console.error(`Failed to search for track "${title}" by "${artist}":`, error);
      return null;
    }
  }

  async createPlaylist(userId: string, playlistName: string, description?: string): Promise<SpotifyPlaylist> {
    try {
      const headers = this.getHeaders();
      const response: AxiosResponse<SpotifyPlaylist> = await axios.post(
        `${this.baseUrl}/users/${userId}/playlists`,
        {
          name: playlistName,
          description: description || `Generated playlist created on ${new Date().toLocaleDateString()}`,
          public: false,
        },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      throw new Error('Failed to create playlist');
    }
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    try {
      // Spotify allows max 100 tracks per request
      const batchSize = 100;
      for (let i = 0; i < trackUris.length; i += batchSize) {
        const batch = trackUris.slice(i, i + batchSize);
        const headers = this.getHeaders();
        await axios.post(
          `${this.baseUrl}/playlists/${playlistId}/tracks`,
          { uris: batch },
          { headers }
        );
      }
    } catch (error) {
      console.error('Failed to add tracks to playlist:', error);
      throw new Error('Failed to add tracks to playlist');
    }
  }
}

async function readCsvFile(filePath: string): Promise<Song[]> {
  return new Promise((resolve, reject) => {
    const songs: Song[] = [];
    
    if (!fs.existsSync(filePath)) {
      reject(new Error(`CSV file not found: ${filePath}`));
      return;
    }

    fs.createReadStream(filePath)
      .pipe(parse({
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }))
      .on('data', (row: { title?: string; artist?: string }) => {
        if (row.title && row.artist) {
          songs.push({
            title: row.title.trim(),
            artist: row.artist.trim(),
          });
        }
      })
      .on('end', () => {
        console.log(`📁 Successfully read ${songs.length} songs from CSV file`);
        resolve(songs);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function main() {
  try {
    console.log('🎵 Starting Spotify Playlist Creator');
    console.log('================================');
    
    // Check for required credentials
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('❌ Missing Spotify Credentials!');
      console.error('   ');
      console.error('   Please set the following environment variables:');
      console.error('   SPOTIFY_CLIENT_ID=your_client_id_here');
      console.error('   SPOTIFY_CLIENT_SECRET=your_client_secret_here');
      console.error('   ');
      console.error('   Get client credentials from: https://developer.spotify.com/dashboard');
      throw new Error('Spotify credentials are required');
    }

    // Initialize Spotify and get access token
    console.log('🚀 Initializing Spotify API...');
    const spotify = await SpotifyPlaylistCreator.create(clientId, clientSecret);
    
    console.log('⚠️  Note: Using client credentials flow - playlist creation requires user authorization');
    console.log('🎵 Ready to search for tracks');

    // Read CSV file
    const csvPath = process.env.CSV_FILE_PATH || 'songs.csv';
    console.log(`📖 Reading songs from: ${csvPath}`);
    const songs = await readCsvFile(csvPath);

    if (songs.length === 0) {
      console.log('❌ No songs found in CSV file');
      return;
    }

    // Search for tracks on Spotify
    console.log('🔍 Searching for tracks on Spotify...');
    const foundTracks: SpotifyTrack[] = [];
    const skippedSongs: Song[] = [];

    for (const song of songs) {
      console.log(`   Searching: "${song.title}" by ${song.artist}`);
      const track = await spotify.searchTrack(song.title, song.artist);
      
      if (track) {
        foundTracks.push(track);
        console.log(`   ✅ Found: "${track.name}" by ${track.artists.map((a: { name: string }) => a.name).join(', ')}`);
      } else {
        skippedSongs.push(song);
        console.log(`   ❌ Not found: "${song.title}" by ${song.artist}`);
      }

      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (foundTracks.length === 0) {
      console.log('❌ No tracks were found on Spotify');
      return;
    }

    // Display found tracks information
    console.log('\n🎵 Track search completed!');
    console.log('\n⚠️  Note: Playlist creation is not available with client credentials.');
    console.log('   To create playlists, you need user authorization.');
    console.log('   For now, here are the Spotify URIs of found tracks:');
    console.log('\n📝 Found Track URIs:');
    foundTracks.forEach((track, index) => {
      console.log(`   ${index + 1}. ${track.uri} - "${track.name}" by ${track.artists.map(a => a.name).join(', ')}`);
    });

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   • Total songs in CSV: ${songs.length}`);
    console.log(`   • Songs found on Spotify: ${foundTracks.length}`);
    console.log(`   • Songs skipped: ${skippedSongs.length}`);

    if (skippedSongs.length > 0) {
      console.log('\n⚠️  Skipped songs:');
      skippedSongs.forEach(song => {
        console.log(`   • "${song.title}" by ${song.artist}`);
      });
    }

    console.log('\n🎉 Track search completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run the application
if (require.main === module) {
  main();
} 