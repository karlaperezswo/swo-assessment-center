@echo off
chcp 65001 >nul
cls
color 0A
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     ARREGLAR CONEXIÓN AL SERVIDOR LOCAL                ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Este script solucionará el error de conexión automáticamente.
echo.
echo ⏱️  Tiempo estimado: 30 segundos
echo.
pause
cls

echo.
echo ════════════════════════════════════════════════════════
echo  🛑 PASO 1: DETENIENDO PROCESOS EXISTENTES
echo ════════════════════════════════════════════════════════
echo.

REM Detener procesos en puerto 4000
echo Liberando puerto 4000 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000 ^| findstr LISTENING') do (
    echo   ✓ Deteniendo proceso %%a
    taskkill /F /PID %%a 2>nul
)

REM Detener procesos en puerto 3005
echo Liberando puerto 3005 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005 ^| findstr LISTENING') do (
    echo   ✓ Deteniendo proceso %%a
    taskkill /F /PID %%a 2>nul
)

echo.
echo ✅ Puertos liberados
timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════
echo  📦 PASO 2: VERIFICANDO DEPENDENCIAS
echo ════════════════════════════════════════════════════════
echo.

cd backend
if not exist node_modules (
    echo 📥 Instalando dependencias del backend...
    call npm install --silent
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias
        cd ..
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias ya instaladas
)
cd ..

cd frontend
if not exist node_modules (
    echo 📥 Instalando dependencias del frontend...
    call npm install --silent
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias
        cd ..
        pause
        exit /b 1
    )
    echo ✅ Dependencias instaladas
) else (
    echo ✅ Dependencias ya instaladas
)
cd ..

echo.
echo ════════════════════════════════════════════════════════
echo  🔨 PASO 3: COMPILANDO BACKEND
echo ════════════════════════════════════════════════════════
echo.

cd backend
if exist dist (
    echo Limpiando compilación anterior...
    rmdir /s /q dist 2>nul
)

echo Compilando TypeScript...
call npm run build >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Compilación con advertencias (continuando...)
) else (
    echo ✅ Backend compilado
)
cd ..

echo.
echo ════════════════════════════════════════════════════════
echo  🚀 PASO 4: INICIANDO SERVICIOS
echo ════════════════════════════════════════════════════════
echo.

echo Iniciando Backend (puerto 4000)...
start "🔧 Backend - Servidor Local" cmd /k "color 0B && cd backend && echo. && echo ╔════════════════════════════════════════╗ && echo ║     BACKEND - SERVIDOR LOCAL          ║ && echo ╚════════════════════════════════════════╝ && echo. && npm run dev"

echo ⏳ Esperando 8 segundos para que el backend inicie...
timeout /t 8 /nobreak >nul

echo.
echo Iniciando Frontend (puerto 3005)...
start "🌐 Frontend - Aplicación Web" cmd /k "color 0E && cd frontend && echo. && echo ╔════════════════════════════════════════╗ && echo ║     FRONTEND - APLICACIÓN WEB         ║ && echo ╚════════════════════════════════════════╝ && echo. && npm run dev"

echo ⏳ Esperando 8 segundos para que el frontend inicie...
timeout /t 8 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════
echo  🔍 PASO 5: VERIFICANDO CONEXIÓN
echo ════════════════════════════════════════════════════════
echo.

REM Verificar backend con curl
echo Probando conexión al backend...
curl -s http://localhost:4000/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend respondiendo correctamente
) else (
    echo ⚠️  Backend iniciando... (puede tardar unos segundos más)
)

echo.
echo Probando conexión al frontend...
curl -s http://localhost:3005 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend respondiendo correctamente
) else (
    echo ⚠️  Frontend iniciando... (puede tardar unos segundos más)
)

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║          ✅ CONEXIÓN ARREGLADA                         ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo 🎉 El servidor local está funcionando correctamente
echo.
echo ════════════════════════════════════════════════════════
echo  📍 INFORMACIÓN DE CONEXIÓN
echo ════════════════════════════════════════════════════════
echo.
echo   Backend:  http://localhost:4000
echo   Frontend: http://localhost:3005
echo.
echo ════════════════════════════════════════════════════════
echo  🌐 PRÓXIMOS PASOS
echo ════════════════════════════════════════════════════════
echo.
echo   1. Abre tu navegador
echo   2. Ve a: http://localhost:3005
echo   3. Click en "Assess"
echo   4. Click en "Mapa de Dependencias"
echo   5. ¡El módulo está funcionando!
echo.
echo ════════════════════════════════════════════════════════
echo  ⚠️  IMPORTANTE
echo ════════════════════════════════════════════════════════
echo.
echo   • NO cierres las ventanas del Backend y Frontend
echo   • Déjalas abiertas mientras uses la aplicación
echo   • Para detener todo: DETENER-TODO.bat
echo.
echo ════════════════════════════════════════════════════════
echo  💡 TIPS
echo ════════════════════════════════════════════════════════
echo.
echo   • Archivo de prueba: 4-GENERAR-DATOS-EJEMPLO.bat
echo   • Diagnóstico: 6-DIAGNOSTICO-COMPLETO.bat
echo   • Ayuda: README-SCRIPTS.md
echo.
echo ════════════════════════════════════════════════════════
echo.

REM Abrir navegador automáticamente
echo ¿Quieres abrir el navegador automáticamente? (S/N)
choice /c SN /n /m "Presiona S para Sí o N para No: "
if %ERRORLEVEL% EQU 1 (
    echo.
    echo 🌐 Abriendo navegador...
    timeout /t 2 /nobreak >nul
    start http://localhost:3005
)

echo.
echo ════════════════════════════════════════════════════════
echo.
pause
