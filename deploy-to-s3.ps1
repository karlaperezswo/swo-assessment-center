# Script para desplegar la Wiki MAP Assessment a S3
# Asegúrate de tener AWS CLI instalado y configurado

param(
    [Parameter(Mandatory=$true)]
    [string]$BucketName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$Profile = "default"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Desplegando Wiki MAP Assessment a S3" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si AWS CLI está instalado
Write-Host "1. Verificando AWS CLI..." -ForegroundColor Yellow
try {
    $awsVersion = aws --version 2>&1
    Write-Host "   ✓ AWS CLI encontrado: $awsVersion" -ForegroundColor Green
} catch {
    Write-Host "   ✗ AWS CLI no está instalado" -ForegroundColor Red
    Write-Host "   Instala AWS CLI desde: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Verificar credenciales
Write-Host ""
Write-Host "2. Verificando credenciales AWS..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity --profile $Profile 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Credenciales válidas" -ForegroundColor Green
    } else {
        throw "Credenciales inválidas"
    }
} catch {
    Write-Host "   ✗ Error con credenciales AWS" -ForegroundColor Red
    Write-Host "   Ejecuta: aws configure --profile $Profile" -ForegroundColor Red
    exit 1
}

# Crear bucket si no existe
Write-Host ""
Write-Host "3. Verificando/Creando bucket S3..." -ForegroundColor Yellow
$bucketExists = aws s3 ls "s3://$BucketName" --profile $Profile 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "   Bucket no existe. Creando..." -ForegroundColor Yellow
    aws s3 mb "s3://$BucketName" --region $Region --profile $Profile
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Bucket creado: $BucketName" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Error al crear bucket" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ✓ Bucket existe: $BucketName" -ForegroundColor Green
}

# Configurar bucket para hosting estático
Write-Host ""
Write-Host "4. Configurando hosting estático..." -ForegroundColor Yellow
$websiteConfig = @"
{
    "IndexDocument": {
        "Suffix": "index.html"
    },
    "ErrorDocument": {
        "Key": "index.html"
    }
}
"@
$websiteConfig | Out-File -FilePath "website-config.json" -Encoding UTF8

aws s3api put-bucket-website --bucket $BucketName --website-configuration file://website-config.json --profile $Profile
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Hosting estático configurado" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error al configurar hosting" -ForegroundColor Red
}
Remove-Item "website-config.json" -ErrorAction SilentlyContinue

# Configurar política de bucket para acceso público
Write-Host ""
Write-Host "5. Configurando acceso público..." -ForegroundColor Yellow

# Primero, permitir políticas públicas
aws s3api put-public-access-block --bucket $BucketName --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" --profile $Profile

$bucketPolicy = @"
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$BucketName/*"
        }
    ]
}
"@
$bucketPolicy | Out-File -FilePath "bucket-policy.json" -Encoding UTF8

aws s3api put-bucket-policy --bucket $BucketName --policy file://bucket-policy.json --profile $Profile
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Política de acceso público configurada" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Advertencia: No se pudo configurar política pública" -ForegroundColor Yellow
}
Remove-Item "bucket-policy.json" -ErrorAction SilentlyContinue

# Subir archivos
Write-Host ""
Write-Host "6. Subiendo archivos al bucket..." -ForegroundColor Yellow

# Subir HTML con content-type correcto
Write-Host "   Subiendo archivos HTML..." -ForegroundColor Cyan
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.html" --content-type "text/html" --profile $Profile --delete

# Subir CSS
Write-Host "   Subiendo archivos CSS..." -ForegroundColor Cyan
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.css" --content-type "text/css" --profile $Profile --delete

# Subir JavaScript
Write-Host "   Subiendo archivos JavaScript..." -ForegroundColor Cyan
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.js" --content-type "application/javascript" --profile $Profile --delete

# Subir imágenes
Write-Host "   Subiendo imágenes..." -ForegroundColor Cyan
aws s3 sync assets "s3://$BucketName/assets" --exclude "*" --include "*.png" --include "*.jpg" --include "*.jpeg" --include "*.gif" --include "*.svg" --content-type "image/png" --profile $Profile --delete

# Subir archivos de texto
Write-Host "   Subiendo archivos de texto..." -ForegroundColor Cyan
aws s3 sync . "s3://$BucketName" --exclude "*" --include "*.txt" --include "*.md" --content-type "text/plain" --profile $Profile

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Archivos subidos exitosamente" -ForegroundColor Green
} else {
    Write-Host "   ✗ Error al subir archivos" -ForegroundColor Red
    exit 1
}

# Mostrar URL del sitio
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ¡Despliegue Completado!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Tu wiki está disponible en:" -ForegroundColor Cyan
Write-Host "http://$BucketName.s3-website-$Region.amazonaws.com" -ForegroundColor Yellow
Write-Host ""
Write-Host "Nota: Si el enlace no funciona inmediatamente, espera 1-2 minutos." -ForegroundColor Gray
Write-Host ""
