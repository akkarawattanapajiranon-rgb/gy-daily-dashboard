@echo off
title Goodyear Daily Dashboard - Master Server Quick Update
color 0B
echo =========================================================================
echo   Goodyear Daily Dashboard - Quick Update Script
echo =========================================================================
echo.

echo Pulling latest updates from GitHub master...
git pull origin master
echo.

echo Building fresh production bundle...
call npm run build
echo.

echo Restarting server daemon...
cd server
call pm2 restart gy-dashboard-backend
cd ..
echo.

echo =========================================================================
echo   UPDATE COMPLETED SUCCESSFULLY!
echo   Live URL: http://10.124.139.81:3001
echo =========================================================================
pause
