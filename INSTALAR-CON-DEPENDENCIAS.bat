@echo off
echo ========================================
echo Instalacion Completa - MAP con Dependencias
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado
    echo Por favor ejecuta 1-INSTALAR-NODEJS.bat primero
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo ========================================
echo Instalando dependencias del Backend
echo ========================================
cd backend
call npm install
if errorlevel 1 (
    echo ERROR: Fallo la instalacion del backend
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Instalando dependencias del Frontend
echo ========================================
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Fallo la instalacion del frontend
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Generando datos de ejemplo
echo ========================================
node create-dependency-sample.js

echo.
echo ========================================
echo Instalacion Completada!
echo ========================================
echo.
echo Proximos pasos:
echo 1. Ejecuta 3-INICIAR-PROYECTO.bat para iniciar la aplicacion
echo 2. Abre http://localhost:5173 en tu navegador
echo 3. Ve a la fase Assess ^> Mapa de Dependencias
echo 4. Carga el archivo sample-dependencies.xlsx para probar
echo.
pause
