@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     INICIAR MÓDULO DE MAPA DE DEPENDENCIAS             ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Este script iniciará el módulo de dependencias que ya
echo estaba funcionando en tu local.
echo.
echo 📋 Pasos que se ejecutarán:
echo    1. Verificar dependencias instaladas
echo    2. Iniciar backend (puerto 4000)
echo    3. Iniciar frontend (puerto 3005)
echo    4. Verificar conexión
echo.
pause
echo.

echo ════════════════════════════════════════════════════════
echo  PASO 1: VERIFICANDO DEPENDENCIAS
echo ════════════════════════════════════════════════════════
echo.

cd backend
if not exist node_modules (
    echo ⚠️  Dependencias del backend no instaladas
    echo 📦 Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias del backend
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencias del backend ya instaladas
)
cd ..

cd frontend
if not exist node_modules (
    echo ⚠️  Dependencias del frontend no instaladas
    echo 📦 Instalando dependencias...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Error al instalar dependencias del frontend
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ Dependencias del frontend ya instaladas
)
cd ..

echo.
echo ════════════════════════════════════════════════════════
echo  PASO 2: INICIANDO BACKEND
echo ════════════════════════════════════════════════════════
echo.

echo 🚀 Iniciando backend en puerto 4000...
start "Backend - Mapa de Dependencias" cmd /k "cd backend && npm run dev"

echo ⏳ Esperando 8 segundos para que el backend inicie...
timeout /t 8 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════
echo  PASO 3: INICIANDO FRONTEND
echo ════════════════════════════════════════════════════════
echo.

echo 🚀 Iniciando frontend en puerto 3005...
start "Frontend - Aplicación" cmd /k "cd frontend && npm run dev"

echo ⏳ Esperando 8 segundos para que el frontend inicie...
timeout /t 8 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════
echo  PASO 4: VERIFICANDO CONEXIÓN
echo ════════════════════════════════════════════════════════
echo.

node diagnostico-completo.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║          ✅ MÓDULO INICIADO EXITOSAMENTE               ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo 🎉 El módulo de Mapa de Dependencias está funcionando
    echo.
    echo 📍 URLs:
    echo    Backend:  http://localhost:4000
    echo    Frontend: http://localhost:3005
    echo.
    echo 🌐 PRÓXIMOS PASOS:
    echo.
    echo    1. Abre tu navegador en: http://localhost:3005
    echo    2. Ve a la fase "Assess"
    echo    3. Click en "Mapa de Dependencias"
    echo    4. Click en "Seleccionar Archivo"
    echo    5. Elige un archivo Excel de dependencias
    echo    6. Click en "Cargar"
    echo    7. ¡Disfruta del módulo funcionando!
    echo.
    echo 📝 NOTA: NO cierres las ventanas del Backend y Frontend
    echo.
    echo 💡 TIP: Si necesitas un archivo de prueba, ejecuta:
    echo    4-GENERAR-DATOS-EJEMPLO.bat
    echo.
) else (
    echo.
    echo ╔════════════════════════════════════════════════════════╗
    echo ║          ⚠️  ADVERTENCIA                               ║
    echo ╚════════════════════════════════════════════════════════╝
    echo.
    echo Los servicios pueden estar iniciando todavía.
    echo.
    echo Espera 10 segundos más y luego:
    echo    1. Abre: http://localhost:3005
    echo    2. Ve a "Assess" → "Mapa de Dependencias"
    echo.
    echo Si no funciona, ejecuta:
    echo    6-DIAGNOSTICO-COMPLETO.bat
    echo.
)

pause
