@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     DIAGNÓSTICO COMPLETO DEL SISTEMA                   ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Este script verificará:
echo   • Backend (puerto 4000)
echo   • Frontend (puerto 3005)
echo   • Endpoints de API
echo   • Archivos del proyecto
echo   • Compilación del backend
echo   • Puertos en uso
echo.
pause
echo.

node diagnostico-completo.js

echo.
echo ════════════════════════════════════════════════════════
echo.
pause
