# 🚀 Instrucciones de Deployment AWS - Assessment Center

Esta guía te llevará paso a paso para deployar tu aplicación en AWS usando la arquitectura serverless más rentable (~$5-15/mes).

---

## 📋 Pre-requisitos

### 1. Instalar dependencias nuevas del backend

```powershell
cd backend
npm install
```

Esto instalará:
- `@aws-sdk/client-s3` - Cliente de S3
- `@aws-sdk/s3-request-presigner` - Para generar URLs firmadas
- `serverless-http` - Para correr Express en Lambda

### 2. Instalar AWS CLI

```powershell
winget install Amazon.AWSCLI
```

O descarga desde: https://awscli.amazonaws.com/AWSCLIV2.msi

### 3. Configurar AWS CLI

```powershell
aws configure
```

Te pedirá:
- **AWS Access Key ID**: Obtener de AWS Console → IAM → Users → Security credentials
- **AWS Secret Access Key**: (mismo lugar)
- **Default region**: `us-east-1`
- **Default output format**: `json`

### 4. Verificar configuración

```powershell
aws sts get-caller-identity
```

Deberías ver tu Account ID y ARN.

---

## 🏗️ Paso 1: Crear Infraestructura AWS

### Opción A: Script Automático (Recomendado)

```powershell
cd aws
.\setup-aws-infrastructure.ps1 -UniqueSuffix "tunombre"
```

Reemplaza `"tunombre"` con tus iniciales o nombre de empresa (solo letras minúsculas y números).

Ejemplo:
```powershell
.\setup-aws-infrastructure.ps1 -UniqueSuffix "johnsmith"
```

Este script creará:
- ✅ S3 Bucket: `assessment-center-files-johnsmith`
- ✅ IAM Role: `assessment-center-lambda-role`
- ✅ Lambda Function: `assessment-center-api`

**IMPORTANTE**: Guarda el nombre del bucket que se crea, lo necesitarás después.

### Opción B: Manual

Sigue la guía completa: [AWS-DEPLOYMENT-GUIDE.md](AWS-DEPLOYMENT-GUIDE.md)

---

## 🌐 Paso 2: Configurar API Gateway

**Nota**: Esta parte es más fácil hacerla desde la consola web de AWS.

1. Ve a [AWS API Gateway Console](https://console.aws.amazon.com/apigateway)

2. Click **"Create API"** → **"REST API"** → **"Build"**

3. Configuración:
   - API name: `AssessmentCenterAPI`
   - Description: `API for AWS Assessment Center`
   - Endpoint Type: `Regional`
   - Click **"Create API"**

4. Crear recurso proxy:
   - Click **"Actions"** → **"Create Resource"**
   - ✅ Check **"Configure as proxy resource"**
   - Resource Name: `{proxy+}`
   - ✅ Check **"Enable API Gateway CORS"**
   - Click **"Create Resource"**

5. Configurar método ANY:
   - Ya se creó automáticamente con el proxy
   - Click en **"ANY"** bajo `/{proxy+}`
   - Integration type: **Lambda Function**
   - ✅ Check **"Use Lambda Proxy integration"**
   - Lambda Function: `assessment-center-api`
   - Click **"Save"**
   - Cuando pregunte por permisos, click **"OK"**

6. Crear método ANY en la raíz:
   - Click en **"/"** (la raíz)
   - Click **"Actions"** → **"Create Method"** → Selecciona **"ANY"**
   - Misma configuración que el paso 5

7. Deploy API:
   - Click **"Actions"** → **"Deploy API"**
   - Deployment stage: `[New Stage]`
   - Stage name: `prod`
   - Click **"Deploy"**

8. **GUARDAR LA URL**:
   - Arriba verás: **"Invoke URL: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod"**
   - Copia esta URL, la necesitarás para el frontend

---

## 🎨 Paso 3: Configurar Frontend en Amplify

### 3.1 Push a GitHub (si no lo has hecho)

```powershell
git add .
git commit -m "Preparar para AWS deployment"
git push origin main
```

### 3.2 Conectar Amplify con GitHub

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)

2. Click **"New app"** → **"Host web app"**

3. Selecciona **"GitHub"** → Click **"Continue"**

4. Autoriza AWS Amplify en GitHub

5. Selecciona:
   - Repository: `assessment-center`
   - Branch: `main`
   - Click **"Next"**

6. Configuración de build:
   - App name: `assessment-center`
   - Amplify detectará automáticamente `frontend/amplify.yml` ✅
   - Si no, asegúrate que "Build and test settings" apunte a `frontend/`

7. **IMPORTANTE - Environment Variables**:
   - Click **"Advanced settings"**
   - Agregar variable de entorno:
     ```
     Key: VITE_API_URL
     Value: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod
     ```
   - (Pega la URL que guardaste del paso 2)

8. Click **"Next"** → **"Save and deploy"**

9. Espera 5-10 minutos mientras Amplify hace el build

10. **GUARDAR LA URL DEL FRONTEND**:
    - Cuando termine, verás: `https://main.xxxxxx.amplifyapp.com`
    - Esa es tu aplicación desplegada!

