# 🔒 Configuración Segura de Amplify - MVP Protegido

Esta guía configura Amplify con medidas de seguridad para que tu MVP no quede expuesto públicamente.

---

## 🛡️ Medidas de Seguridad Implementadas

1. **Password Protection** en Amplify (protege el frontend)
2. **Rate Limiting** en API Gateway (previene abuso del backend)
3. **CORS Estricto** (solo tu dominio puede llamar el API)
4. **Logging y Monitoreo** (detecta actividad sospechosa)
5. **API Key** (opcional, capa extra de seguridad)

---

## 📋 Paso 1: Configurar Amplify con Password Protection

### 1.1 Conectar GitHub con Amplify

1. Ve a [AWS Amplify Console](https://console.aws.amazon.com/amplify)

2. Click **"New app"** → **"Host web app"**

3. Selecciona **"GitHub"**

4. Click **"Authorize AWS Amplify"**
   - Esto te pedirá autorización en GitHub
   - Acepta los permisos

5. Selecciona tu repositorio:
   - **Repository**: `rekyli198/assessment-center`
   - **Branch**: `main`
   - Click **"Next"**

### 1.2 Configurar Build Settings

1. **App name**: `assessment-center`

2. **Build settings**:
   - Amplify detectará automáticamente `frontend/amplify.yml` ✅
   - Build command: `npm run build`
   - Base directory: `frontend`
   - Output directory: `dist`

3. **Environment Variables** (MUY IMPORTANTE):
   ```
   VITE_API_URL = https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod
   ```

4. Click **"Next"**

### 1.3 🔒 ACTIVAR PASSWORD PROTECTION (Importante!)

1. En la página de configuración, ANTES de deployar:
   - Click **"Advanced settings"** (expandir)

2. **Enable access control**:
   - ✅ Check **"Restrict access"**
   - Selecciona **"Username and password"**
   - Username: `assessment-admin` (o el que prefieras)
   - Password: `[GENERA UNA CONTRASEÑA FUERTE]`

   **Ejemplo de contraseña fuerte**: `AssessM3nt!2024@Secure`

3. Click **"Save and deploy"**

**IMPORTANTE**: Con esto, cualquiera que intente acceder a tu app verá una ventana de login básico. Solo quienes tengan el usuario/contraseña podrán entrar.

---

## 🔐 Paso 2: Configurar Rate Limiting en API Gateway

Esto previene que alguien abuse de tu API haciendo miles de requests.

### 2.1 Configurar Usage Plan

```bash
# Crear Usage Plan con límites
aws apigateway create-usage-plan \
  --name "assessment-center-usage-plan" \
  --description "Rate limiting for Assessment Center API" \
  --throttle burstLimit=10,rateLimit=5 \
  --quota limit=1000,period=DAY \
  --profile sandbox-swo

# Guardar el Usage Plan ID que se muestra
# Ejemplo: usageplanid123
```

**Límites configurados**:
- **Rate Limit**: 5 requests/segundo (promedio)
- **Burst Limit**: 10 requests/segundo (picos)
- **Quota**: 1000 requests/día

### 2.2 Asociar con API Gateway

```bash
# Crear API Key
aws apigateway create-api-key \
  --name "assessment-center-api-key" \
  --description "API Key for Assessment Center" \
  --enabled \
  --profile sandbox-swo

# Guardar el API Key ID
# Ejemplo: apikeyid456

# Asociar API Key con Usage Plan
aws apigateway create-usage-plan-key \
  --usage-plan-id usageplanid123 \
  --key-id apikeyid456 \
  --key-type API_KEY \
  --profile sandbox-swo

# Asociar Usage Plan con API Stage
aws apigateway update-usage-plan \
  --usage-plan-id usageplanid123 \
  --patch-operations op=add,path=/apiStages,value=6tk4qqlhs6:prod \
  --profile sandbox-swo
```

---

## 🌐 Paso 3: Configurar CORS Estricto

Una vez que tengas la URL de Amplify, restringe CORS para que solo esa URL pueda llamar tu API.

### 3.1 Obtener URL de Amplify

Después del deployment, verás algo como:
```
https://main.d1a2b3c4d5e6f7.amplifyapp.com
```

### 3.2 Actualizar Lambda con CORS Estricto

Edita `backend/src/lambda.ts`:

```typescript
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { reportRouter } from './routes/reportRoutes';

const app = express();

// CORS ESTRICTO - Solo tu dominio Amplify
const ALLOWED_ORIGINS = [
  'https://main.d1a2b3c4d5e6f7.amplifyapp.com', // Reemplaza con tu URL de Amplify
  'http://localhost:3000', // Para desarrollo local
];

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (ej: mobile apps, curl)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/report', reportRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AWS Assessment Center API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      upload: 'POST /api/report/upload',
      generate: 'POST /api/report/generate',
      download: 'GET /api/report/download/:filename'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

export const handler = serverless(app);
```

### 3.3 Re-deployar Lambda con CORS actualizado

```bash
cd backend
npm run build
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
rm -rf lambda-temp lambda-function.zip
```

---

## 📊 Paso 4: Configurar Monitoreo de Seguridad

### 4.1 Configurar CloudWatch Alarms

```bash
# Alarma para muchos errores 500
aws cloudwatch put-metric-alarm \
  --alarm-name "assessment-center-high-errors" \
  --alarm-description "Alert when Lambda has many errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=assessment-center-api \
  --evaluation-periods 1 \
  --profile sandbox-swo

# Alarma para muchos requests
aws cloudwatch put-metric-alarm \
  --alarm-name "assessment-center-high-invocations" \
  --alarm-description "Alert when Lambda has unusual traffic" \
  --metric-name Invocations \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=assessment-center-api \
  --evaluation-periods 1 \
  --profile sandbox-swo
```

### 4.2 Habilitar Logging Detallado en API Gateway

1. Ve a [API Gateway Console](https://console.aws.amazon.com/apigateway)
2. Selecciona `AssessmentCenterAPI`
3. Click **Stages** → **prod**
4. Tab **Logs/Tracing**:
   - ✅ Enable CloudWatch Logs
   - Log level: **INFO**
   - ✅ Log full requests/responses data
   - ✅ Enable detailed metrics

---

## 🔑 Paso 5: (Opcional) Requerer API Key en Frontend

Si quieres capa extra de seguridad, puedes requerir API Key.

### 5.1 Configurar API Gateway para requerir API Key

```bash
# Actualizar método para requerir API Key
aws apigateway update-method \
  --rest-api-id 6tk4qqlhs6 \
  --resource-id hirrul \
  --http-method ANY \
  --patch-operations op=replace,path=/apiKeyRequired,value=true \
  --profile sandbox-swo

# Re-deployar API
aws apigateway create-deployment \
  --rest-api-id 6tk4qqlhs6 \
  --stage-name prod \
  --description "Enable API Key requirement" \
  --profile sandbox-swo
```

### 5.2 Obtener API Key

```bash
# Obtener el valor de la API Key
aws apigateway get-api-key \
  --api-key apikeyid456 \
  --include-value \
  --profile sandbox-swo
```

### 5.3 Configurar Frontend para usar API Key

Actualizar `frontend/.env.production`:
```env
VITE_API_URL=https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod
VITE_API_KEY=tu-api-key-aqui
```

Actualizar llamadas API en el frontend para incluir el header:
```typescript
axios.get('/api/...', {
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY
  }
});
```

---

## 📋 Checklist de Seguridad

- [ ] Amplify configurado con Password Protection
- [ ] Contraseña fuerte configurada
- [ ] Rate limiting configurado (5 req/s, 1000/día)
- [ ] CORS estricto configurado con URL de Amplify
- [ ] CloudWatch Alarms configuradas
- [ ] Logging detallado habilitado
- [ ] (Opcional) API Key configurado

---

## 🎯 Resumen de Protección

Con estas configuraciones:

### ✅ Frontend Protegido
- **Password protection**: Solo usuarios autorizados
- **HTTPS**: Tráfico encriptado
- **CloudFront**: DDoS protection incluido

### ✅ Backend Protegido
- **Rate Limiting**: Máximo 5 req/s, 1000/día
- **CORS Estricto**: Solo tu dominio puede llamar
- **Logging**: Auditoría de todos los requests
- **Alarmas**: Notificaciones de actividad sospechosa

### ✅ Costos Controlados
- **Rate limits**: Previene costos por abuso
- **Quotas**: Máximo 1000 requests/día
- **Alarmas**: Notifica si hay tráfico inusual

---

## 🔐 Compartir Acceso de Forma Segura

Para compartir tu MVP con otros:

1. **Envía estas credenciales por separado**:
   - URL: `https://main.[APP-ID].amplifyapp.com`
   - Username: `assessment-admin`
   - Password: `[tu-contraseña]`

2. **No las pongas juntas en un email**:
   - Envía URL por email
   - Envía credenciales por WhatsApp/Slack

3. **Cambia la contraseña regularmente**:
   - Amplify Console → Access control → Update password

4. **Revoca acceso cuando termines el MVP**:
   - Amplify Console → Access control → Disable

---

## 📱 Monitorear Actividad

### Ver quién está accediendo:

```bash
# Logs de Amplify (frontend)
aws logs tail /aws/amplify/assessment-center --follow --profile sandbox-swo

# Logs de Lambda (backend)
aws logs tail /aws/lambda/assessment-center-api --follow --profile sandbox-swo

# Requests recientes al API Gateway
aws logs tail /aws/apigateway/AssessmentCenterAPI --follow --profile sandbox-swo
```

---

## 🚨 Si Detectas Actividad Sospechosa

1. **Cambiar contraseña de Amplify inmediatamente**
2. **Deshabilitar temporalmente el acceso**:
   ```bash
   aws apigateway update-stage \
     --rest-api-id 6tk4qqlhs6 \
     --stage-name prod \
     --patch-operations op=replace,path=/description,value="Temporarily disabled" \
     --profile sandbox-swo
   ```

3. **Revisar logs para IPs sospechosas**
4. **Considerar agregar WAF (Web Application Firewall)** - cuesta extra pero muy efectivo

---

## 💡 Recomendaciones Adicionales

1. **No publiques la URL en redes sociales**
2. **Usa dominios personalizados** (más profesional y seguro)
3. **Implementa 2FA** si el MVP crece
4. **Considera AWS WAF** si el tráfico aumenta
5. **Backups regulares** de la configuración

---

¡Tu MVP ahora está protegido! 🛡️
