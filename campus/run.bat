@echo off
title BIET Davangere - Smart Campus 360 Server
cls
echo ========================================================
echo   BIET Davangere - Smart Campus 360 Full-Stack Hub
echo   Target: Bapuji Institute of Engineering and Technology
echo ========================================================
echo.
echo Initializing database if not already created...
python setup_db.py
echo.
echo Starting Python Multi-threaded REST API Server at http://localhost:8000
python server.py
pause
