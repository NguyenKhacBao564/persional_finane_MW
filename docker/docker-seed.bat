@echo off
echo 🌱 Seeding database with sample data...
echo.

REM Run seed inside backend container
docker-compose exec backend npm run db:seed

echo.
echo ✅ Seed completed!
echo.
echo Demo credentials:
echo   Email: demo@example.com
echo   Password: password123
echo.

pause
