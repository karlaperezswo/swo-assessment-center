@echo off
echo Instalando dependencias raiz...
call npm install
echo.
echo Instalando dependencias backend...
cd backend
call npm install
cd ..
echo.
echo Instalando dependencias frontend...
cd frontend
call npm install
cd ..
echo.
echo LISTO!
