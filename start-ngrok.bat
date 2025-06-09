@echo off
setlocal enabledelayedexpansion

REM Music Selector - ngrok Setup Script for Windows
echo 🌐 Starting ngrok tunnels for both frontend and backend...

REM Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ ngrok is not installed. Please install it from https://ngrok.com/
    pause
    exit /b 1
)

REM Kill any existing ngrok processes
taskkill /f /im ngrok.exe >nul 2>nul
timeout /t 2 /nobreak >nul

REM Start ngrok for backend (port 3001)
echo 🚀 Starting ngrok tunnel for backend (port 3001)...
start /b ngrok http 3001 --log=stdout > ngrok-backend.log 2>&1

REM Start ngrok for frontend (port 3000)
echo 🚀 Starting ngrok tunnel for frontend (port 3000)...
start /b ngrok http 3000 --log=stdout > ngrok-frontend.log 2>&1

REM Wait for both tunnels to initialize
echo ⏳ Waiting for tunnels to initialize...
timeout /t 5 /nobreak >nul

REM Get the ngrok URLs from both API endpoints
curl -s http://localhost:4040/api/tunnels > tunnels_4040.json 2>nul
curl -s http://localhost:4041/api/tunnels > tunnels_4041.json 2>nul

REM Check if tunnel data exists
if not exist tunnels_4040.json if not exist tunnels_4041.json (
    echo ❌ Failed to connect to ngrok API. Make sure ngrok is running.
    taskkill /f /im ngrok.exe >nul 2>nul
    pause
    exit /b 1
)

REM Extract URLs from JSON files using findstr (basic Windows approach)
set FRONTEND_URL=
set BACKEND_URL=

REM Parse tunnels_4040.json for URLs
if exist tunnels_4040.json (
    for /f "tokens=2 delims=:" %%i in ('findstr "public_url.*https" tunnels_4040.json') do (
        set "URL_4040=%%i"
        set "URL_4040=!URL_4040:"=!"
        set "URL_4040=!URL_4040: =!"
        set "URL_4040=!URL_4040:,=!"
        
        REM Check if this is port 3000 or 3001
        findstr ":3000" tunnels_4040.json >nul && set "FRONTEND_URL=!URL_4040!"
        findstr ":3001" tunnels_4040.json >nul && set "BACKEND_URL=!URL_4040!"
    )
)

REM Parse tunnels_4041.json for URLs
if exist tunnels_4041.json (
    for /f "tokens=2 delims=:" %%i in ('findstr "public_url.*https" tunnels_4041.json') do (
        set "URL_4041=%%i"
        set "URL_4041=!URL_4041:"=!"
        set "URL_4041=!URL_4041: =!"
        set "URL_4041=!URL_4041:,=!"
        
        REM Check if this is port 3000 or 3001
        findstr ":3000" tunnels_4041.json >nul && set "FRONTEND_URL=!URL_4041!"
        findstr ":3001" tunnels_4041.json >nul && set "BACKEND_URL=!URL_4041!"
    )
)

REM Clean up temporary files
del tunnels_4040.json >nul 2>nul
del tunnels_4041.json >nul 2>nul

REM Validate URLs
if "!BACKEND_URL!"=="" if "!FRONTEND_URL!"=="" (
    echo ❌ Failed to get ngrok URLs. Debug info:
    echo Backend URL: !BACKEND_URL!
    echo Frontend URL: !FRONTEND_URL!
    taskkill /f /im ngrok.exe >nul 2>nul
    pause
    exit /b 1
)

echo.
echo ✅ Both ngrok tunnels established!
echo 🌐 Frontend URL: !FRONTEND_URL!
echo 🔗 Backend URL: !BACKEND_URL!
echo 🔗 OAuth Callback: !BACKEND_URL!/api/auth/callback
echo.

REM Update .env file with both ngrok URLs
if exist .env (
    REM Create clean .env without NGROK entries
    findstr /v "NGROK" .env > .env.clean
    move .env.clean .env >nul
    
    REM Add new NGROK URLs
    echo NGROK_URL=!BACKEND_URL! >> .env
    echo NGROK_CLIENT_URL=!FRONTEND_URL! >> .env
    
    echo ✅ Updated .env file with both ngrok URLs
) else (
    echo ⚠️  .env file not found. Please create it first.
)

REM Update client .env file with new backend URL
if exist client\ (
    REM Create or update client/.env file
    echo REACT_APP_NGROK_BACKEND_URL=!BACKEND_URL! > client\.env
    echo REACT_APP_NGROK_FRONTEND_URL=!FRONTEND_URL! >> client\.env
    
    echo ✅ Updated client/.env with ngrok URLs:
    echo    REACT_APP_NGROK_BACKEND_URL=!BACKEND_URL!
    echo    REACT_APP_NGROK_FRONTEND_URL=!FRONTEND_URL!
) else (
    echo ⚠️  client directory not found.
)

REM Update server.ts allowedOrigins with new ngrok URLs
if exist src\server.ts (
    REM Create backup
    copy src\server.ts src\server.ts.backup >nul
    
    REM Note: Advanced string replacement in batch is complex
    REM For now, just inform user to manually update if needed
    echo ✅ server.ts backup created (manual update may be needed)
    echo    Frontend: !FRONTEND_URL!
    echo    Backend: !BACKEND_URL!
) else (
    echo ⚠️  src/server.ts file not found.
)

echo.
echo 📋 NEXT STEPS:
echo 1. Go to https://developer.spotify.com/dashboard
echo 2. Edit your Spotify app settings
echo 3. Add this redirect URI: !BACKEND_URL!/api/auth/callback
echo 4. In a new terminal, run: npm run dev
echo 5. Access your app from anywhere at: !FRONTEND_URL!
echo 6. 📱 Perfect for mobile access!
echo.
echo 💡 Keep this terminal open to maintain both ngrok tunnels
echo ⏹️  Press Ctrl+C to stop both tunnels when done
echo.

REM Show ngrok status
echo 📊 ngrok Web Interface: http://localhost:4040
echo 🔄 Monitoring tunnels...
echo    Backend (3001): !BACKEND_URL!
echo    Frontend (3000): !FRONTEND_URL!
echo.

REM Wait for user to press Ctrl+C
echo Press Ctrl+C to stop tunnels...
:loop
timeout /t 1 /nobreak >nul
goto loop 