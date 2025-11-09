@echo off
echo 📋 Showing Docker logs (Ctrl+C to exit)...
echo.

docker-compose logs -f --tail=100
