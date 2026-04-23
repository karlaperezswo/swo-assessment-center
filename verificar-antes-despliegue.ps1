# Script para verificar que todo está listo antes del despliegue

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Verificación Pre-Despliegue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Verificar AWS CLI
Write-Host "1. Verificando AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✓ AWS CLI instalado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ AWS CLI NO instalado" -ForegroundColor Red
    Write-Host "     Descarga desde: https://awscli.amazonaws.com/AWSCLIV2.msi" -ForegroundColor Yellow
    $allGood = $false
}

# 2. Verificar credenciales
Write-Host ""
Write-Host "2. Verificando credenciales AWS..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1 | ConvertFrom-Json
    Write-Host "   ✓ Credenciales configuradas" -ForegroundColor Green
    Write-Host "     Usuario: $($identity.Arn)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Credenciales NO configuradas" -ForegroundColor Red
    Write-Host "     Ejecuta: aws configure" -ForegroundColor Yellow
    $allGood = $false
}

# 3. Verificar archivos principales
Write-Host ""
Write-Host "3. Verificando archivos del proyecto..." -ForegroundColor Yellow

$requiredFiles = @(
    "index.html",
    "styles.css",
    "scripts.js",
    "pages/map-assessment.html",
    "assets/imagenes/LogoAWS.png",
    "assets/imagenes/LogoSoftwareone.png"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file NO encontrado" -ForegroundColor Red
        $allGood = $false
    }
}

# 4. Contar archivos HTML
Write-Host ""
Write-Host "4. Contando archivos..." -ForegroundColor Yellow
$htmlFiles = (Get-ChildItem -Path . -Filter "*.html" -Recurse -File).Count
$cssFiles = (Get-ChildItem -Path . -Filter "*.css" -Recurse -File).Count
$jsFiles = (Get-ChildItem -Path . -Filter "*.js" -Recurse -File).Count
$imageFiles = (Get-ChildItem -Path "assets/imagenes" -Filter "*.png" -File -ErrorAction SilentlyContinue).Count

Write-Host "   HTML: $htmlFiles archivos" -ForegroundColor Cyan
Write-Host "   CSS: $cssFiles archivos" -ForegroundColor Cyan
Write-Host "   JavaScript: $jsFiles archivos" -ForegroundColor Cyan
Write-Host "   Imágenes: $imageFiles archivos" -ForegroundColor Cyan

# 5. Verificar tamaño total
Write-Host ""
Write-Host "5. Calculando tamaño del proyecto..." -ForegroundColor Yellow
$totalSize = (Get-ChildItem -Path . -Recurse -File | Where-Object { 
    $_.FullName -notmatch "\.git" -and 
    $_.FullName -notmatch "node_modules" -and
    $_.FullName -notmatch "confluence-export"
} | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Host "   Tamaño total: $sizeMB MB" -ForegroundColor Cyan

if ($sizeMB -gt 100) {
    Write-Host "   ⚠ Advertencia: El proyecto es grande (>100MB)" -ForegroundColor Yellow
}

# Resumen
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "  ✓ TODO LISTO PARA DESPLEGAR" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor Yellow
    Write-Host ".\deploy-to-s3.ps1 -BucketName `"tu-nombre-de-bucket`"" -ForegroundColor White
    Write-Host ""
    Write-Host "Ejemplo:" -ForegroundColor Gray
    Write-Host ".\deploy-to-s3.ps1 -BucketName `"wiki-map-assessment-2026`"" -ForegroundColor Gray
} else {
    Write-Host "  ✗ HAY PROBLEMAS QUE RESOLVER" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Por favor, resuelve los errores marcados arriba." -ForegroundColor Yellow
}
Write-Host ""
