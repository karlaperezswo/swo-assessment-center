@echo off
echo ========================================
echo  Prueba de Port Forwarding
echo ========================================
echo.
echo TU IP LOCAL:  192.168.4.69
echo TU IP PUBLICA: 152.230.226.196
echo.
echo ========================================
echo  PASO 1: Verificar que los servicios esten corriendo
echo ========================================
echo.

echo Probando Backend (puerto 4000)...
curl -s http://localhost:4000 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Backend respondiendo en http://localhost:4000
) else (
    echo [ERROR] Backend NO esta corriendo en puerto 4000
    echo        Ejecuta: start-portforward.bat
    pause
    exit /b 1
)

echo.
echo Probando Frontend (puerto 3000)...
curl -s http://localhost:3000 >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo [OK] Frontend respondiendo en http://localhost:3000
) else (
    echo [ADVERTENCIA] Frontend NO esta corriendo en puerto 3000
    echo              Ejecuta en otra terminal: cd frontend ^&^& npm run dev:portforward
)

echo.
echo ========================================
echo  PASO 2: Verificar puertos en VSCode
echo ========================================
echo.
echo Ve al panel PORTS en VSCode (Ctrl+J, luego pestaña PORTS)
echo Deberias ver algo como:
echo.
echo   Port    Running Process    Forwarded Address
echo   3000    vite              (vacio hasta que lo hagas publico)
echo   4000    node              (vacio hasta que lo hagas publico)
echo.
echo ========================================
echo  PASO 3: Hacer publicos los puertos
echo ========================================
echo.
echo 1. Click derecho en puerto 4000 -^> "Port Visibility" -^> "Public"
echo 2. Click derecho en puerto 3000 -^> "Port Visibility" -^> "Public"
echo.
echo Despues veras URLs como:
echo   https://random-4000.preview.app.github.dev
echo   https://random-3000.preview.app.github.dev
echo.
echo ========================================
echo  PASO 4: Probar las URLs publicas
echo ========================================
echo.
echo Cuando tengas las URLs publicas:
echo.
echo 1. Copia la URL del puerto 4000 (backend)
echo 2. Edita: frontend\.env.portforward
echo 3. Pon: VITE_API_URL=https://tu-url-4000.preview.app.github.dev
echo 4. Reinicia el frontend: Ctrl+C y luego: npm run dev:portforward
echo 5. Abre en navegador la URL del puerto 3000 (frontend)
echo.
echo ========================================
echo  ALTERNATIVA: Prueba rapida con ngrok
echo ========================================
echo.
echo Si VSCode Port Forwarding no funciona, puedes usar ngrok:
echo.
echo   1. Instala: choco install ngrok
echo   2. Registrate: https://ngrok.com
echo   3. Ejecuta: ngrok http 4000 (en terminal nueva)
echo   4. Ejecuta: ngrok http 3000 (en otra terminal)
echo.
echo ========================================
pause
