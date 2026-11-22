@echo off
title Stop BIET Server
color 0C
cls

echo ======================================================================
echo                     STOPPING BIET SERVER
echo ======================================================================
echo.

echo Searching for processes running on port 8000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    echo Terminating PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo Server on port 8000 stopped successfully.
pause
