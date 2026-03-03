@echo off
echo ==========================================
echo   LIMPIEZA Y REINICIO COMPLETO
echo ==========================================
echo.

echo [1/5] Deteniendo procesos Node.js...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak > nul

echo.
echo [2/5] Limpiando cache del backend...
cd backend
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo Backend cache limpiado

echo.
echo [3/5] Recompilando backend...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build backend
    pause
    exit /b 1
)
echo Backend compilado exitosamente

echo.
echo [4/5] Limpiando cache del frontend...
cd ..\frontend
if exist dist rmdir /s /q dist
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite rmdir /s /q .vite
echo Frontend cache limpiado

cd ..

echo.
echo [5/5] Iniciando servidores...
call start-dev.bat

echo.
echo ==========================================
echo   REINICIO COMPLETO
echo ==========================================
echo.
