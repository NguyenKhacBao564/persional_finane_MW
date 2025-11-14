@echo off
echo Exporting database...

REM Set variables
set DB_NAME=pfm
set DB_USER=postgres
set EXPORT_FILE=database-backup.sql

REM Export database
pg_dump -U %DB_USER% -h localhost -p 5432 %DB_NAME% > %EXPORT_FILE%

echo Done! Database exported to %EXPORT_FILE%
pause
