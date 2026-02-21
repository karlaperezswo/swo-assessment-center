@echo off
echo ============================================
echo Probando Frontend paso a paso
echo ============================================
echo.

cd frontend

echo [1/3] Verificando si package.json existe...
if not exist "package.json" (
    echo ERROR: package.json no existe en la carpeta frontend
    pause
    exit /b 1
)
echo OK - package.json encontrado
echo.

echo [2/3] Instalando dependencias (esto puede tardar 2-3 minutos)...
call npm install
if errorlevel 1 (
    echo.
    echo ERROR: Fallo al instalar dependencias
    echo Revisa el error de arriba
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.

echo [3/3] Iniciando servidor frontend...
echo.
echo El servidor deberia mostrar: "Local: http://localhost:3000/"
echo.
echo Si ves algun ERROR, copia el mensaje completo
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
pause
echo.

call npm run dev

pause
