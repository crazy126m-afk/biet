@echo off
title BIET - 24/7 Live Server
color 0A
cls

echo ======================================================================
echo                     BIET - 24/7 LIVE SERVER
echo ======================================================================
echo.
echo  * Database: SQLite (data/biet_campus.db) - 316 Verified Faculty
echo  * Real Gallery: 22 Campus Landmarks from bietdvg.edu
echo  * Standalone APK: BIET.apk (3.45 MB)
echo  * Status: ACTIVE and RUNNING 24/7 with Auto-Restart Protection
echo.

:: Detect Local IP Address
for /f "tokens=4" %%a in ('route print^|find " 0.0.0.0"') do set LOCAL_IP=%%a
echo  ----------------------------------------------------------------------
echo  Access Locally on PC:       http://localhost:8000
echo  Access on Mobile / Campus:  http://%LOCAL_IP%:8000
echo  Direct APK Download:        http://localhost:8000/BIET.apk
echo  ----------------------------------------------------------------------
echo.
echo Starting 24/7 watchdog loop... Press Ctrl+C to terminate.
echo.

:server_loop
echo [%date% %time%] Launching BIET Full-Stack Engine...
python server.py
echo.
echo [%date% %time%] [WARNING] Server process stopped! Auto-restarting in 2 seconds...
timeout /t 2 /nobreak >nul
goto server_loop
