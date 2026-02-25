@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 ASSESSMENT CENTER - INICIO        ║
echo ╚════════════════════════════════════════╝
echo.

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js NO detectado
    echo.
    echo Iniciando instalación automática...
    echo.
    timeout /t 2 /nobreak >nul
    call "1-INSTALAR-NODEJS.bat"
    exit /b 0
)

echo ✅ Node.js detectado: 
node --version
echo.

REM Verificar dependencias
if not exist "node_modules" (
    echo ❌ Dependencias NO instaladas
    echo.
    echo Iniciando instalación...
    echo.
    timeout /t 2 /nobreak >nul
    call "2-INSTALAR-DEPENDENCIAS.bat"
    exit /b 0
)

if not exist "backend\node_modules" (
    echo ❌ Dependencias del backend NO instaladas
    echo.
    echo Iniciando instalación...
    echo.
    timeout /t 2 /nobreak >nul
    call "2-INSTALAR-DEPENDENCIAS.bat"
    exit /b 0
)

if not exist "frontend\node_modules" (
    echo ❌ Dependencias del frontend NO instaladas
    echo.
    echo Iniciando instalación...
    echo.
    timeout /t 2 /nobreak >nul
    call "2-INSTALAR-DEPENDENCIAS.bat"
    exit /b 0
)

echo ✅ Dependencias instaladas
echo.
echo Iniciando proyecto...
echo.
timeout /t 2 /nobreak >nul
call "3-INICIAR-PROYECTO.bat"
