#!/bin/bash

# Music Selector - ngrok Setup Script
echo "🌐 Starting ngrok tunnels for both frontend and backend..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it from https://ngrok.com/"
    exit 1
fi

# Kill any existing ngrok processes
pkill -f "ngrok http" 2>/dev/null
sleep 2

# Start ngrok for backend (port 3001)
echo "🚀 Starting ngrok tunnel for backend (port 3001)..."
ngrok http 3001 --log=stdout > ngrok-backend.log 2>&1 &
BACKEND_PID=$!

# Start ngrok for frontend (port 3000) 
echo "🚀 Starting ngrok tunnel for frontend (port 3000)..."
ngrok http 3000 --log=stdout > ngrok-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for both tunnels to initialize
echo "⏳ Waiting for tunnels to initialize..."
sleep 5

# Get the ngrok URLs from both API endpoints
TUNNELS_4040=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null)
TUNNELS_4041=$(curl -s http://localhost:4041/api/tunnels 2>/dev/null)

# Combine both API responses
ALL_TUNNELS="$TUNNELS_4040 $TUNNELS_4041"

if [ -z "$ALL_TUNNELS" ] || [ "$ALL_TUNNELS" = "  " ]; then
    echo "❌ Failed to connect to ngrok API. Make sure ngrok is running."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Extract URLs from both sources
FRONTEND_URL=""
BACKEND_URL=""

# Check 4040 interface (usually frontend)
if [ ! -z "$TUNNELS_4040" ] && [ "$TUNNELS_4040" != " " ]; then
    URL_4040=$(echo "$TUNNELS_4040" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    if echo "$TUNNELS_4040" | grep -q ':3000'; then
        FRONTEND_URL=$URL_4040
    elif echo "$TUNNELS_4040" | grep -q ':3001'; then
        BACKEND_URL=$URL_4040
    fi
fi

# Check 4041 interface (usually backend)
if [ ! -z "$TUNNELS_4041" ] && [ "$TUNNELS_4041" != " " ]; then
    URL_4041=$(echo "$TUNNELS_4041" | grep -o '"public_url":"https://[^"]*' | cut -d'"' -f4 | head -1)
    if echo "$TUNNELS_4041" | grep -q ':3000'; then
        FRONTEND_URL=$URL_4041
    elif echo "$TUNNELS_4041" | grep -q ':3001'; then
        BACKEND_URL=$URL_4041
    fi
fi

# Validate URLs
if [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; then
    echo "❌ Failed to get ngrok URLs. Debug info:"
    echo "Backend URL: $BACKEND_URL"
    echo "Frontend URL: $FRONTEND_URL"
    echo "Tunnels JSON: $ALL_TUNNELS"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "✅ Both ngrok tunnels established!"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo "🔗 Backend URL: $BACKEND_URL"
echo "🔗 OAuth Callback: $BACKEND_URL/api/auth/callback"
echo ""

# Update server/.env file with both ngrok URLs
if [ -f server/.env ]; then
    # Clean way to update .env file - remove all NGROK entries and add new ones
    grep -v "NGROK" server/.env > server/.env.clean && mv server/.env.clean server/.env
    echo "NGROK_URL=$BACKEND_URL" >> server/.env
    echo "NGROK_CLIENT_URL=$FRONTEND_URL" >> server/.env
    
    echo "✅ Updated server/.env file with both ngrok URLs"
else
    echo "⚠️  server/.env file not found. Please create it first."
fi

# Update client .env file with new backend URL
if [ ! -d client ]; then
    echo "⚠️  client directory not found."
else
    # Create or update client/.env file
    echo "REACT_APP_NGROK_BACKEND_URL=$BACKEND_URL" > client/.env
    echo "REACT_APP_NGROK_FRONTEND_URL=$FRONTEND_URL" >> client/.env
    
    echo "✅ Updated client/.env with ngrok URLs:"
    echo "   REACT_APP_NGROK_BACKEND_URL=$BACKEND_URL"
    echo "   REACT_APP_NGROK_FRONTEND_URL=$FRONTEND_URL"
fi

# Update server.ts allowedOrigins with new ngrok URLs
if [ -f server/src/server.ts ]; then
    # Create backup
    cp server/src/server.ts server/src/server.ts.backup
    
    # Replace old hardcoded ngrok URLs in allowedOrigins array
    # This replaces any existing ngrok-free.app URLs with the new ones
    sed -i '' "s|'https://[^']*\.ngrok-free\.app'.*// Frontend ngrok URL|'$FRONTEND_URL', // Frontend ngrok URL|g" server/src/server.ts
    sed -i '' "s|'https://[^']*\.ngrok-free\.app'.*// Backend ngrok URL.*|'$BACKEND_URL'  // Backend ngrok URL (for same-origin requests)|g" server/src/server.ts
    
    echo "✅ Updated server/src/server.ts allowedOrigins with new ngrok URLs"
    echo "   Frontend: $FRONTEND_URL"
    echo "   Backend: $BACKEND_URL"
else
    echo "⚠️  server/src/server.ts file not found."
fi

echo ""
echo "📋 NEXT STEPS:"
echo "1. Go to https://developer.spotify.com/dashboard"
echo "2. Edit your Spotify app settings"
echo "3. Add this redirect URI: $BACKEND_URL/api/auth/callback"
echo "4. In a new terminal, run: npm run dev"
echo "5. Access your app from anywhere at: $FRONTEND_URL"
echo "6. 📱 Perfect for mobile access!"
echo ""
echo "💡 Keep this terminal open to maintain both ngrok tunnels"
echo "⏹️  Press Ctrl+C to stop both tunnels when done"
echo ""

# Setup cleanup trap for both processes
cleanup() {
    echo ""
    echo "🛑 Stopping ngrok tunnels..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    pkill -f "ngrok http" 2>/dev/null
    echo "✅ All tunnels stopped"
    exit 0
}

trap cleanup INT TERM

# Show ngrok status
echo "📊 ngrok Web Interface: http://localhost:4040"
echo "🔄 Monitoring tunnels..."
echo "   Backend (3001): $BACKEND_URL"
echo "   Frontend (3000): $FRONTEND_URL"
echo ""

# Keep script running and monitor both processes
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 1
done

echo "❌ One or both ngrok processes stopped unexpectedly"
cleanup 