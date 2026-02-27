@echo off
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         DEPLOYMENT AUTOMATICO DE LAMBDA                      ║
echo ║         assessment-center-api                                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.

REM Verificar que estamos en la raíz del proyecto
if not exist "backend\package.json" (
    echo ❌ ERROR: Debes ejecutar este script desde la raiz del proyecto
    pause
    exit /b 1
)

echo ┌──────────────────────────────────────────────────────────────┐
echo │ PASO 1: Verificando rama actual                              │
echo └──────────────────────────────────────────────────────────────┘
echo.

git branch --show-current
echo.

echo ⚠️  IMPORTANTE: Asegurate de haber completado el merge en GitHub
echo    y que la rama main tenga los ultimos cambios.
echo.
echo ¿Continuar con el deployment? (S/N)
choice /C SN /N /M "Presiona S para continuar o N para cancelar: "
if errorlevel 2 (
    echo.
    echo ❌ Deployment cancelado por el usuario
    pause
    exit /b 0
)

echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │ PASO 2: Cambiando a rama main                                │
echo └──────────────────────────────────────────────────────────────┘
echo.

git checkout main
if errorlevel 1 (
    echo ❌ ERROR: No se pudo cambiar a rama main
    pause
    exit /b 1
)
echo ✅ Cambiado a rama main
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ PASO 3: Actualizando rama main desde GitHub                  │
echo └──────────────────────────────────────────────────────────────┘
echo.

git pull origin main
if errorlevel 1 (
    echo ❌ ERROR: No se pudo actualizar main
    pause
    exit /b 1
)
echo ✅ Rama main actualizada
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ PASO 4: Instalando dependencias del backend                  │
echo └──────────────────────────────────────────────────────────────┘
echo.

cd backend
call npm install
if errorlevel 1 (
    echo ❌ ERROR: No se pudieron instalar dependencias
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependencias instaladas
cd ..
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ PASO 5: Ejecutando deployment a Lambda                       │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo Este proceso incluye:
echo   - Build de TypeScript
echo   - Creacion de ZIP
echo   - Upload a S3 (con versioning automatico)
echo   - Actualizacion de Lambda
echo.

node aws/deploy-backend.js
if errorlevel 1 (
    echo.
    echo ❌ ERROR: Fallo el deployment
    echo.
    echo Posibles causas:
    echo   - Error en el build de TypeScript
    echo   - Problemas de conexion con AWS
    echo   - Credenciales AWS no configuradas
    echo.
    pause
    exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║              ✅ DEPLOYMENT COMPLETADO!                       ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │ PROXIMOS PASOS - VERIFICACION                                │
echo └──────────────────────────────────────────────────────────────┘
echo.
echo 1. Verificar health check:
echo    curl https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/health
echo.
echo 2. Ver logs en tiempo real:
echo    aws logs tail /aws/lambda/assessment-center-api --follow --region us-east-1
echo.
echo 3. Probar PDF en produccion:
echo    https://main.d2yfhqkm0yjhqo.amplifyapp.com
echo.
echo 4. Ver versiones guardadas en S3:
echo    .\ver-versiones-lambda.bat
echo.
echo.
echo ¿Quieres ver los logs en tiempo real ahora? (S/N)
choice /C SN /N /M "Presiona S para ver logs o N para salir: "
if errorlevel 2 (
    echo.
    echo 👋 Deployment completado. Puedes cerrar esta ventana.
    pause
    exit /b 0
)

echo.
echo ┌──────────────────────────────────────────────────────────────┐
echo │ Iniciando logs en tiempo real...                             │
echo │ Presiona Ctrl+C para detener                                 │
echo └──────────────────────────────────────────────────────────────┘
echo.

aws logs tail /aws/lambda/assessment-center-api --follow --region us-east-1
