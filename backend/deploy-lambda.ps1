# AWS Lambda Deployment Script for Assessment Center
# Asegurate de haber configurado AWS CLI: aws configure

param(
    [string]$BucketName = "assessment-center-files",
    [string]$FunctionName = "AssessmentCenterAPI",
    [string]$Region = "us-east-1",
    [string]$Profile = "sandbox-swo"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AWS Lambda Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Build del proyecto
Write-Host "[1/5] Building TypeScript project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Build completed successfully!" -ForegroundColor Green
Write-Host ""

# 2. Crear ZIP (solo dist, node_modules se instalan en Lambda Layer)
Write-Host "[2/5] Creating deployment package..." -ForegroundColor Yellow

# Crear directorio temporal
$tempDir = "lambda-package"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar dist y node_modules
Copy-Item -Path "dist" -Destination "$tempDir/dist" -Recurse
Copy-Item -Path "node_modules" -Destination "$tempDir/node_modules" -Recurse
Copy-Item -Path "package.json" -Destination "$tempDir/"

# Crear ZIP
$zipPath = "function.zip"
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

Set-Location $tempDir
Compress-Archive -Path * -DestinationPath "../$zipPath" -CompressionLevel Optimal
Set-Location ..

# Limpiar directorio temporal
Remove-Item $tempDir -Recurse -Force

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "Deployment package created: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
Write-Host ""

# 3. Subir a S3
Write-Host "[3/5] Uploading to S3..." -ForegroundColor Yellow
$s3Key = "lambda/function-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
aws s3 cp $zipPath "s3://$BucketName/$s3Key" --region $Region --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Host "S3 upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Uploaded to s3://$BucketName/$s3Key" -ForegroundColor Green
Write-Host ""

# 4. Actualizar función Lambda
Write-Host "[4/5] Updating Lambda function..." -ForegroundColor Yellow
aws lambda update-function-code `
    --function-name $FunctionName `
    --s3-bucket $BucketName `
    --s3-key $s3Key `
    --region $Region `
    --profile $Profile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Lambda update failed!" -ForegroundColor Red
    Write-Host "You may need to create the function first. See AWS-DEPLOYMENT-GUIDE.md" -ForegroundColor Yellow
    exit 1
}
Write-Host "Lambda function updated successfully!" -ForegroundColor Green
Write-Host ""

# 5. Verificar deployment
Write-Host "[5/5] Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

$functionInfo = aws lambda get-function --function-name $FunctionName --region $Region --profile $Profile --output json | ConvertFrom-Json
$lastModified = $functionInfo.Configuration.LastModified
$codeSize = [math]::Round($functionInfo.Configuration.CodeSize / 1MB, 2)

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Deployment Successful!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Function Name: $FunctionName" -ForegroundColor White
Write-Host "Last Modified: $lastModified" -ForegroundColor White
Write-Host "Code Size: $codeSize MB" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test the function: aws lambda invoke --function-name $FunctionName output.json" -ForegroundColor White
Write-Host "2. View logs: aws logs tail /aws/lambda/$FunctionName --follow" -ForegroundColor White
Write-Host ""

# Limpiar archivo ZIP local
Remove-Item $zipPath -Force
