@echo off
echo ==========================================
echo   AWS Assessment Report Generator
echo   Starting Development Environment
echo ==========================================
echo.

echo [0/5] Stopping existing Node processes...
taskkill /F /IM node.exe >nul 2>&1
if errorlevel 1 (
    echo No existing Node processes found
) else (
    echo Existing Node processes stopped
)
timeout /t 2 /nobreak > nul
echo.

echo [1/5] Installing backend dependencies...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Installing frontend dependencies...
cd ..\frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Starting Backend Server...
cd ..\backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo [4/5] Starting Frontend Server...
cd ..\frontend
start "Frontend Server" cmd /k "npm run dev"

echo.
echo [5/5] Opening browser...
echo.
echo ==========================================
echo   Servers are starting...
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:3000
echo ==========================================
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak > nul
start http://localhost:3000

cd ..
