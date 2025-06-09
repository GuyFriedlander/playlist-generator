#!/bin/bash

# Music Selector - Status Check Script
echo "🔍 Checking Music Selector Status..."
echo ""

# Check if .env file exists and has required variables
echo "📋 Environment Configuration:"
if [ -f .env ]; then
    echo "  ✅ .env file exists"
    
    if grep -q "SPOTIFY_CLIENT_ID=your_spotify_client_id_here" .env; then
        echo "  ⚠️  SPOTIFY_CLIENT_ID not configured"
    else
        echo "  ✅ SPOTIFY_CLIENT_ID configured"
    fi
    
    if grep -q "SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here" .env; then
        echo "  ⚠️  SPOTIFY_CLIENT_SECRET not configured"
    else
        echo "  ✅ SPOTIFY_CLIENT_SECRET configured"
    fi
    
    if grep -q "NGROK_URL=" .env; then
        NGROK_URL=$(grep "NGROK_URL=" .env | cut -d'=' -f2)
        if [ ! -z "$NGROK_URL" ]; then
            echo "  ✅ ngrok URL configured: $NGROK_URL"
        else
            echo "  ⚠️  ngrok URL not set (run 'npm run ngrok')"
        fi
    else
        echo "  ⚠️  ngrok URL not configured"
    fi
else
    echo "  ❌ .env file missing (run './setup.sh')"
fi

echo ""

# Check if ngrok is running
echo "🌐 ngrok Status:"
if curl -s http://localhost:4040/api/tunnels > /dev/null 2>&1; then
    TUNNEL_COUNT=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url"' | wc -l)
    if [ $TUNNEL_COUNT -gt 0 ]; then
        echo "  ✅ ngrok is running with $TUNNEL_COUNT tunnel(s)"
        HTTPS_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
        if [ ! -z "$HTTPS_URL" ]; then
            echo "  🔗 HTTPS URL: $HTTPS_URL"
            echo "  📍 Callback: $HTTPS_URL/api/auth/callback"
        fi
    else
        echo "  ⚠️  ngrok is running but no tunnels active"
    fi
else
    echo "  ❌ ngrok is not running (run 'npm run ngrok')"
fi

echo ""

# Check if servers are running
echo "🚀 Server Status:"

# Check backend (port 3001)
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "  ✅ Backend server running (port 3001)"
else
    echo "  ❌ Backend server not running"
fi

# Check frontend (port 3000)
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "  ✅ Frontend server running (port 3000)"
else
    echo "  ❌ Frontend server not running"
fi

echo ""

# Check dependencies
echo "📦 Dependencies:"
if [ -d "node_modules" ]; then
    echo "  ✅ Backend dependencies installed"
else
    echo "  ❌ Backend dependencies missing (run 'npm install')"
fi

if [ -d "client/node_modules" ]; then
    echo "  ✅ Frontend dependencies installed"
else
    echo "  ❌ Frontend dependencies missing (run 'cd client && npm install')"
fi

echo ""

# Summary and next steps
echo "📋 Quick Start Guide:"
echo "1. Configure Spotify credentials in .env"
echo "2. Run 'npm run ngrok' (Terminal 1)"
echo "3. Add ngrok callback URL to Spotify app"
echo "4. Run 'npm run dev' (Terminal 2)"
echo "5. Visit http://localhost:3000"

echo ""
echo "🔗 Useful Links:"
echo "  Spotify Dashboard: https://developer.spotify.com/dashboard"
echo "  ngrok Web UI: http://localhost:4040"
echo "  Local App: http://localhost:3000" 