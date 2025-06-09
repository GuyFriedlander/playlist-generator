import OpenAI from 'openai';

interface SongRequest {
  prompt: string;
  languages: string[];
  count?: number;
}

interface GeneratedSong {
  title: string;
  artist: string;
}

interface GeneratedPlaylist {
  name: string;
  songs: GeneratedSong[];
}

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
  }

  // Helper function to detect and handle Hebrew text
  private containsHebrew(text: string): boolean {
    return /[\u0590-\u05FF]/.test(text);
  }

  // Helper function to wrap Hebrew text for better display
  private processHebrewText(text: string): string {
    if (this.containsHebrew(text)) {
      // Wrap Hebrew text in Unicode directional marks to improve RTL handling
      return `\u202B${text}\u202C`; // Right-to-Left Embedding + Pop Directional Formatting
    }
    return text;
  }

  // Helper function to clean and escape Hebrew text for JSON
  private sanitizeText(text: string): string {
    return text
      .replace(/[\u200E\u200F\u202A-\u202E]/g, '') // Remove existing directional marks
      .trim();
  }

  async generateSongs(request: SongRequest): Promise<GeneratedPlaylist> {
    const { prompt, languages, count = 25 } = request;
    
    // Clean and process the prompt
    const cleanPrompt = this.sanitizeText(prompt);
    const isHebrewPrompt = this.containsHebrew(cleanPrompt);
    
    const languageText = languages.length > 0 
      ? `in ${languages.join(', ')} language(s)` 
      : 'in any language';

    const systemPrompt = `You are a music expert that understands multiple languages including Hebrew (עברית). Generate a creative playlist name and exactly ${count} songs based on the user's request.

Requirements:
- Return songs ${languageText}
- Each song should match the user's mood/genre/theme request
- Mix popular and lesser-known tracks
- Include diverse artists when possible
- Create a catchy, relevant playlist name that captures the essence of the request
- Return ONLY a JSON object with "name" and "songs" fields
- No additional text, explanations, or formatting
- Ensure song titles and artist names are accurate and real
- Handle Hebrew text properly and maintain proper encoding
- For Hebrew songs/artists, include both Hebrew and English names when possible

Example format:
{
  "name": "Epic Rock Anthems",
  "songs": [
    {"title": "Bohemian Rhapsody", "artist": "Queen"},
    {"title": "Billie Jean", "artist": "Michael Jackson"}
  ]
}

If the prompt is in Hebrew, understand the Hebrew request and respond appropriately with relevant songs.`;

    let userPrompt: string;
    if (isHebrewPrompt) {
      userPrompt = `צור שם פלייליסט יצירתי ו-${count} שירים ${languageText} שמתאימים לבקשה הזו בעברית: "${cleanPrompt}"

הבקשה בעברית: "${cleanPrompt}"

Focus on creating a cohesive playlist that captures the mood, genre, or theme described in the Hebrew prompt. The playlist name should be catchy and descriptive. Include Hebrew songs if relevant to the request.`;
    } else {
      userPrompt = `Generate a creative playlist name and ${count} songs ${languageText} that match this request: "${cleanPrompt}"

Focus on creating a cohesive playlist that captures the mood, genre, or theme described in the prompt. The playlist name should be catchy and descriptive.`;
    }
    console.log("userPrompt", userPrompt);
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Parse the JSON response
      let playlist: GeneratedPlaylist;
      try {
        playlist = JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', response);
        throw new Error('Invalid response format from OpenAI');
      }

      // Validate the response
      if (!playlist || !playlist.name || !Array.isArray(playlist.songs)) {
        throw new Error('Invalid playlist format from OpenAI');
      }

      // Process and clean Hebrew text in the response
      playlist.name = this.sanitizeText(playlist.name);
      
      // Ensure we have the right number of songs with proper format
      const validSongs = playlist.songs
        .filter(song => song && song.title && song.artist)
        .map(song => ({
          title: this.sanitizeText(song.title),
          artist: this.sanitizeText(song.artist)
        }))
        .slice(0, count);

      if (validSongs.length === 0) {
        throw new Error('No valid songs generated');
      }

      const result = {
        name: playlist.name,
        songs: validSongs
      };

      const promptLanguage = isHebrewPrompt ? 'Hebrew' : 'English';
      console.log(`🤖 Generated playlist "${result.name}" with ${validSongs.length} songs for ${promptLanguage} prompt: "${cleanPrompt}"`);
      return result;

    } catch (error) {
      console.error('OpenAI song generation error:', error);
      
      // Fallback songs if API fails (including quota, rate limit, or access issues)
      console.log('🔄 Using fallback songs due to OpenAI API issue');
      return this.getFallbackSongs(count, isHebrewPrompt);
    }
  }

  private getFallbackSongs(count: number, includeHebrew: boolean = false): GeneratedPlaylist {
    const fallbackSongs = [
      { title: "Shape of You", artist: "Ed Sheeran" },
      { title: "Blinding Lights", artist: "The Weeknd" },
      { title: "Watermelon Sugar", artist: "Harry Styles" },
      { title: "Levitating", artist: "Dua Lipa" },
      { title: "good 4 u", artist: "Olivia Rodrigo" },
      { title: "STAY", artist: "The Kid LAROI, Justin Bieber" },
      { title: "Heat Waves", artist: "Glass Animals" },
      { title: "As It Was", artist: "Harry Styles" },
      { title: "Bad Habit", artist: "Steve Lacy" },
      { title: "Anti-Hero", artist: "Taylor Swift" },
      { title: "Flowers", artist: "Miley Cyrus" },
      { title: "Unholy", artist: "Sam Smith ft. Kim Petras" },
      { title: "Calm Down", artist: "Rema & Selena Gomez" },
      { title: "I'm Good (Blue)", artist: "David Guetta & Bebe Rexha" },
      { title: "Creepin'", artist: "Metro Boomin, The Weeknd, 21 Savage" },
      { title: "Vampire", artist: "Olivia Rodrigo" },
      { title: "What It Is", artist: "Doechii" },
      { title: "Paint The Town Red", artist: "Doja Cat" },
      { title: "Greedy", artist: "Tate McRae" },
      { title: "Cruel Summer", artist: "Taylor Swift" },
      { title: "Golden", artist: "Harry Styles" },
      { title: "Peaches", artist: "Justin Bieber ft. Daniel Caesar & Giveon" },
      { title: "drivers license", artist: "Olivia Rodrigo" },
      { title: "Therefore I Am", artist: "Billie Eilish" },
      { title: "Positions", artist: "Ariana Grande" }
    ];

    // Add some Hebrew songs if Hebrew was detected
    if (includeHebrew) {
      const hebrewSongs = [
        { title: "בוא", artist: "עידן רייכל" },
        { title: "שיר אהבה", artist: "אהוד בנאי" },
        { title: "צמח", artist: "ברי סחרוף" },
        { title: "אני אוהב אותך חיים", artist: "שלמה ארצי" },
        { title: "בלי גבול", artist: "עברי לידר" }
      ];
      
      // Mix Hebrew and international songs
      const mixedSongs = [...hebrewSongs, ...fallbackSongs];
      return {
        name: "רשימת השמעה פופולרית", // Popular Playlist in Hebrew
        songs: mixedSongs.slice(0, count)
      };
    }

    return {
      name: "Popular Hits Playlist",
      songs: fallbackSongs.slice(0, count)
    };
  }
} 