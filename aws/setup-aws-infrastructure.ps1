# Setup AWS Infrastructure Script
# Este script crea todos los recursos necesarios en AWS

param(
    [string]$ProjectName = "assessment-center",
    [string]$Region = "us-east-1",
    [Parameter(Mandatory=$true)]
    [string]$UniqueSuffix  # Por ejemplo: tu nombre o iniciales
)

$BucketName = "$ProjectName-files-$UniqueSuffix"
$FunctionName = "${ProjectName}-api"
$RoleName = "${ProjectName}-lambda-role"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AWS Infrastructure Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project: $ProjectName" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host "Bucket: $BucketName" -ForegroundColor White
Write-Host ""

# Verificar AWS CLI
Write-Host "Checking AWS CLI configuration..." -ForegroundColor Yellow
$awsIdentity = aws sts get-caller-identity --output json 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "AWS CLI not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}
$identity = $awsIdentity | ConvertFrom-Json
$accountId = $identity.Account
Write-Host "AWS Account: $accountId" -ForegroundColor Green
Write-Host ""

# 1. Crear S3 Bucket
Write-Host "[1/6] Creating S3 Bucket..." -ForegroundColor Yellow
aws s3 mb "s3://$BucketName" --region $Region 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "S3 Bucket created: $BucketName" -ForegroundColor Green
} else {
    Write-Host "Bucket might already exist, continuing..." -ForegroundColor Yellow
}

# Configurar lifecycle policy
Write-Host "Configuring S3 lifecycle policy..." -ForegroundColor Yellow
aws s3api put-bucket-lifecycle-configuration `
    --bucket $BucketName `
    --lifecycle-configuration file://../aws/s3-lifecycle.json `
    --region $Region

Write-Host ""

# 2. Crear IAM Role para Lambda
Write-Host "[2/6] Creating IAM Role for Lambda..." -ForegroundColor Yellow

# Verificar si el rol ya existe
$roleExists = aws iam get-role --role-name $RoleName 2>$null
if ($LASTEXITCODE -ne 0) {
    # Crear rol
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document file://../aws/lambda-trust-policy.json

    Write-Host "IAM Role created: $RoleName" -ForegroundColor Green

    # Esperar a que el rol se propague
    Start-Sleep -Seconds 5
} else {
    Write-Host "IAM Role already exists: $RoleName" -ForegroundColor Yellow
}

# Adjuntar políticas
Write-Host "Attaching policies..." -ForegroundColor Yellow
aws iam attach-role-policy `
    --role-name $RoleName `
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

aws iam attach-role-policy `
    --role-name $RoleName `
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess"

Write-Host ""

# 3. Crear Lambda Function
Write-Host "[3/6] Creating Lambda Function..." -ForegroundColor Yellow
Write-Host "First, build and package the backend..." -ForegroundColor Yellow

# Cambiar al directorio backend y hacer build
$originalLocation = Get-Location
Set-Location ../backend

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    Set-Location $originalLocation
    exit 1
}

# Crear package temporal
$tempDir = "lambda-temp"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

Copy-Item -Path "dist" -Destination "$tempDir/dist" -Recurse
Copy-Item -Path "node_modules" -Destination "$tempDir/node_modules" -Recurse
Copy-Item -Path "package.json" -Destination "$tempDir/"

Set-Location $tempDir
Compress-Archive -Path * -DestinationPath "../function.zip" -CompressionLevel Optimal
Set-Location ..
Remove-Item $tempDir -Recurse -Force

# Subir a S3
Write-Host "Uploading Lambda package to S3..." -ForegroundColor Yellow
aws s3 cp function.zip "s3://$BucketName/lambda/function.zip" --region $Region

# Verificar si la función ya existe
$functionExists = aws lambda get-function --function-name $FunctionName --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
    # Crear función
    Write-Host "Creating Lambda function..." -ForegroundColor Yellow
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime nodejs20.x `
        --role "arn:aws:iam::${accountId}:role/$RoleName" `
        --handler "dist/lambda.handler" `
        --code "S3Bucket=$BucketName,S3Key=lambda/function.zip" `
        --timeout 300 `
        --memory-size 1024 `
        --environment "Variables={S3_BUCKET_NAME=$BucketName,AWS_REGION=$Region,NODE_ENV=production}" `
        --region $Region

    Write-Host "Lambda function created: $FunctionName" -ForegroundColor Green
} else {
    Write-Host "Lambda function already exists, updating code..." -ForegroundColor Yellow
    aws lambda update-function-code `
        --function-name $FunctionName `
        --s3-bucket $BucketName `
        --s3-key "lambda/function.zip" `
        --region $Region
}

Remove-Item function.zip -Force
Set-Location $originalLocation
Write-Host ""

# 4. Crear API Gateway
Write-Host "[4/6] Creating API Gateway..." -ForegroundColor Yellow
Write-Host "Note: API Gateway setup is easier through AWS Console" -ForegroundColor Yellow
Write-Host "Follow steps in AWS-DEPLOYMENT-GUIDE.md section 'PASO 4'" -ForegroundColor Yellow
Write-Host ""

# 5. Setup Amplify
Write-Host "[5/6] Amplify Hosting Setup..." -ForegroundColor Yellow
Write-Host "Note: Amplify is easier to setup through AWS Console" -ForegroundColor Yellow
Write-Host "Follow steps in AWS-DEPLOYMENT-GUIDE.md section 'PASO 5'" -ForegroundColor Yellow
Write-Host ""

# 6. Summary
Write-Host "[6/6] Infrastructure Setup Summary" -ForegroundColor Yellow
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Resources Created" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "S3 Bucket: $BucketName" -ForegroundColor White
Write-Host "IAM Role: $RoleName" -ForegroundColor White
Write-Host "Lambda Function: $FunctionName" -ForegroundColor White
Write-Host "Region: $Region" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Setup API Gateway (see AWS-DEPLOYMENT-GUIDE.md)" -ForegroundColor White
Write-Host "2. Setup Amplify Hosting (see AWS-DEPLOYMENT-GUIDE.md)" -ForegroundColor White
Write-Host "3. Configure environment variables in Amplify" -ForegroundColor White
Write-Host "4. Test your deployment" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "- View Lambda logs: aws logs tail /aws/lambda/$FunctionName --follow" -ForegroundColor White
Write-Host "- Test Lambda: aws lambda invoke --function-name $FunctionName output.json" -ForegroundColor White
Write-Host "- Deploy updates: cd backend && ./deploy-lambda.ps1" -ForegroundColor White
Write-Host ""
