@echo off
title GY Dashboard Daily Cloud Sync to Vercel
echo ====================================================
echo Running Daily Data Sync and Deploying to Vercel...
echo ====================================================
cd /d "%~dp0"
node server/daily_sync.js
echo.
echo Sync completed! Press any key to exit...
pause > nul
