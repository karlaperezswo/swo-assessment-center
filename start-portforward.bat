@echo off
echo ========================================
echo  AWS Assessment - Port Forwarding Mode
echo ========================================
echo.
echo INSTRUCCIONES:
echo.
echo 1. Este script iniciara el BACKEND en modo local
echo 2. En VSCode, ve al panel PORTS (Ctrl+J, luego selecciona PORTS)
echo 3. Haz click derecho en puerto 4000 -^> "Port Visibility" -^> "Public"
echo 4. Copia la URL publica generada (ejemplo: https://xyz-4000.preview.app.github.dev)
echo 5. Edita el archivo: frontend\.env.portforward
echo 6. Reemplaza VITE_API_URL con tu URL del backend (puerto 4000)
echo 7. Abre una NUEVA terminal y ejecuta: cd frontend ^&^& npm run dev:portforward
echo 8. En VSCode, haz click derecho en puerto 3000 -^> "Port Visibility" -^> "Public"
echo 9. Comparte la URL del puerto 3000 (frontend)
echo.
echo ========================================
echo.
pause

echo Verificando instalacion de Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js no esta instalado!
    echo Por favor instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado:
node -v
echo.

echo Iniciando BACKEND...
cd backend

if not exist node_modules (
    echo Instalando dependencias del backend...
    call npm install
)

echo.
echo ========================================
echo Backend iniciado!
echo RECUERDA: Sigue las instrucciones de arriba
echo ========================================
echo.

call npm run dev
