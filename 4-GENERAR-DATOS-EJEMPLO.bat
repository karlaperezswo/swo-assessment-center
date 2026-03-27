@echo off
echo ========================================
echo Generando Datos de Ejemplo
echo ========================================
echo.

echo Generando archivo de dependencias de ejemplo...
node create-dependency-sample.js

echo.
echo ========================================
echo Proceso Completado
echo ========================================
echo.
echo El archivo 'sample-dependencies.xlsx' ha sido creado.
echo Puedes usarlo para probar el Mapa de Dependencias.
echo.
pause
