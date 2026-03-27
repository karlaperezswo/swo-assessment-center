@echo off
chcp 65001 >nul
echo ========================================
echo 📥 INSTALANDO NODE.JS
echo ========================================
echo.

echo Verificando si Node.js ya está instalado...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Node.js ya está instalado
    node --version
    npm --version
    echo.
    echo Presiona cualquier tecla para continuar al siguiente paso...
    pause >nul
    start "" "2-INSTALAR-DEPENDENCIAS.bat"
    exit /b 0
)

echo Node.js NO está instalado. Instalando...
echo.

REM Intentar con winget (Windows 10/11)
echo [Método 1] Intentando instalar con winget...
winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Node.js instalado correctamente con winget
    echo.
    echo ⚠️  IMPORTANTE: Cierra y vuelve a abrir esta terminal
    echo    Luego ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
    echo.
    pause
    exit /b 0
)

REM Si winget falla, intentar con chocolatey
echo.
echo [Método 2] Intentando instalar con chocolatey...
where choco >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    choco install nodejs-lts -y
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ✅ Node.js instalado correctamente con chocolatey
        echo.
        echo ⚠️  IMPORTANTE: Cierra y vuelve a abrir esta terminal
        echo    Luego ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
        echo.
        pause
        exit /b 0
    )
)

REM Si todo falla, instrucciones manuales
echo.
echo ========================================
echo ⚠️  INSTALACIÓN MANUAL REQUERIDA
echo ========================================
echo.
echo No se pudo instalar automáticamente.
echo Por favor instala Node.js manualmente:
echo.
echo 1. Abre tu navegador
echo 2. Ve a: https://nodejs.org/
echo 3. Descarga la versión LTS (recomendada)
echo 4. Ejecuta el instalador
echo 5. Reinicia esta terminal
echo 6. Ejecuta: 2-INSTALAR-DEPENDENCIAS.bat
echo.
echo ¿Quieres abrir la página de descarga ahora? (S/N)
set /p respuesta=
if /i "%respuesta%"=="S" (
    start https://nodejs.org/
)
echo.
pause
