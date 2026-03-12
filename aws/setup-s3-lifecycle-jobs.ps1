# Setup S3 Lifecycle Policy for Automatic Job Cleanup
# This script configures S3 to automatically delete job files older than 14 days

Write-Host "╔══════════════════════════════════════════════════════════════╗"
Write-Host "║                                                              ║"
Write-Host "║         S3 LIFECYCLE POLICY SETUP                            ║"
Write-Host "║         Automatic Job Cleanup (14 days)                      ║"
Write-Host "║                                                              ║"
Write-Host "╚══════════════════════════════════════════════════════════════╝"
Write-Host ""

$BUCKET_NAME = "assessment-center-files-assessment-dashboard"
$PROFILE = "karla"
$REGION = "us-east-1"

Write-Host "Bucket: $BUCKET_NAME"
Write-Host "Profile: $PROFILE"
Write-Host "Region: $REGION"
Write-Host ""

Write-Host "⚠️  This will configure automatic deletion of files in s3://$BUCKET_NAME/jobs/"
Write-Host "   Files older than 14 days will be permanently deleted."
Write-Host ""
Write-Host "¿Continuar? (S/N)"
$confirmation = Read-Host
if ($confirmation -ne 'S' -and $confirmation -ne 's') {
    Write-Host ""
    Write-Host "❌ Operación cancelada"
    exit 0
}

Write-Host ""
Write-Host "┌──────────────────────────────────────────────────────────────┐"
Write-Host "│ Aplicando Lifecycle Policy...                                │"
Write-Host "└──────────────────────────────────────────────────────────────┘"
Write-Host ""

# Apply lifecycle policy
aws s3api put-bucket-lifecycle-configuration `
  --bucket $BUCKET_NAME `
  --lifecycle-configuration file://aws/s3-lifecycle-jobs.json `
  --profile $PROFILE `
  --region $REGION

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Lifecycle policy aplicada exitosamente"
    Write-Host ""
    Write-Host "Configuración:"
    Write-Host "  - Prefijo: jobs/"
    Write-Host "  - Expiración: 14 días"
    Write-Host "  - Estado: Enabled"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Error al aplicar lifecycle policy"
    Write-Host ""
    exit 1
}

Write-Host "┌──────────────────────────────────────────────────────────────┐"
Write-Host "│ Verificando configuración...                                 │"
Write-Host "└──────────────────────────────────────────────────────────────┘"
Write-Host ""

# Verify configuration
aws s3api get-bucket-lifecycle-configuration `
  --bucket $BUCKET_NAME `
  --profile $PROFILE `
  --region $REGION

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗"
Write-Host "║                                                              ║"
Write-Host "║              ✅ CONFIGURACIÓN COMPLETADA                     ║"
Write-Host "║                                                              ║"
Write-Host "╚══════════════════════════════════════════════════════════════╝"
Write-Host ""
Write-Host "Los archivos en s3://$BUCKET_NAME/jobs/ se eliminarán"
Write-Host "automáticamente después de 14 días."
Write-Host ""
