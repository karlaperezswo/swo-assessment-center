@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 INICIANDO Assessment Center
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js NO está instalado
    echo    Ejecuta: 1-INSTALAR-NODEJS.bat
    echo.
    pause
    exit /b 1
)

REM Verificar dependencias raíz
if not exist "node_modules" (
    echo ❌ Dependencias raíz no instaladas
    echo    Ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
    echo.
    pause
    exit /b 1
)

REM Verificar dependencias backend
if not exist "backend\node_modules" (
    echo ❌ Dependencias del backend no instaladas
    echo    Ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
    echo.
    pause
    exit /b 1
)

REM Verificar dependencias frontend
if not exist "frontend\node_modules" (
    echo ❌ Dependencias del frontend no instaladas
    echo    Ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Todo listo para iniciar
echo.
echo ========================================
echo 📡 SERVIDORES
echo ========================================
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo ⚠️  NO CIERRES ESTA VENTANA
echo    Presiona Ctrl+C para detener
echo.
echo ========================================
echo.

REM Esperar 3 segundos y abrir navegador
timeout /t 3 /nobreak >nul
start http://localhost:3000

REM Iniciar ambos servidores
call npm run dev
