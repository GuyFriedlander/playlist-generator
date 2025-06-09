import axios, { AxiosResponse } from 'axios';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  uri: string;
  preview_url: string | null;
  album?: {
    images?: { url: string }[];
  };
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

interface SpotifyTopTracksResponse {
  items: SpotifyTopItem[];
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

export class SpotifyService {
  private accessToken: string;
  private clientId: string;
  private clientSecret: string;
  private baseUrl = 'https://api.spotify.com/v1';

  constructor(accessToken: string, clientId: string, clientSecret: string) {
    this.accessToken = accessToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
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
      console.error('Failed to get current user:', error.response?.data || error.message);
      throw new Error('Failed to get user information');
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

  async getTopTracks(limit: number = 5, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyTopItem[]> {
    try {
      const headers = this.getHeaders();
      const response: AxiosResponse<SpotifyTopTracksResponse> = await axios.get(
        `${this.baseUrl}/me/top/tracks?limit=${limit}&time_range=${timeRange}`,
        { headers }
      );
      return response.data.items || [];
    } catch (error: any) {
      // Handle cases where user doesn't have enough listening history
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log('User may not have sufficient listening history for top tracks');
        return [];
      }
      console.error('Failed to get top tracks:', error);
      return [];
    }
  }

  async getTopArtists(limit: number = 5, timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'): Promise<SpotifyArtist[]> {
    try {
      const headers = this.getHeaders();
      const response: AxiosResponse<SpotifyTopArtistsResponse> = await axios.get(
        `${this.baseUrl}/me/top/artists?limit=${limit}&time_range=${timeRange}`,
        { headers }
      );
      return response.data.items || [];
    } catch (error: any) {
      // Handle cases where user doesn't have enough listening history
      if (error.response?.status === 403 || error.response?.status === 404) {
        console.log('User may not have sufficient listening history for top artists');
        return [];
      }
      console.error('Failed to get top artists:', error);
      return [];
    }
  }

  async getUserMusicPreferences(): Promise<{ topTracks: SpotifyTopItem[], topArtists: SpotifyArtist[] }> {
    try {
      const [topTracks, topArtists] = await Promise.all([
        this.getTopTracks(5),
        this.getTopArtists(5)
      ]);
      
      return { topTracks, topArtists };
    } catch (error) {
      console.error('Failed to get user music preferences:', error);
      return { topTracks: [], topArtists: [] };
    }
  }
} 