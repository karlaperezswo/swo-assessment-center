# AWS Deployment - Guía Rápida (30 minutos)

Esta es la versión resumida para deployar rápidamente. Para detalles completos, ver [AWS-DEPLOYMENT-GUIDE.md](AWS-DEPLOYMENT-GUIDE.md).

---

## Pre-requisitos (5 minutos)

1. **Cuenta AWS**
   - [Crear cuenta](https://aws.amazon.com/free/)
   - Tarjeta de crédito requerida (Free Tier cubre mucho)

2. **Instalar AWS CLI**
   ```powershell
   winget install Amazon.AWSCLI
   ```

3. **Configurar AWS CLI**
   ```powershell
   aws configure
   # AWS Access Key ID: [obtener de IAM Console]
   # AWS Secret Access Key: [obtener de IAM Console]
   # Region: us-east-1
   # Output: json
   ```

   Para obtener las keys:
   - AWS Console → IAM → Users → Tu usuario → Security credentials → Create access key

---

## Deployment Automático (15 minutos)

### 1. Crear Infraestructura AWS

```powershell
cd aws
.\setup-aws-infrastructure.ps1 -UniqueSuffix "tusnombres"
# Ejemplo: -UniqueSuffix "johnsmith" o -UniqueSuffix "empresaxyz"
```

Este script crea:
- ✅ S3 Bucket para archivos
- ✅ IAM Role para Lambda
- ✅ Lambda Function con tu código
- ⚠️ API Gateway (requiere consola web)
- ⚠️ Amplify (requiere consola web)

---

### 2. Configurar API Gateway (5 min - Web Console)

1. Ir a [AWS API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Seleccionar **AssessmentCenterAPI**
3. **Actions** → **Create Resource**
   - Resource path: `/{proxy+}`
   - Enable CORS: ✓
   - Create
4. **Actions** → **Create Method** → **ANY**
   - Integration type: Lambda Function
   - Use Lambda Proxy integration: ✓
   - Lambda Function: `assessment-center-api`
   - Save
5. **Actions** → **Deploy API**
   - Deployment stage: `prod`
   - Deploy
6. **Copiar URL**: `https://[API-ID].execute-api.us-east-1.amazonaws.com/prod`

---

### 3. Configurar Amplify Hosting (5 min - Web Console)

#### Opción A: Desde GitHub (Recomendado)

1. Push tu código a GitHub (si no lo has hecho):
   ```powershell
   git add .
   git commit -m "Preparar para AWS deployment"
   git push origin main
   ```

2. Ir a [AWS Amplify Console](https://console.aws.amazon.com/amplify)
3. **New app** → **Host web app**
4. Conectar GitHub:
   - Autorizar AWS Amplify
   - Seleccionar repositorio
   - Seleccionar branch: `main`
5. **App settings**:
   - App name: `assessment-center`
   - Detecta `amplify.yml` automáticamente ✓
6. **Environment variables** (IMPORTANTE):
   ```
   VITE_API_URL = https://[TU-API-ID].execute-api.us-east-1.amazonaws.com/prod
   ```
   (Pegar la URL del paso 2)
7. **Save and deploy**

#### Opción B: Deploy Manual (sin Git)

```powershell
cd frontend

# Build
npm run build

# Crear ZIP
Compress-Archive -Path dist\* -DestinationPath frontend-build.zip

# Ir a Amplify Console → Manual deploy → Subir ZIP
```

---

### 4. Verificar Deployment (5 min)

#### Test Backend
```powershell
# Health check
curl https://[TU-API-ID].execute-api.us-east-1.amazonaws.com/prod/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-01-30T...",
  "version": "1.0.0"
}
```

#### Test Frontend
1. Ir a tu URL de Amplify:
   ```
   https://main.[APP-ID].amplifyapp.com
   ```
2. Subir un Excel de prueba
3. Generar reporte

---

## URLs Importantes

Guarda estas URLs para referencia:

```
Frontend: https://main.[APP-ID].amplifyapp.com
Backend API: https://[API-ID].execute-api.us-east-1.amazonaws.com/prod
S3 Bucket: assessment-center-files-[tunombre]
```

---

## Comandos Útiles

### Ver logs de Lambda
```powershell
aws logs tail /aws/lambda/assessment-center-api --follow
```

### Actualizar código del backend
```powershell
cd backend
.\deploy-lambda.ps1 -BucketName "assessment-center-files-[tunombre]" -FunctionName "assessment-center-api"
```

### Ver costos actuales
```powershell
# Ir a: https://console.aws.amazon.com/billing/home
```

---

## Troubleshooting Rápido

### Error: "Access Denied" en Lambda
```powershell
# Verificar rol IAM
aws iam get-role --role-name assessment-center-lambda-role

# Re-attachar políticas
aws iam attach-role-policy --role-name assessment-center-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

### Error: CORS en frontend
- Verificar que API Gateway tiene CORS habilitado
- Verificar que `VITE_API_URL` está configurado en Amplify

### Error: Lambda timeout
```powershell
# Aumentar timeout a 5 minutos
aws lambda update-function-configuration --function-name assessment-center-api --timeout 300
```

### Frontend no conecta con backend
1. Verificar `VITE_API_URL` en Amplify Environment Variables
2. Re-deployar frontend (Amplify Console → Redeploy)

---

## Actualizar la Aplicación

### Backend
```powershell
cd backend
.\deploy-lambda.ps1
```

### Frontend
```powershell
# Si está conectado a Git:
git push origin main
# Amplify auto-deploya

# Si es manual:
cd frontend
npm run build
# Subir dist/ a Amplify Console
```

---

## Eliminar Todo (Cleanup)

```powershell
# Eliminar Lambda
aws lambda delete-function --function-name assessment-center-api

# Eliminar S3 Bucket
aws s3 rb s3://assessment-center-files-[tunombre] --force

# Eliminar IAM Role
aws iam detach-role-policy --role-name assessment-center-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam detach-role-policy --role-name assessment-center-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam delete-role --role-name assessment-center-lambda-role

# Eliminar API Gateway (desde consola web)

# Eliminar Amplify App (desde consola web)
```

---

## Próximos Pasos

- [ ] Configurar dominio personalizado
- [ ] Configurar CI/CD con GitHub Actions
- [ ] Agregar CloudWatch Dashboards
- [ ] Configurar alertas de costos
- [ ] Implementar AWS WAF para seguridad

---

## Costos Estimados

**Primera vez**: $0 (Free Tier cubre todo)
**Después de Free Tier**: $5-25/mes dependiendo del tráfico

Ver detalles en [AWS-COST-COMPARISON.md](AWS-COST-COMPARISON.md)

---

## Soporte

- [AWS Documentation](https://docs.aws.amazon.com/)
- [AWS Support](https://console.aws.amazon.com/support/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/amazon-web-services)

---

¡Listo! Tu aplicación está en la nube. 🚀
