# 🎵 Music Selector - Fullstack Web Application

Transform your CSV song lists into curated Spotify playlists with a fun, Tinder-like interface!

## ✨ Features

- **📁 CSV Upload**: Upload CSV files with your song lists
- **🔍 Smart Matching**: Automatically find your songs on Spotify
- **❤️ Tinder-Style Selection**: Swipe through songs to choose your favorites
- **🎶 Playlist Creation**: Generate beautiful Spotify playlists instantly
- **🔐 OAuth 2.0 Integration**: Secure Spotify authentication
- **📱 Responsive Design**: Works perfectly on desktop and mobile

## 🏗️ Architecture

### Backend (Node.js + Express)
- OAuth 2.0 Spotify authentication
- CSV file processing
- Spotify API integration
- RESTful API endpoints
- Session management

### Frontend (React + TypeScript)
- Modern React with hooks
- Framer Motion animations
- Responsive design
- Tinder-like swipe interface
- File drag & drop upload

## 🚀 Quick Start

### Prerequisites
- **Node.js 16+** and npm
- **Spotify Developer Account**
- **ngrok** installed ([download here](https://ngrok.com/download))

### 1. Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. **Important**: You'll add the redirect URI after step 4 (ngrok setup)
4. Note your **Client ID** and **Client Secret**

### 2. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd music-selector

# Install all dependencies (backend + frontend)
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Spotify API Credentials (REQUIRED)
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here

# Server Configuration
PORT=3001
NODE_ENV=development
SESSION_SECRET=your_secure_session_secret_here

# Frontend URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### 4. ⚠️ **IMPORTANT**: Start ngrok FIRST

> **Critical Order**: You MUST start ngrok before running the server and client!

#### For macOS/Linux:
```bash
# Terminal 1: Start ngrok tunnels (MUST BE FIRST!)
npm run ngrok
```

#### For Windows:
```cmd
# Command Prompt 1: Start ngrok tunnels (MUST BE FIRST!)
npm run ngrok:windows
```

This will:
- Create HTTPS tunnels for both frontend and backend
- Show URLs like:
  ```
  🌐 Frontend URL: https://abc123.ngrok-free.app
  🔗 Backend URL: https://def456.ngrok-free.app
  🔗 OAuth Callback: https://def456.ngrok-free.app/api/auth/callback
  ```
- Automatically update environment files

#### Step 5: Update Spotify App Settings
1. Copy the **OAuth Callback URL** from ngrok output
2. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
3. Edit your app settings
4. Add the callback URL to "Redirect URIs": `https://def456.ngrok-free.app/api/auth/callback`
5. Save changes

#### Step 6: Start the Application
```bash
# Terminal 2: Start both server and client (WITH nodemon auto-restart)
npm run dev

# Or run separately:
# Backend (with auto-restart):
npm run dev:server

# Frontend:
npm run dev:client
```

### 🌐 Access Your App

- **Frontend**: Use the ngrok frontend URL (accessible from anywhere!)
- **Backend API**: Available via ngrok backend URL  
- **Local Development**: Still available at `http://localhost:3000`

### 🔒 HTTPS Requirement
Spotify OAuth **requires HTTPS** for redirect URIs. The ngrok tunnel provides this automatically.

## 📁 Additional Documentation

- **Frontend Setup**: See [client/README.md](client/README.md) for React-specific instructions
- **Cross-Platform**: Includes both Unix (`start-ngrok.sh`) and Windows (`start-ngrok.bat`) scripts

## 🌐 Application URLs

After following the setup:
- **Frontend**: Use the ngrok frontend URL (accessible from anywhere!)
- **Backend API**: Use the ngrok backend URL  
- **Local Development**: Also available at http://localhost:3000
- **ngrok Web Interface**: http://localhost:4040

## 📁 CSV Format

Your CSV file should have the following format:

```csv
title,artist
Bohemian Rhapsody,Queen
Hotel California,Eagles
Sweet Child O' Mine,Guns N' Roses
Stairway to Heaven,Led Zeppelin
```

### Requirements:
- Columns: `title`, `artist`
- Header row optional (auto-detected)
- UTF-8 encoding recommended
- CSV file extension (`.csv`)

## 🎯 How It Works

1. **🔐 Login**: Authenticate with your Spotify account
2. **📁 Upload**: Upload your CSV file with song titles and artists
3. **🔍 Matching**: The app searches Spotify for each song
4. **❤️ Selection**: Swipe through matched songs (right = love, left = skip)
5. **🎶 Creation**: Generate and save a new Spotify playlist
6. **🎉 Enjoy**: Your playlist appears instantly in Spotify!

## 🛠️ API Endpoints

### Authentication
- `GET /api/auth/login` - Start Spotify OAuth flow
- `POST /api/auth/logout` - End user session

### File & Song Management
- `POST /api/upload-csv` - Upload CSV file
- `POST /api/match-songs` - Match songs with Spotify
- `GET /api/songs/:sessionId` - Get matched songs
- `POST /api/accept-song` - Accept a song for playlist

### Playlist
- `POST /api/create-playlist` - Create Spotify playlist

### Utility
- `GET /api/health` - Health check

## 🎨 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Multer** - File upload handling
- **csv-parse** - CSV processing
- **Axios** - HTTP client
- **Express Session** - Session management

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Framer Motion** - Animations & gestures
- **Modern CSS** - Styling with gradients and glassmorphism
- **Responsive Design** - Mobile-first approach

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SPOTIFY_CLIENT_ID` | Your Spotify app client ID | Required |
| `SPOTIFY_CLIENT_SECRET` | Your Spotify app client secret | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `SESSION_SECRET` | Session encryption secret | your-secret-key |
| `CLIENT_URL` | Frontend URL for CORS | http://localhost:3000 |

## 🚨 Troubleshooting

### Common Issues

**⚠️ "Invalid session" or OAuth Fails**
- **MOST COMMON**: You started the server before ngrok!
  1. Stop server (`Ctrl+C`)
  2. Start ngrok first: `npm run ngrok` (macOS/Linux) or `npm run ngrok:windows` (Windows)
  3. Then start server: `npm run dev`
- Verify Spotify app credentials in `.env`
- Check redirect URI matches ngrok URL exactly: `https://abc123.ngrok-free.app/api/auth/callback`
- Verify .env file has correct SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET

**ngrok Issues**
- **Installation**: 
  - macOS: `brew install ngrok`
  - Windows: Download from https://ngrok.com/download
  - Linux: Download from https://ngrok.com/download
- Check if tunnel is active: visit http://localhost:4040
- **Windows**: Make sure `curl` is available (comes with Windows 10+)
- If URLs change, update Spotify app redirect URI with new ngrok URL
- Free ngrok tunnels expire - restart ngrok script if needed

**Windows-Specific Issues**
- If batch script fails, ensure you're using Command Prompt (not PowerShell)
- Make sure `curl` command is available (Windows 10+ has it built-in)
- If you get permission errors, try running Command Prompt as Administrator

**CSV Upload Issues**
- Verify CSV format (title, artist columns)
- Check file encoding (UTF-8 recommended)
- Ensure file has `.csv` extension

**Songs Not Found**
- Song names might not match exactly
- Try simpler search terms
- Check for special characters or formatting

**Build Issues**
```bash
# Clear cache and reinstall
rm -rf node_modules client/node_modules
rm package-lock.json client/package-lock.json
npm install
cd client && npm install
```

## 📝 Development

### Project Structure
```
music-selector/
├── src/                    # Backend source
│   ├── server.ts          # Main server file
│   ├── oauth.ts           # OAuth implementation
│   ├── spotifyService.ts  # Spotify API wrapper
│   ├── csvProcessor.ts    # CSV handling
│   └── types/             # TypeScript declarations
├── client/                # Frontend source
│   ├── src/
│   │   ├── App.tsx        # Main React component
│   │   ├── components/    # React components
│   │   └── ...
│   └── public/
├── dist/                  # Compiled backend
└── uploads/               # Temporary file storage
```

### Available Scripts

```bash
# ngrok & HTTPS (START THESE FIRST!)
npm run ngrok              # Start ngrok tunnels (macOS/Linux)
npm run ngrok:windows      # Start ngrok tunnels (Windows)
npm run dev:ngrok          # Show ngrok setup instructions

# Backend (with auto-restart via nodemon)
npm run dev:server         # Development server with auto-restart
npm run build:server       # Build backend

# Frontend
npm run dev:client         # Development React app
npm run build:client       # Build React app

# Full Application
npm run dev                # Both backend & frontend (backend auto-restarts)
npm run build              # Build everything
npm start                  # Production server
npm run clean              # Clean build files
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Spotify Web API for music data
- Framer Motion for smooth animations
- React community for amazing tools
- All the music lovers who inspired this project

---

**Happy playlist creating!** 🎵✨ 