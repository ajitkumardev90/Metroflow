@echo off
title MetroFlow - Starting Services
echo ===================================================
echo       Launching MetroFlow Full-Stack Services      
echo ===================================================
echo.

:: 1. Clean up old or stuck processes on ports 8000 and 3000
echo [1/3] Checking and cleaning ports 8000 and 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1

:: 2. Launch Backend in a new terminal window
echo [2/3] Starting Backend Server (Port 8000)...
start "MetroFlow Backend (FastAPI)" cmd /k "cd /d %~dp0backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"

:: 3. Launch Frontend in a new terminal window
echo [3/3] Starting Frontend Server (Port 3000)...
start "MetroFlow Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run start"

echo.
echo ===================================================
echo Both services are launching in separate windows!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:8000/docs
echo ===================================================
timeout /t 5
