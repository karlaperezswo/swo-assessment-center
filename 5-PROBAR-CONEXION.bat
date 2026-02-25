@echo off
chcp 65001 >nul
echo ========================================
echo   PRUEBA DE CONEXIÓN BACKEND
echo ========================================
echo.

echo 🔍 Verificando conexión con el servidor...
echo.

node test-backend-connection.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ CONEXIÓN EXITOSA
    echo ========================================
    echo.
    echo El backend está funcionando correctamente.
    echo Ahora puedes usar el módulo de dependencias.
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ ERROR DE CONEXIÓN
    echo ========================================
    echo.
    echo El backend NO está funcionando.
    echo Por favor, ejecuta primero: 3-INICIAR-PROYECTO.bat
    echo.
)

pause
