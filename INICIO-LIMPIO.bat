@echo off
chcp 65001 >nul
echo ========================================
echo   INICIO LIMPIO DEL PROYECTO
echo ========================================
echo.

echo 📋 Este script hará lo siguiente:
echo   1. Detener todos los procesos existentes
echo   2. Limpiar archivos compilados
echo   3. Compilar el backend
echo   4. Iniciar backend y frontend
echo   5. Verificar la conexión
echo.
pause

echo.
echo ========================================
echo   PASO 1: DETENIENDO PROCESOS
echo ========================================
echo.

REM Detener procesos existentes
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do (
    echo Deteniendo proceso en puerto 4000...
    taskkill /F /PID %%a 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Deteniendo proceso en puerto 3005...
    taskkill /F /PID %%a 2>nul
)

timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   PASO 2: LIMPIANDO ARCHIVOS
echo ========================================
echo.

cd backend
if exist dist (
    echo Eliminando carpeta dist...
    rmdir /s /q dist
)
cd ..

echo.
echo ========================================
echo   PASO 3: COMPILANDO BACKEND
echo ========================================
echo.

cd backend
echo 🔨 Compilando TypeScript...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: No se pudo compilar el backend
    echo.
    echo Posibles causas:
    echo   - Errores de sintaxis en el código TypeScript
    echo   - Dependencias faltantes
    echo.
    echo Solución:
    echo   1. Revisa los errores mostrados arriba
    echo   2. Ejecuta: cd backend ^&^& npm install
    echo   3. Intenta nuevamente
    echo.
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ✅ Backend compilado exitosamente
echo.

echo ========================================
echo   PASO 4: INICIANDO SERVICIOS
echo ========================================
echo.

echo 🚀 Iniciando Backend (puerto 4000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo ⏳ Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Iniciando Frontend (puerto 3005)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ⏳ Esperando 5 segundos...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo   PASO 5: VERIFICANDO CONEXIÓN
echo ========================================
echo.

node test-backend-connection.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ ¡TODO LISTO!
    echo ========================================
    echo.
    echo 🎉 El proyecto está funcionando correctamente
    echo.
    echo 📍 URLs:
    echo    Backend:  http://localhost:4000
    echo    Frontend: http://localhost:3005
    echo.
    echo 🌐 Abre tu navegador en:
    echo    http://localhost:3005
    echo.
    echo 📝 Próximos pasos:
    echo    1. Ve al módulo "Mapa de Dependencias"
    echo    2. Click en "Seleccionar Archivo"
    echo    3. Elige un archivo Excel
    echo    4. Click en "Cargar"
    echo.
    echo ⚠️  IMPORTANTE: NO cierres las ventanas del Backend y Frontend
    echo.
) else (
    echo.
    echo ========================================
    echo   ⚠️  ADVERTENCIA
    echo ========================================
    echo.
    echo El backend puede estar iniciando todavía.
    echo.
    echo Espera 10 segundos más y luego:
    echo   1. Abre: http://localhost:3005
    echo   2. Si no funciona, ejecuta: 5-PROBAR-CONEXION.bat
    echo.
)

pause
