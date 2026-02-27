@echo off
echo ==========================================
echo   AWS Lambda Deployment
echo   Function: assessment-center-api
echo ==========================================
echo.

echo IMPORTANTE: Asegurate de haber hecho merge a main antes de ejecutar esto
echo.
pause

echo [Paso 1] Cambiando a rama main...
git checkout main
if errorlevel 1 (
    echo ERROR: No se pudo cambiar a rama main
    pause
    exit /b 1
)

echo.
echo [Paso 2] Actualizando rama main...
git pull origin main
if errorlevel 1 (
    echo ERROR: No se pudo actualizar main
    pause
    exit /b 1
)

echo.
echo [Paso 3] Instalando dependencias del backend...
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: No se pudieron instalar dependencias
    pause
    exit /b 1
)

echo.
echo [Paso 4] Ejecutando deployment a Lambda...
cd ..
node aws/deploy-backend.js
if errorlevel 1 (
    echo ERROR: Fallo el deployment
    pause
    exit /b 1
)

echo.
echo ==========================================
echo   Deployment completado!
echo ==========================================
echo.
echo Proximos pasos:
echo 1. Probar el endpoint en produccion
echo 2. Revisar logs en CloudWatch
echo.
echo Para ver logs en tiempo real:
echo aws logs tail /aws/lambda/assessment-center-api --follow
echo.
pause
