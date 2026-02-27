@echo off
cls
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                                                              ║
echo ║         VERIFICACION POST-DEPLOYMENT                         ║
echo ║         assessment-center-api                                ║
echo ║                                                              ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ TEST 1: Health Check                                         │
echo └──────────────────────────────────────────────────────────────┘
echo.

curl -s https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/health
echo.
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ TEST 2: Selector Questions Endpoint                          │
echo └──────────────────────────────────────────────────────────────┘
echo.

curl -s https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/api/selector/questions | head -c 200
echo ...
echo.
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ TEST 3: Lambda Function Info                                 │
echo └──────────────────────────────────────────────────────────────┘
echo.

aws lambda get-function-configuration --function-name assessment-center-api --region us-east-1 --query "{LastModified:LastModified,CodeSize:CodeSize,Timeout:Timeout,Memory:MemorySize,Runtime:Runtime}" --output table
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ TEST 4: Versiones en S3                                      │
echo └──────────────────────────────────────────────────────────────┘
echo.

aws s3api list-object-versions --bucket assessment-center-files-assessment-dashboard --prefix lambda/lambda-function.zip --region us-east-1 --query "length(Versions)"
echo versiones disponibles en S3
echo.

echo ┌──────────────────────────────────────────────────────────────┐
echo │ TEST 5: Logs Recientes (ultimos 5 minutos)                   │
echo └──────────────────────────────────────────────────────────────┘
echo.

aws logs tail /aws/lambda/assessment-center-api --since 5m --region us-east-1
echo.

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║              VERIFICACION COMPLETADA                         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
echo Proximos pasos:
echo   1. Probar PDF export en: https://main.d2yfhqkm0yjhqo.amplifyapp.com
echo   2. Ver logs en tiempo real: aws logs tail /aws/lambda/assessment-center-api --follow --region us-east-1
echo   3. Buscar logs de PDF: aws logs tail /aws/lambda/assessment-center-api --follow --filter-pattern "[PDF Export]" --region us-east-1
echo.
pause
