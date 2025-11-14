@echo off
echo 🛑 Stopping Docker containers...
echo.

docker-compose down

echo.
echo ✅ Containers stopped!
echo.

pause
