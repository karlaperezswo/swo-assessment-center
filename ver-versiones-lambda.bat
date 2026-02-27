@echo off
echo ==========================================
echo   Versiones de Lambda en S3
echo   Bucket: assessment-center-files-assessment-dashboard
echo ==========================================
echo.

echo Listando versiones del archivo lambda-function.zip...
echo.

aws s3api list-object-versions ^
  --bucket assessment-center-files-assessment-dashboard ^
  --prefix lambda/lambda-function.zip ^
  --region us-east-1 ^
  --query "Versions[*].[VersionId,LastModified,Size,IsLatest]" ^
  --output table

echo.
echo ==========================================
echo   Comandos utiles:
echo ==========================================
echo.
echo Ver todas las versiones (JSON detallado):
echo   aws s3api list-object-versions --bucket assessment-center-files-assessment-dashboard --prefix lambda/lambda-function.zip --region us-east-1
echo.
echo Descargar version especifica:
echo   aws s3api get-object --bucket assessment-center-files-assessment-dashboard --key lambda/lambda-function.zip --version-id [VERSION_ID] lambda-backup.zip --region us-east-1
echo.
echo Restaurar version anterior (re-deploy):
echo   1. Descargar version anterior con comando de arriba
echo   2. Subir como nueva version: aws s3 cp lambda-backup.zip s3://assessment-center-files-assessment-dashboard/lambda/lambda-function.zip --region us-east-1
echo   3. Actualizar Lambda: aws lambda update-function-code --function-name assessment-center-api --s3-bucket assessment-center-files-assessment-dashboard --s3-key lambda/lambda-function.zip --region us-east-1
echo.
pause
