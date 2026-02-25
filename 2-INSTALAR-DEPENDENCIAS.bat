@echo off
chcp 65001 >nul
echo ========================================
echo 📦 INSTALANDO DEPENDENCIAS
echo ========================================
echo.

REM Verificar Node.js
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js NO está instalado
    echo    Ejecuta primero: 1-INSTALAR-NODEJS.bat
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js detectado
node --version
npm --version
echo.

echo ========================================
echo 📦 Instalando dependencias...
echo ========================================
echo.

echo [1/3] Instalando dependencias raíz...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error instalando dependencias raíz
    echo    Intenta ejecutar manualmente: npm install
    echo.
    pause
    exit /b 1
)
echo ✅ Dependencias raíz instaladas
echo.

echo [2/3] Instalando dependencias del backend...
cd backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error instalando dependencias del backend
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Dependencias del backend instaladas
echo.

echo [3/3] Instalando dependencias del frontend...
cd frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Error instalando dependencias del frontend
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Dependencias del frontend instaladas
echo.

echo ========================================
echo ✅ ¡INSTALACIÓN COMPLETA!
echo ========================================
echo.
echo 🎯 Ahora inicia el proyecto:
echo    Ejecuta: 3-INICIAR-PROYECTO.bat
echo.
pause
start "" "3-INICIAR-PROYECTO.bat"
