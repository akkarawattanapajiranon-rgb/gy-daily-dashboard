@echo off
title Goodyear Daily Dashboard - Portable Node Server (No Admin Required)
color 0A
echo =========================================================================
echo   Goodyear Daily Dashboard - Portable Server Mode
echo   No Administrator Rights Required!
echo =========================================================================
echo.

set PORTABLE_NODE=node-v20.18.0-win-x64\node.exe

if not exist "%PORTABLE_NODE%" (
  echo Searching for Node.js in system path or local folder...
  where node >nul 2>nul
  if %errorlevel% equ 0 (
    set PORTABLE_NODE=node
  ) else (
    echo.
    echo [!] Node.js not found in system or local folder.
    echo Please extract node-v20.18.0-win-x64.zip into this directory.
    echo.
    pause
    exit /b
  )
)

echo Starting Dashboard Server with Portable Node.js...
cd server
"%~dp0%PORTABLE_NODE%" server.js
pause
