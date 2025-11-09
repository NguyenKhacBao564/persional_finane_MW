@echo off
echo 🐳 Starting Personal Finance Manager with Docker...
echo.

REM Check if .env exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from .env.docker...
    copy .env.docker .env
    echo ✓ Created .env file
    echo.
    echo ⚠️  IMPORTANT: Edit .env file and set your credentials!
    echo.
    pause
)

REM Stop and remove old containers
echo 🛑 Stopping old containers...
docker-compose down
echo.

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d
echo.

REM Wait for database to be ready
echo ⏳ Waiting for database to be ready...
timeout /t 5 /nobreak >nul
echo.

REM Show logs
echo 📋 Container status:
docker-compose ps
echo.

echo ✅ Services started!
echo.
echo 📍 Access the application:
echo    - Frontend: http://localhost:5173
echo    - Backend:  http://localhost:4000
echo    - Database: localhost:5432
echo.
echo 📊 View logs:
echo    docker-compose logs -f
echo.
echo 🛑 Stop services:
echo    docker-compose down
echo.

pause
