@echo off
echo Aplicando traducciones al documento Word...

cd src\services

REM Crear backup
copy docxService.ts docxService.ts.backup

REM Aplicar traducciones con PowerShell
powershell -Command ^
"$content = Get-Content -Raw docxService.ts; " ^
"$content = $content -replace '3\. COST BREAKDOWN FOR INITIAL AWS SERVICES','3. DESGLOSE DE COSTOS PARA SERVICIOS AWS INICIALES'; " ^
"$content = $content -replace '4\. ANNUAL RECURRING REVENUE','4. INGRESOS RECURRENTES ANUALES (ARR)'; " ^
"$content = $content -replace '5\. BUSINESS AND CONTRACTUAL REQUIREMENTS','5. REQUISITOS COMERCIALES Y CONTRACTUALES'; " ^
"$content = $content -replace '6\. CUSTOMER READINESS TO MIGRATE','6. PREPARACIÓN DEL CLIENTE PARA MIGRAR'; " ^
"$content = $content -replace '7\. SUPPORTING LINKS AND DOCUMENTS','7. ENLACES DE SOPORTE Y DOCUMENTOS'; " ^
"$content = $content -replace 'Current estimated on-premises annual cost','Costo estimado actual on-premises anual'; " ^
"$content = $content -replace 'On-Premises Cost Includes:','Los Costos On-Premises Incluyen:'; " ^
"$content = $content -replace 'On-Premises Cost Excludes:','Los Costos On-Premises Excluyen:'; " ^
"$content = $content -replace 'Hardware costs','Costos de hardware'; " ^
"$content = $content -replace 'Software licensing','Licencias de software'; " ^
"$content = $content -replace 'Maintenance and support','Mantenimiento y soporte'; " ^
"$content = $content -replace 'Data center facilities','Instalaciones de centros de datos'; " ^
"$content = $content -replace 'Power and cooling','Energía y refrigeración'; " ^
"$content = $content -replace 'Personnel costs','Costos de personal'; " ^
"$content = $content -replace 'Network infrastructure','Infraestructura de red'; " ^
"$content = $content -replace 'Security systems','Sistemas de seguridad'; " ^
"$content = $content -replace 'No description provided.','No se proporcionó descripción.'; " ^
"Set-Content -Path docxService.ts -Value $content"

echo Traducciones aplicadas!
echo.
echo Backup creado en: docxService.ts.backup
echo.
pause
