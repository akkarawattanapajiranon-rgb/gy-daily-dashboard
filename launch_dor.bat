@echo off
title DOR Dashboard Launcher
cd /d "c:\Users\aa11909\OneDrive - Goodyear\Documents\AI\DOR\daily-dashboard"

:: 1. Check if Backend API server (Port 3001) is active, start if not
netstat -ano | findstr :3001 | findstr LISTENING >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting DOR Backend Server...
    start /b cmd /c "node server/server.js"
    timeout /t 2 /nobreak >nul 2>&1
)

:: 2. Launch in clean Application Window mode (Edge / Chrome) on Port 3001
if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3001" --window-size=1600,1000
    exit
)
if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app="http://localhost:3001" --window-size=1600,1000
    exit
)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app="http://localhost:3001" --window-size=1600,1000
    exit
)

:: Fallback to default browser
start "" "http://localhost:3001"
exit
