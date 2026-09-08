@echo off
title Goodyear Daily Dashboard - Standard User Mode Server (IP 10.124.139.81)
color 0A
echo =========================================================================
echo   Goodyear Daily Dashboard - Standard User Mode Server
echo   Target IP: 10.124.139.81 | Port: 3001
echo =========================================================================
echo.

echo [1/2] Installing dependencies and building production bundle...
call npm install
call npm run build
echo Build completed!
echo.

echo [2/2] Starting Dashboard Express Server...
cd server
call npm install
node server.js
pause
