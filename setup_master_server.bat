@echo off
title Goodyear Daily Dashboard - Master Server Setup (IP 10.124.139.81)
color 0A
echo =========================================================================
echo   Goodyear Daily Dashboard - Automated Master Server Setup
echo   Target IP: 10.124.139.81 | Port: 3001
echo =========================================================================
echo.

echo [1/4] Configuring Windows Firewall Port 3001...
powershell -Command "New-NetFirewallRule -DisplayName 'GY Dashboard Server' -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue"
echo Firewall rule applied!
echo.

echo [2/4] Installing dependencies and building production bundle...
call npm install
call npm run build
echo Build completed!
echo.

echo [3/4] Setting up Server Service (PM2)...
cd server
call npm install
call npm install -g pm2 pm2-windows-startup
call pm2-startup install
call pm2 start server.js --name "gy-dashboard-backend"
call pm2 save
cd ..
echo Background service started!
echo.

echo =========================================================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo   Dashboard is live on LAN at: http://10.124.139.81:3001
echo =========================================================================
pause
