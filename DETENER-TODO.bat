@echo off
chcp 65001 >nul
echo ========================================
echo   DETENIENDO TODOS LOS SERVICIOS
echo ========================================
echo.

echo 🛑 Buscando y deteniendo procesos...
echo.

REM Detener procesos en puerto 4000 (Backend)
echo Buscando procesos en puerto 4000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do (
    echo   ✓ Deteniendo proceso %%a
    taskkill /F /PID %%a 2>nul
)

REM Detener procesos en puerto 3005 (Frontend)
echo Buscando procesos en puerto 3005 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo   ✓ Deteniendo proceso %%a
    taskkill /F /PID %%a 2>nul
)

REM Detener todos los procesos de node relacionados con el proyecto
echo.
echo Deteniendo procesos de Node.js relacionados...
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Backend*" 2>nul
taskkill /F /IM node.exe /FI "WINDOWTITLE eq Frontend*" 2>nul

echo.
echo ========================================
echo   ✅ PROCESOS DETENIDOS
echo ========================================
echo.
echo Todos los servicios han sido detenidos.
echo Puedes iniciar nuevamente con: REINICIAR-TODO.bat
echo.

pause
