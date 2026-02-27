# Script de diagnóstico para verificar permisos de Bedrock
# Ejecutar desde: backend/

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO DE BEDROCK - PERMISOS AWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Verificar identidad AWS
Write-Host "[1/4] Verificando identidad AWS..." -ForegroundColor Yellow
try {
    $identity = aws sts get-caller-identity 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Identidad AWS verificada:" -ForegroundColor Green
        $identity | ConvertFrom-Json | Format-List
    } else {
        Write-Host "❌ Error al verificar identidad AWS" -ForegroundColor Red
        Write-Host $identity -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Listar modelos de Bedrock disponibles
Write-Host "[2/4] Listando modelos de Bedrock disponibles..." -ForegroundColor Yellow
try {
    $models = aws bedrock list-foundation-models --region us-east-1 --query "modelSummaries[?contains(modelId, 'claude-3-5-sonnet')]" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Modelos Claude 3.5 Sonnet disponibles:" -ForegroundColor Green
        $models | ConvertFrom-Json | Format-List modelId, modelName
    } else {
        Write-Host "❌ Error al listar modelos (posible problema de permisos)" -ForegroundColor Red
        Write-Host $models -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 3: Test directo con modelo sin inference profile
Write-Host "[3/4] Probando modelo directo (anthropic.claude-3-5-sonnet-20241022-v2:0)..." -ForegroundColor Yellow
$testBody = @{
    anthropic_version = "bedrock-2023-05-31"
    max_tokens = 100
    messages = @(
        @{
            role = "user"
            content = "Hello, respond with just 'OK'"
        }
    )
} | ConvertTo-Json -Depth 10

$testBody | Out-File -FilePath "test-body.json" -Encoding utf8

try {
    $result = aws bedrock-runtime invoke-model `
        --model-id "anthropic.claude-3-5-sonnet-20241022-v2:0" `
        --region us-east-1 `
        --body "file://test-body.json" `
        test-output.json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Modelo directo funciona correctamente" -ForegroundColor Green
        $output = Get-Content test-output.json | ConvertFrom-Json
        Write-Host "Respuesta:" -ForegroundColor Green
        $output | Format-List
    } else {
        Write-Host "❌ Error al invocar modelo directo" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Test 4: Test con inference profile
Write-Host "[4/4] Probando inference profile (us.anthropic.claude-3-5-sonnet-20241022-v2:0)..." -ForegroundColor Yellow
try {
    $result = aws bedrock-runtime invoke-model `
        --model-id "us.anthropic.claude-3-5-sonnet-20241022-v2:0" `
        --region us-east-1 `
        --body "file://test-body.json" `
        test-output-profile.json 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Inference profile funciona correctamente" -ForegroundColor Green
        $output = Get-Content test-output-profile.json | ConvertFrom-Json
        Write-Host "Respuesta:" -ForegroundColor Green
        $output | Format-List
    } else {
        Write-Host "❌ Error al invocar inference profile" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        Write-Host ""
        Write-Host "RECOMENDACIÓN: Usa el modelo directo en .env" -ForegroundColor Yellow
        Write-Host "BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}

# Cleanup
Remove-Item -Path "test-body.json" -ErrorAction SilentlyContinue
Remove-Item -Path "test-output.json" -ErrorAction SilentlyContinue
Remove-Item -Path "test-output-profile.json" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNÓSTICO COMPLETADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Si todos los tests pasaron: El problema puede ser el tamaño del prompt" -ForegroundColor White
Write-Host "2. Si falló el test 2 o 3: Problema de permisos IAM" -ForegroundColor White
Write-Host "3. Si solo falló el test 4: Usa modelo directo (ya configurado en .env)" -ForegroundColor White
Write-Host ""
