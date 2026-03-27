@echo off
chcp 65001 >nul
cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║                                                                ║
echo ║          🔐 CONFIGURACIÓN DE AWS S3                            ║
echo ║          Assessment Center - SoftwareOne                       ║
echo ║                                                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 📋 Este script te ayudará a configurar AWS S3 paso a paso
echo.
echo ⚠️  IMPORTANTE: Necesitas tener tus credenciales de AWS listas
echo    - Access Key ID
echo    - Secret Access Key
echo    - Nombre del bucket de S3
echo.

pause

cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PASO 1: Verificar archivo .env                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

cd backend

if exist .env (
    echo ✅ Archivo .env encontrado
    echo.
    echo ⚠️  Ya existe un archivo .env
    echo    ¿Deseas sobrescribirlo? (S/N^)
    set /p overwrite=
    
    if /i "%overwrite%"=="S" (
        echo.
        echo 📝 Creando nuevo archivo .env...
        copy .env.example .env >nul
        echo ✅ Archivo .env creado desde .env.example
    ) else (
        echo.
        echo ℹ️  Manteniendo archivo .env existente
    )
) else (
    echo ℹ️  Archivo .env no encontrado
    echo 📝 Creando archivo .env desde .env.example...
    copy .env.example .env >nul
    echo ✅ Archivo .env creado
)

echo.
pause

cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PASO 2: Configurar variables de AWS                          ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 📝 Ingresa tus credenciales de AWS:
echo.

set /p aws_region="🌍 AWS Region (ej: us-east-1): "
set /p bucket_name="📦 Nombre del Bucket S3: "
set /p access_key="🔑 AWS Access Key ID: "
set /p secret_key="🔐 AWS Secret Access Key: "

echo.
echo 💾 Guardando configuración en .env...

(
echo # Local Development
echo NODE_ENV=development
echo PORT=4000
echo.
echo # AWS Configuration
echo AWS_REGION=%aws_region%
echo S3_BUCKET_NAME=%bucket_name%
echo AWS_ACCESS_KEY_ID=%access_key%
echo AWS_SECRET_ACCESS_KEY=%secret_key%
) > .env

echo ✅ Configuración guardada
echo.

pause

cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PASO 3: Verificar configuración                              ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo 🔍 Verificando configuración de AWS S3...
echo.

node verificar-aws-config.js

echo.
pause

cls

echo ╔════════════════════════════════════════════════════════════════╗
echo ║  PASO 4: Instrucciones finales                                ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo ✅ Configuración completada
echo.
echo 📋 Próximos pasos:
echo.
echo    1. Reinicia el servidor backend:
echo       cd backend
echo       npm start
echo.
echo    2. Abre la aplicación en el navegador:
echo       http://localhost:3005
echo.
echo    3. Ve al módulo "Assess" → "Rapid Discovery"
echo.
echo    4. Prueba subir un archivo Excel
echo.
echo 📖 Para más información, lee: GUIA-CONFIGURACION-AWS-S3.md
echo.

pause

cd ..

echo.
echo ¿Deseas iniciar el servidor backend ahora? (S/N^)
set /p start_server=

if /i "%start_server%"=="S" (
    echo.
    echo 🚀 Iniciando servidor backend...
    cd backend
    start cmd /k "npm start"
    cd ..
    
    timeout /t 3 >nul
    
    echo.
    echo ¿Deseas iniciar el servidor frontend también? (S/N^)
    set /p start_frontend=
    
    if /i "%start_frontend%"=="S" (
        echo.
        echo 🚀 Iniciando servidor frontend...
        cd frontend
        start cmd /k "npm run dev"
        cd ..
    )
)

echo.
echo 🎉 ¡Configuración completada!
echo.
pause
