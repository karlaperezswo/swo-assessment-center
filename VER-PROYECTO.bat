@echo off
chcp 65001 >nul
cls
echo.
echo ╔════════════════════════════════════════╗
echo ║   🚀 ASSESSMENT CENTER                 ║
echo ╚════════════════════════════════════════╝
echo.
echo ✅ Backend:  http://localhost:4000
echo ✅ Frontend: http://localhost:3005
echo.
echo 🌐 Abriendo navegador...
timeout /t 2 /nobreak >nul
start http://localhost:3005
echo.
echo ✅ ¡Proyecto iniciado!
echo.
echo Los servidores ya están corriendo en segundo plano.
echo Puedes cerrar esta ventana.
echo.
pause