---

## ✅ Paso 4: Verificar Deployment

### 4.1 Test del Backend

```powershell
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

### 4.2 Test del Frontend

1. Abre tu navegador en: `https://main.[APP-ID].amplifyapp.com`

2. Prueba:
   - ✅ Subir archivo Excel
   - ✅ Llenar formulario
   - ✅ Generar reporte
   - ✅ Descargar documento Word

---

## 🔄 Paso 5: Actualizar la Aplicación

### Actualizar Backend

```powershell
cd backend
npm run deploy
```

O manualmente:
```powershell
cd backend
npm run build
cd ../aws
.\deploy-lambda.ps1 -BucketName "assessment-center-files-tunombre" -FunctionName "assessment-center-api"
```

### Actualizar Frontend

```powershell
git add .
git commit -m "Actualizar frontend"
git push origin main
```

Amplify detectará el push y hará auto-deploy.

---

## 🐛 Troubleshooting

### Error: "Access Denied" en Lambda

```powershell
# Verificar rol IAM
aws iam get-role --role-name assessment-center-lambda-role

# Re-attachar políticas
aws iam attach-role-policy --role-name assessment-center-lambda-role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name assessment-center-lambda-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

### Error: CORS en Frontend

1. Verifica que API Gateway tiene CORS habilitado:
   - API Gateway Console → Tu API → Resources → `/{proxy+}` → Enable CORS

2. Verifica `VITE_API_URL` en Amplify:
   - Amplify Console → App settings → Environment variables

3. Re-deploy frontend:
   - Amplify Console → Redeploy this version

### Lambda Timeout

```powershell
# Aumentar timeout a 5 minutos (máximo 15 min)
aws lambda update-function-configuration --function-name assessment-center-api --timeout 300
```

### Lambda Out of Memory

```powershell
# Aumentar memoria a 2GB
aws lambda update-function-configuration --function-name assessment-center-api --memory-size 2048
```

### Ver Logs de Lambda

```powershell
# Ver logs en tiempo real
aws logs tail /aws/lambda/assessment-center-api --follow

# Ver logs específicos
aws logs filter-log-events --log-group-name /aws/lambda/assessment-center-api --start-time $(date -d '1 hour ago' +%s)000
```

---

## 💰 Monitorear Costos

### Configurar Alerta de Costos

1. Ve a [AWS Billing Console](https://console.aws.amazon.com/billing)

2. Click **"Budgets"** → **"Create budget"**

3. Configuración:
   - Budget type: **Cost budget**
   - Name: `assessment-center-monthly-budget`
   - Amount: `$20` (ajusta según necesites)
   - Period: **Monthly**

4. Configurar alertas:
   - Threshold: `80%` → Email alert
   - Threshold: `100%` → Email alert

### Ver Costos Actuales

```powershell
# Instalar jq primero (para parsear JSON)
# choco install jq

# Ver costos del mes actual
aws ce get-cost-and-usage --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) --granularity MONTHLY --metrics BlendedCost
```

O desde la consola: [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)

---

## 🎯 Optimizaciones Post-Deployment

### 1. Configurar Dominio Personalizado (Opcional)

En Amplify Console:
1. Domain management → Add domain
2. Sigue las instrucciones para configurar DNS

### 2. Configurar CI/CD con GitHub Actions

Amplify ya hace auto-deploy, pero si quieres más control:

Crear `.github/workflows/deploy.yml`:
```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      - run: cd backend && npm install && npm run deploy
```

### 3. Configurar CloudWatch Dashboards

1. Ve a [CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. Create dashboard → Add widgets para:
   - Lambda invocations
   - Lambda errors
   - Lambda duration
   - API Gateway 4xx/5xx errors

---

## 📝 Checklist Final

- [ ] Backend deployado en Lambda
- [ ] API Gateway configurado y funcionando
- [ ] Frontend deployado en Amplify
- [ ] Variables de entorno configuradas
- [ ] Test exitoso de upload → generate → download
- [ ] Alertas de costos configuradas
- [ ] URLs guardadas para referencia

---

## 🎉 ¡Listo!

Tu aplicación está ahora corriendo en AWS con arquitectura serverless.

**URLs importantes**:
- Frontend: `https://main.[APP-ID].amplifyapp.com`
- Backend: `https://[API-ID].execute-api.us-east-1.amazonaws.com/prod`
- S3 Bucket: `assessment-center-files-[tunombre]`

**Costos estimados**: $5-15/mes con bajo-medio tráfico

Para deployment futuro, solo necesitas:
```powershell
# Backend
cd backend && npm run deploy

# Frontend
git push origin main  # Auto-deploy
```

---

¿Problemas? Revisa:
- [AWS-DEPLOYMENT-GUIDE.md](AWS-DEPLOYMENT-GUIDE.md) - Guía completa
- [AWS-COST-COMPARISON.md](AWS-COST-COMPARISON.md) - Análisis de costos
- [Troubleshooting section](#-troubleshooting) arriba
