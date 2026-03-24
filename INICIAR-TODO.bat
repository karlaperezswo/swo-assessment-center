@echo off
title Iniciando SWO Assessment Center
echo.
echo ============================================
echo   SWO Assessment Center - Inicio Completo
echo ============================================
echo.

REM Verificar que node existe
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js no esta instalado.
    echo Instala Node.js desde https://nodejs.org
    pause
    exit /b 1
)

echo [1/2] Iniciando Backend en puerto 4000...
start "Backend - Puerto 4000" cmd /k "cd /d %~dp0 && echo Backend iniciando... && npm run dev:backend"

echo Esperando 4 segundos para que el backend arranque...
timeout /t 4 /nobreak >nul

echo [2/2] Iniciando Frontend en puerto 3005...
start "Frontend - Puerto 3005" cmd /k "cd /d %~dp0 && echo Frontend iniciando... && npm run dev:frontend"

echo.
echo ============================================
echo  Servidores iniciados en ventanas separadas
echo  Backend:  http://localhost:4000/health
echo  Frontend: http://localhost:3005
echo ============================================
echo.
echo Abriendo navegador en 6 segundos...
timeout /t 6 /nobreak >nul
start "" "http://localhost:3005"
