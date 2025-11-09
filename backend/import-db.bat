@echo off
echo Importing database...

REM Set variables
set DB_NAME=pfm
set DB_USER=postgres
set IMPORT_FILE=database-backup.sql

REM Create database if not exists
psql -U %DB_USER% -h localhost -p 5432 -c "CREATE DATABASE %DB_NAME%;" 2>nul

REM Import database
psql -U %DB_USER% -h localhost -p 5432 %DB_NAME% < %IMPORT_FILE%

echo Done! Database imported from %IMPORT_FILE%
pause
