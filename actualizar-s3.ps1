# Script rápido para actualizar contenido en S3
# Usa este script después del primer despliegue

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default"
)

Write-Host "Actualizando wiki en S3..." -ForegroundColor Cyan
Write-Host ""

# Subir archivos HTML
Write-Host "Actualizando HTML..." -ForegroundColor Yellow
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.html" --content-type "text/html" --profile $Profile --delete

# Subir CSS
Write-Host "Actualizando CSS..." -ForegroundColor Yellow
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.css" --content-type "text/css" --profile $Profile --delete

# Subir JavaScript
Write-Host "Actualizando JavaScript..." -ForegroundColor Yellow
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.js" --content-type "application/javascript" --profile $Profile --delete

# Subir imágenes
Write-Host "Actualizando imágenes..." -ForegroundColor Yellow
aws s3 sync assets "s3://$BucketName/assets" --profile $Profile --delete

Write-Host ""
Write-Host "✓ Actualización completada!" -ForegroundColor Green
Write-Host ""
