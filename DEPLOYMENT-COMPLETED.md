# ✅ Deployment AWS Completado - Assessment Center

## 🎉 Estado: Backend Deployado Exitosamente

Tu backend está corriendo en AWS con arquitectura serverless!

---

## 📋 Recursos Creados

### ✅ Amazon S3
- **Bucket**: `assessment-center-files-assessment-dashboard`
- **Region**: `us-east-1`
- **Lifecycle**: Archivos se eliminan después de 1 día automáticamente
- **URL**: https://s3.console.aws.amazon.com/s3/buckets/assessment-center-files-assessment-dashboard

### ✅ AWS Lambda
- **Function Name**: `assessment-center-api`
- **Runtime**: Node.js 20.x
- **Memory**: 1024 MB
- **Timeout**: 300 segundos (5 minutos)
- **Environment**:
  - `NODE_ENV=production`
  - `S3_BUCKET_NAME=assessment-center-files-assessment-dashboard`
- **ARN**: `arn:aws:lambda:us-east-1:212268884430:function:assessment-center-api`
- **Console**: https://console.aws.amazon.com/lambda/home?region=us-east-1#/functions/assessment-center-api

### ✅ API Gateway
- **API ID**: `6tk4qqlhs6`
- **API Name**: `AssessmentCenterAPI`
- **Stage**: `prod`
- **Invoke URL**: `https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod`
- **Console**: https://console.aws.amazon.com/apigateway/home?region=us-east-1#/apis/6tk4qqlhs6

### ✅ IAM Role
- **Role Name**: `assessment-center-lambda-role`
- **Policies Attached**:
  - `AWSLambdaBasicExecutionRole` (logs)
  - `AmazonS3FullAccess` (S3 access)

---

## ✅ Verificación del Backend

**Health Check**:
```bash
curl https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/health
```

**Respuesta esperada**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-30T13:14:02.660Z",
  "environment": "production",
  "version": "1.0.0"
}
```

✅ **Backend funcionando correctamente!**

---

## 🎨 Próximo Paso: Configurar Frontend en Amplify

### Opción A: Deploy Automático con GitHub (RECOMENDADO)

#### 1. Push tu código a GitHub

```powershell
# Si aún no has pusheado los cambios
git add .
git commit -m "Add AWS deployment configuration"
git push origin main
```

#### 2. Configurar AWS Amplify

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)

2. Click **"New app"** → **"Host web app"**

3. Selecciona **"GitHub"** → Autoriza AWS Amplify

4. Selecciona tu repositorio:
   - Repository: `assessment-center`
   - Branch: `main`

5. **Build Settings** (Importante):
   - App name: `assessment-center`
   - Build root directory: `frontend`
   - Amplify detectará automáticamente `amplify.yml`

6. **Environment Variables** (MUY IMPORTANTE):
   ```
   VITE_API_URL = https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod
   ```

   ⚠️ **Copiar exactamente esta URL**

7. Click **"Save and deploy"**

8. Espera 5-10 minutos mientras Amplify:
   - Clona el repositorio
   - Instala dependencias
   - Hace el build
   - Deploya a CloudFront CDN

9. Cuando termine, verás tu URL:
   ```
   https://main.[APP-ID].amplifyapp.com
   ```

### Opción B: Deploy Manual (sin GitHub)

```powershell
# 1. Build del frontend
cd frontend
npm run build

# 2. Ir a Amplify Console
# https://console.aws.amazon.com/amplify

# 3. New app → Deploy without Git
# 4. Drag & drop la carpeta frontend/dist
# 5. Configurar VITE_API_URL en Environment Variables
```

---

## 🧪 Testing Completo

Una vez que Amplify esté deployado:

### 1. Test Frontend
Abre: `https://main.[TU-APP-ID].amplifyapp.com`

### 2. Test Upload de Excel
1. Arrastra un archivo Excel MPA
2. Deberías ver los datos parseados

### 3. Test Generación de Reporte
1. Llena el formulario de cliente
2. Click "Generate Report"
3. Descarga el documento Word

### 4. Verificar S3
```bash
# Ver archivos en S3
aws s3 ls s3://assessment-center-files-assessment-dashboard/generated/ --profile sandbox-swo
```

---

## 📊 Monitoreo y Logs

### Ver Logs de Lambda

```bash
# Logs en tiempo real
aws logs tail /aws/lambda/assessment-center-api --follow --profile sandbox-swo

# Logs de las últimas 10 minutos
aws logs tail /aws/lambda/assessment-center-api --since 10m --profile sandbox-swo
```

### Ver Métricas en CloudWatch

