@echo off
chcp 65001 >nul
echo ========================================
echo   REINICIANDO BACKEND Y FRONTEND
echo ========================================
echo.

echo 🛑 Deteniendo procesos existentes...
echo.

REM Detener procesos de Node.js en puertos 4000 y 3005
echo Buscando procesos en puerto 4000 (Backend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do (
    echo Deteniendo proceso %%a en puerto 4000
    taskkill /F /PID %%a 2>nul
)

echo Buscando procesos en puerto 3005 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Deteniendo proceso %%a en puerto 3005
    taskkill /F /PID %%a 2>nul
)

echo.
echo ⏳ Esperando 3 segundos...
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   COMPILANDO BACKEND
echo ========================================
echo.

cd backend
echo 🔨 Compilando TypeScript...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error al compilar el backend
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   INICIANDO SERVICIOS
echo ========================================
echo.

echo 🚀 Iniciando Backend en puerto 4000...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo ⏳ Esperando 5 segundos para que el backend inicie...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Iniciando Frontend en puerto 3005...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ⏳ Esperando 5 segundos para que el frontend inicie...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   VERIFICANDO CONEXIÓN
echo ========================================
echo.

node test-backend-connection.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ REINICIO EXITOSO
    echo ========================================
    echo.
    echo 📍 Backend: http://localhost:4000
    echo 📍 Frontend: http://localhost:3005
    echo.
    echo 🌐 Abre tu navegador en: http://localhost:3005
    echo.
    echo ⚠️  NO CIERRES las ventanas del Backend y Frontend
    echo.
) else (
    echo.
    echo ========================================
    echo   ⚠️  ADVERTENCIA
    echo ========================================
    echo.
    echo El backend puede estar iniciando todavía.
    echo Espera 10 segundos más y prueba:
    echo   http://localhost:3005
    echo.
)

pause
