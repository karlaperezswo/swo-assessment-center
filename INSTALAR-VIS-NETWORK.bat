@echo off
echo ========================================
echo Instalando vis-network localmente
echo ========================================
echo.

cd frontend
echo Instalando vis-network...
call npm install vis-network@9.1.9
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo vis-network instalado correctamente!
    echo ========================================
    echo.
    echo El error del source map ha sido solucionado.
    echo Ahora vis-network se carga localmente.
    echo.
) else (
    echo.
    echo ========================================
    echo ERROR: No se pudo instalar vis-network
    echo ========================================
    echo.
)

pause
