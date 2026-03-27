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
    echo    Ejecuta primero: SETUP-COMPLETO.bat
    pause
    exit /b 1
)

REM Verificar dependencias
if not exist "node_modules" (
    echo ❌ Dependencias no instaladas
    echo    Ejecuta primero: SETUP-COMPLETO.bat
    pause
    exit /b 1
)

echo ✅ Todo listo para iniciar
echo.
echo 📡 Backend: http://localhost:4000
echo 🌐 Frontend: http://localhost:3000
echo.
echo ⚠️  NO CIERRES ESTA VENTANA
echo    Presiona Ctrl+C para detener los servidores
echo.
echo ========================================
echo.

REM Iniciar ambos servidores
npm run dev
