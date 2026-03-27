@echo off
echo.
echo ========================================
echo   REINICIANDO SERVIDOR BACKEND
echo ========================================
echo.

echo [1/3] Deteniendo procesos existentes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Limpiando cache de Node...
cd backend
if exist node_modules\.cache rmdir /s /q node_modules\.cache 2>nul

echo [3/3] Iniciando servidor backend...
echo.
echo ========================================
echo   SERVIDOR INICIANDO...
echo ========================================
echo.
echo Verifica que veas estos mensajes:
echo   - Using AWS credentials from profile: default
echo   - S3 Configuration
echo   - Server running on port 4000
echo.
echo Presiona Ctrl+C para detener el servidor
echo.

start cmd /k "cd /d %~dp0backend && npm start"

echo.
echo ========================================
echo   SERVIDOR INICIADO EN NUEVA VENTANA
echo ========================================
echo.
echo Ahora puedes:
echo   1. Abrir http://localhost:3005
echo   2. Ir a Assess - Rapid Discovery
echo   3. Subir tu archivo Excel MPA
echo.
pause
