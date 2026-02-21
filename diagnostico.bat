@echo off
echo ============================================
echo Diagnostico del Proyecto
echo ============================================
echo.

echo Verificando instalacion de Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js NO esta instalado
    echo Por favor descarga e instala Node.js desde https://nodejs.org/
    echo.
) else (
    echo [OK] Node.js esta instalado
    node --version
)

echo.
echo Verificando instalacion de npm...
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm NO esta instalado
    echo npm deberia venir con Node.js. Reinstala Node.js.
    echo.
) else (
    echo [OK] npm esta instalado
    npm --version
)

echo.
echo Verificando estructura del proyecto...

if exist "backend" (
    echo [OK] Carpeta backend existe
) else (
    echo [ERROR] Carpeta backend NO existe
)

if exist "frontend" (
    echo [OK] Carpeta frontend existe
) else (
    echo [ERROR] Carpeta frontend NO existe
)

if exist "backend\package.json" (
    echo [OK] backend\package.json existe
) else (
    echo [ERROR] backend\package.json NO existe
)

if exist "frontend\package.json" (
    echo [OK] frontend\package.json existe
) else (
    echo [ERROR] frontend\package.json NO existe
)

if exist "backend\src\index.ts" (
    echo [OK] backend\src\index.ts existe
) else (
    echo [ERROR] backend\src\index.ts NO existe
)

if exist "frontend\src\main.tsx" (
    echo [OK] frontend\src\main.tsx existe
) else (
    echo [ERROR] frontend\src\main.tsx NO existe
)

echo.
echo Verificando dependencias instaladas...

if exist "backend\node_modules" (
    echo [OK] Dependencias del backend instaladas
) else (
    echo [ADVERTENCIA] Dependencias del backend NO instaladas
    echo Ejecuta: cd backend ^&^& npm install
)

if exist "frontend\node_modules" (
    echo [OK] Dependencias del frontend instaladas
) else (
    echo [ADVERTENCIA] Dependencias del frontend NO instaladas
    echo Ejecuta: cd frontend ^&^& npm install
)

echo.
echo Verificando puertos disponibles...
netstat -ano | findstr ":3000" >nul
if %ERRORLEVEL% EQU 0 (
    echo [ADVERTENCIA] Puerto 3000 esta en uso (Frontend)
    echo Cierra la aplicacion que esta usando el puerto 3000
) else (
    echo [OK] Puerto 3000 disponible
)

netstat -ano | findstr ":4000" >nul
if %ERRORLEVEL% EQU 0 (
    echo [ADVERTENCIA] Puerto 4000 esta en uso (Backend)
    echo Cierra la aplicacion que esta usando el puerto 4000
) else (
    echo [OK] Puerto 4000 disponible
)

echo.
echo Verificando directorios de trabajo...

if exist "backend\uploads" (
    echo [OK] backend\uploads existe
) else (
    echo [INFO] Creando backend\uploads...
    mkdir backend\uploads
)

if exist "backend\generated" (
    echo [OK] backend\generated existe
) else (
    echo [INFO] Creando backend\generated...
    mkdir backend\generated
)

if exist "test-data" (
    echo [OK] test-data existe
) else (
    echo [INFO] test-data existe
)

echo.
echo ============================================
echo Resumen del Diagnostico
echo ============================================
echo.
echo Si todos los items dicen [OK], puedes ejecutar:
echo   start-dev.bat
echo.
echo Si hay errores [ERROR]:
echo   1. Instala Node.js si no esta instalado
echo   2. Verifica que estes en la carpeta correcta del proyecto
echo.
echo Si hay advertencias [ADVERTENCIA]:
echo   1. Instala dependencias: cd backend ^&^& npm install
echo   2. Instala dependencias: cd frontend ^&^& npm install
echo   3. Cierra aplicaciones que usen los puertos 3000 o 4000
echo.
echo ============================================
echo.
pause
