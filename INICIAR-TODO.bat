@echo off
echo ============================================
echo   Iniciando Backend y Frontend
echo ============================================
echo.

echo [1/2] Iniciando Backend en puerto 4000...
start "Backend - Puerto 4000" cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 3 /nobreak > nul

echo [2/2] Iniciando Frontend en puerto 3005...
start "Frontend - Puerto 3005" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo   Servidores iniciados!
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:3005
echo ============================================
echo.
pause