1. Ve a [CloudWatch Console](https://console.aws.amazon.com/cloudwatch)
2. Metrics → Lambda → By Function Name
3. Selecciona `assessment-center-api`
4. Métricas disponibles:
   - Invocations (llamadas)
   - Duration (tiempo de ejecución)
   - Errors (errores)
   - Throttles (límites alcanzados)

### API Gateway Logs

1. Ve a [API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Tu API → Stages → prod → Logs/Tracing
3. Enable CloudWatch Logs

---

## 💰 Costos Estimados

Con tu configuración actual:

| Servicio | Costo Estimado/mes |
|----------|-------------------|
| **Lambda** | $0 - $5 (Free Tier: 1M requests) |
| **API Gateway** | $0 - $2 (Free Tier: 1M requests) |
| **S3** | $1 - $3 (storage + requests) |
| **Amplify** | $1 - $15 (hosting + builds) |
| **CloudWatch** | $0 - $2 (logs) |
| **TOTAL** | **~$5-25/mes** |

### Free Tier (primer año):
- Lambda: 1M requests/mes gratis
- API Gateway: 1M requests/mes gratis
- S3: 5GB storage gratis
- CloudWatch: 5GB logs gratis

---

## 🔄 Actualizar la Aplicación

### Actualizar Backend

```powershell
# Opción 1: Script automático
cd backend
npm run build
aws s3 cp lambda-function.zip s3://assessment-center-files-assessment-dashboard/lambda/function.zip --profile sandbox-swo
aws lambda update-function-code --function-name assessment-center-api --s3-bucket assessment-center-files-assessment-dashboard --s3-key lambda/function.zip --profile sandbox-swo

# Opción 2: Crear nuevo ZIP y deployar
cd backend
rm -rf lambda-temp lambda-function.zip
mkdir lambda-temp
cp -r dist lambda-temp/
cp package.json lambda-temp/
cd lambda-temp
npm install --production --legacy-peer-deps
powershell -Command "Compress-Archive -Path * -DestinationPath ../lambda-function.zip -Force"
cd ..
aws s3 cp lambda-function.zip s3://assessment-center-files-assessment-dashboard/lambda/function.zip --profile sandbox-swo
aws lambda update-function-code --function-name assessment-center-api --s3-bucket assessment-center-files-assessment-dashboard --s3-key lambda/function.zip --profile sandbox-swo
```

### Actualizar Frontend

```powershell
# Si usas GitHub (auto-deploy):
git add .
git commit -m "Update frontend"
git push origin main
# Amplify detecta el push y hace auto-deploy

# Si usas deploy manual:
cd frontend
npm run build
# Subir carpeta dist/ en Amplify Console
```

---

## 🐛 Troubleshooting

### Error: "CORS policy" en frontend

**Solución**: Habilitar CORS en API Gateway

```bash
aws apigateway put-method-response --rest-api-id 6tk4qqlhs6 --resource-id hirrul --http-method ANY --status-code 200 --response-parameters "method.response.header.Access-Control-Allow-Origin=true" --profile sandbox-swo
```

### Lambda Timeout

```bash
# Aumentar timeout a 10 minutos
aws lambda update-function-configuration --function-name assessment-center-api --timeout 600 --profile sandbox-swo
```

### Lambda Out of Memory

```bash
# Aumentar memoria a 2GB
aws lambda update-function-configuration --function-name assessment-center-api --memory-size 2048 --profile sandbox-swo
```

### Frontend no conecta con backend

1. Verifica `VITE_API_URL` en Amplify Environment Variables
2. Debe ser: `https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod`
3. Re-deploy el frontend

---

## 🎯 Checklist de Deployment

- [x] S3 Bucket creado
- [x] Lambda Function deployada
- [x] API Gateway configurado
- [x] Backend funcionando (health check ✓)
- [ ] Frontend deployado en Amplify
- [ ] VITE_API_URL configurado en Amplify
- [ ] Test completo de la aplicación
- [ ] Monitoreo de costos configurado

---

## 📞 Comandos Útiles

```bash
# Ver estado de Lambda
aws lambda get-function --function-name assessment-center-api --profile sandbox-swo

# Ver logs recientes
aws logs tail /aws/lambda/assessment-center-api --since 1h --profile sandbox-swo

# Listar archivos en S3
aws s3 ls s3://assessment-center-files-assessment-dashboard/ --recursive --profile sandbox-swo

# Ver costos actuales
aws ce get-cost-and-usage --time-period Start=2026-01-01,End=2026-01-30 --granularity MONTHLY --metrics BlendedCost --profile sandbox-swo

# Test del API
curl https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod/health
```

---

## 🎊 ¡Siguiente Paso!

**Configura Amplify Hosting siguiendo la sección "Próximo Paso" arriba ↑**

Una vez que Amplify esté configurado, tendrás tu aplicación completa corriendo en AWS con:
- ✅ Backend serverless (Lambda + API Gateway)
- ✅ Frontend global (Amplify + CloudFront CDN)
- ✅ Storage escalable (S3)
- ✅ Costos optimizados (~$5-25/mes)
- ✅ Auto-scaling incluido

---

**URLs de referencia**:
- API Backend: https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod
- S3 Bucket: assessment-center-files-assessment-dashboard
- Lambda Function: assessment-center-api
- AWS Account: 212268884430
- Region: us-east-1

¡Deployment exitoso! 🚀
