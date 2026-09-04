@echo off
title Daily Dashboard Server (Port 3001)
echo Starting Daily Dashboard Server...
cd /d "%~dp0"
node server/server.js
pause
