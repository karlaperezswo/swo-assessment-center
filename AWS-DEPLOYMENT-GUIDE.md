# Guía Completa de Deployment en AWS (Serverless - Más Rentable)

## Costo Estimado: $5-15/mes

Esta guía te muestra cómo deployar tu aplicación en AWS de la forma **más rentable posible** usando arquitectura serverless.

---

## Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIOS                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
         ┌──────────────────────────────────────┐
         │   AWS Amplify Hosting + CloudFront   │
         │         (Frontend React)              │
         └──────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
         ┌──────────────────────────────────────┐
         │        API Gateway (REST API)        │
         └──────────────────────────────────────┘
                              │
                              ▼
         ┌──────────────────────────────────────┐
         │      AWS Lambda Functions            │
         │  - Upload Excel Handler              │
         │  - Generate Report Handler           │
         │  - Download Handler                  │
         └──────────────────────────────────────┘
                              │
                              ▼
         ┌──────────────────────────────────────┐
         │       Amazon S3 Bucket               │
         │  - Uploaded Excel files              │
         │  - Generated Word documents          │
         └──────────────────────────────────────┘
```

---

## Pre-requisitos

1. **Cuenta AWS** (Free Tier incluye mucho de lo que necesitas)
   - [Crear cuenta AWS](https://aws.amazon.com/free/)

2. **AWS CLI instalado**
   ```powershell
   # Instalar AWS CLI en Windows
   winget install Amazon.AWSCLI

   # O descargar desde:
   # https://awscli.amazonaws.com/AWSCLIV2.msi
   ```

3. **Configurar AWS CLI**
   ```powershell
   aws configure
   # AWS Access Key ID: [tu-access-key]
   # AWS Secret Access Key: [tu-secret-key]
   # Default region: us-east-1
   # Default output format: json
   ```

4. **Node.js y npm** (ya lo tienes)

5. **Git** (para Amplify)

---

## PASO 1: Preparar el Código para AWS

### 1.1 Modificar Backend para Lambda

Necesitamos adaptar el backend Express para que funcione en Lambda usando `serverless-http`.

**Instalar dependencias:**
```powershell
cd backend
npm install serverless-http aws-sdk @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

**Crear nuevo archivo `backend/src/lambda.ts`:**
```typescript
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import { reportRouter } from './routes/reportRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/report', reportRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Export handler for Lambda
export const handler = serverless(app);
```

**Modificar servicios para usar S3 en lugar de filesystem local:**

Crear `backend/src/services/s3Service.ts`:
```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'assessment-center-files';

export class S3Service {
  // Upload file to S3
  static async uploadFile(key: string, body: Buffer, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType
    });

    await s3Client.send(command);
    return key;
  }

  // Get signed URL for download
  static async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    return getSignedUrl(s3Client, command, { expiresIn });
  }

  // Delete file from S3
  static async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    await s3Client.send(command);
  }

  // Get file from S3
  static async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key
    });

    const response = await s3Client.send(command);
    const stream = response.Body as any;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
```

### 1.2 Actualizar package.json del backend

```json
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "build:lambda": "tsc && zip -r function.zip dist node_modules",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.490.0",
    "@aws-sdk/s3-request-presigner": "^3.490.0",
    "aws-sdk": "^2.1500.0",
    "cors": "^2.8.5",
    "docx": "^8.5.0",
    "dotenv": "^16.3.0",
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "serverless-http": "^3.2.0",
    "uuid": "^9.0.1",
    "xlsx": "^0.18.5",
    "zod": "^3.22.4"
  }
}
```

### 1.3 Configurar Frontend para Amplify

**Crear `frontend/amplify.yml`:**
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

**Actualizar variables de entorno del frontend:**

Crear `frontend/.env.production`:
```env
VITE_API_URL=https://[TU-API-GATEWAY-ID].execute-api.us-east-1.amazonaws.com/prod
```

---

## PASO 2: Crear Bucket S3

```powershell
# Crear bucket S3 para archivos
aws s3 mb s3://assessment-center-files-[TU-NOMBRE-UNICO]

# Configurar lifecycle para auto-eliminar archivos después de 24 horas
aws s3api put-bucket-lifecycle-configuration --bucket assessment-center-files-[TU-NOMBRE-UNICO] --lifecycle-configuration file://s3-lifecycle.json
```

**Crear archivo `s3-lifecycle.json`:**
```json
{
  "Rules": [
    {
      "Id": "DeleteOldFiles",
      "Status": "Enabled",
      "Prefix": "",
      "Expiration": {
        "Days": 1
      }
    }
  ]
}
```

---

## PASO 3: Deployar Backend en Lambda

### 3.1 Crear rol IAM para Lambda

```powershell
# Crear rol
aws iam create-role --role-name AssessmentCenterLambdaRole --assume-role-policy-document file://lambda-trust-policy.json

# Adjuntar políticas
aws iam attach-role-policy --role-name AssessmentCenterLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam attach-role-policy --role-name AssessmentCenterLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

**Crear `lambda-trust-policy.json`:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### 3.2 Buildear y crear Lambda Function

```powershell
cd backend

# Build
npm run build

# Crear ZIP (incluye node_modules - puede ser grande, considera usar Lambda Layers)
powershell Compress-Archive -Path dist\*,node_modules -DestinationPath function.zip -Force

# Crear Lambda Function
aws lambda create-function `
  --function-name AssessmentCenterAPI `
  --runtime nodejs20.x `
  --role arn:aws:iam::[TU-ACCOUNT-ID]:role/AssessmentCenterLambdaRole `
  --handler dist/lambda.handler `
  --zip-file fileb://function.zip `
  --timeout 300 `
  --memory-size 1024 `
  --environment "Variables={S3_BUCKET_NAME=assessment-center-files-[TU-NOMBRE],AWS_REGION=us-east-1}"
```

**NOTA**: El archivo ZIP puede ser muy grande (>50MB). Si es así, necesitas usar S3:

```powershell
# Subir ZIP a S3
aws s3 cp function.zip s3://assessment-center-files-[TU-NOMBRE]/lambda/function.zip

# Crear función desde S3
aws lambda create-function `
  --function-name AssessmentCenterAPI `
  --runtime nodejs20.x `
  --role arn:aws:iam::[TU-ACCOUNT-ID]:role/AssessmentCenterLambdaRole `
  --handler dist/lambda.handler `
  --code S3Bucket=assessment-center-files-[TU-NOMBRE],S3Key=lambda/function.zip `
  --timeout 300 `
  --memory-size 1024 `
  --environment "Variables={S3_BUCKET_NAME=assessment-center-files-[TU-NOMBRE],AWS_REGION=us-east-1}"
```

---

## PASO 4: Crear API Gateway

### 4.1 Crear REST API

```powershell
# Crear API
aws apigateway create-rest-api --name "AssessmentCenterAPI" --description "API for Assessment Center"

# Guardar el API ID que se muestra (lo necesitarás)
# Ejemplo: abc123def4
```

### 4.2 Configurar API Gateway con Lambda

Esto es complejo en CLI. **Opción más fácil: Usar la Consola AWS**

1. Ve a **AWS Console** → **API Gateway**
2. Selecciona tu API "AssessmentCenterAPI"
3. Click **Actions** → **Create Resource**
   - Resource Name: `{proxy+}`
   - Enable CORS: ✓
4. Click **Actions** → **Create Method** → **ANY**
   - Integration type: Lambda Function
   - Use Lambda Proxy integration: ✓
   - Lambda Function: AssessmentCenterAPI
   - Save
5. Click **Actions** → **Deploy API**
   - Stage: `prod`
   - Deploy

**Tu API URL será:**
```
https://[API-ID].execute-api.us-east-1.amazonaws.com/prod
```

---

## PASO 5: Deployar Frontend en Amplify

### 5.1 Conectar repositorio Git

**Opción A: Desde la Consola AWS (MÁS FÁCIL)**

1. Ve a **AWS Console** → **AWS Amplify**
2. Click **Get Started** (bajo "Amplify Hosting")
3. Conecta tu repositorio:
   - GitHub / GitLab / Bitbucket / CodeCommit
   - Autoriza AWS Amplify
4. Selecciona el repositorio y branch
5. **Build settings**:
   - App name: `assessment-center`
   - Environment: `production`
   - Build image: Amazon Linux 2023
   - Amplify detectará automáticamente `amplify.yml`
6. **Advanced settings** → Environment variables:
   ```
   VITE_API_URL = https://[TU-API-GATEWAY-ID].execute-api.us-east-1.amazonaws.com/prod
   ```
7. Click **Save and deploy**

**Opción B: Usando AWS CLI**

```powershell
# Crear app en Amplify
aws amplify create-app --name assessment-center --repository https://github.com/[TU-USUARIO]/assessment-center

# Crear branch
aws amplify create-branch --app-id [APP-ID] --branch-name main

# Iniciar build
aws amplify start-job --app-id [APP-ID] --branch-name main --job-type RELEASE
```

### 5.2 Configurar dominio personalizado (OPCIONAL)

1. En Amplify Console → **Domain management**
2. Add domain
3. Sigue las instrucciones para configurar DNS

---

## PASO 6: Verificar Deployment

### 6.1 Test Backend (Lambda + API Gateway)

```powershell
# Health check
curl https://[TU-API-ID].execute-api.us-east-1.amazonaws.com/prod/health
```

Deberías ver:
```json
{
  "status": "ok",
  "timestamp": "2024-01-30T..."
}
```

### 6.2 Test Frontend (Amplify)

1. Ve a tu URL de Amplify: `https://[BRANCH].[APP-ID].amplifyapp.com`
2. Prueba subir un archivo Excel
3. Genera un reporte

---

## PASO 7: Monitoreo y Optimización

### 7.1 Ver logs de Lambda

```powershell
# Ver logs recientes
aws logs tail /aws/lambda/AssessmentCenterAPI --follow
```

### 7.2 Configurar alertas de costos

1. **AWS Console** → **Billing** → **Budgets**
2. Create budget
3. Set threshold (ej: $20/mes)
4. Configure email alerts

### 7.3 Optimización de costos

**Lambda Layers** (para reducir tamaño de deployment):
```powershell
# Crear layer con node_modules
cd backend
mkdir nodejs
cp -r node_modules nodejs/
zip -r layer.zip nodejs

aws lambda publish-layer-version `
  --layer-name AssessmentCenterDependencies `
  --zip-file fileb://layer.zip `
  --compatible-runtimes nodejs20.x

# Actualizar función para usar layer
aws lambda update-function-configuration `
  --function-name AssessmentCenterAPI `
  --layers arn:aws:lambda:us-east-1:[ACCOUNT-ID]:layer:AssessmentCenterDependencies:1
```

---

## Resumen de Costos Mensuales

| Servicio | Estimación | Notas |
|----------|-----------|-------|
| **AWS Amplify** | $1-3 | Hosting + CDN + builds |
| **API Gateway** | $0-2 | $3.50/millón requests (Free Tier: 1M/mes) |
| **Lambda** | $0-5 | Free Tier: 1M requests + 400K GB-seg |
| **S3** | $1-3 | $0.023/GB + requests |
| **CloudWatch Logs** | $0-2 | First 5GB free |
| **TOTAL** | **$5-15/mes** | Con bajo-medio tráfico |

---

## Scripts Útiles

### Deploy automático del backend

Crear `backend/deploy-lambda.ps1`:
```powershell
# Build
npm run build

# Create ZIP
Compress-Archive -Path dist\*,node_modules -DestinationPath function.zip -Force

# Upload to S3
aws s3 cp function.zip s3://assessment-center-files-[TU-NOMBRE]/lambda/function.zip

# Update Lambda
aws lambda update-function-code `
  --function-name AssessmentCenterAPI `
  --s3-bucket assessment-center-files-[TU-NOMBRE] `
  --s3-key lambda/function.zip

Write-Host "Lambda function updated successfully!"
```

### Rollback rápido

```powershell
# Ver versiones anteriores
aws lambda list-versions-by-function --function-name AssessmentCenterAPI

# Rollback a versión anterior
aws lambda update-alias `
  --function-name AssessmentCenterAPI `
  --name prod `
  --function-version 3
```

---

## Próximos Pasos Recomendados

1. **CI/CD**: Configurar GitHub Actions para auto-deploy
2. **Custom Domain**: Agregar dominio personalizado en Amplify
3. **Monitoring**: Configurar CloudWatch Dashboards
4. **Security**: Implementar AWS WAF para protección
5. **Performance**: Configurar CloudFront cache settings
6. **Backup**: Configurar S3 versioning para archivos críticos

---

## Troubleshooting

### Lambda timeout
- Aumentar timeout: `aws lambda update-function-configuration --function-name AssessmentCenterAPI --timeout 900`
- Máximo: 15 minutos

### Lambda out of memory
- Aumentar memoria: `aws lambda update-function-configuration --function-name AssessmentCenterAPI --memory-size 2048`

### CORS errors
- Verificar que API Gateway tiene CORS habilitado
- Agregar headers en respuestas Lambda:
  ```typescript
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*'
    },
    body: JSON.stringify(data)
  };
  ```

### Amplify build fails
- Verificar variables de entorno en Amplify Console
- Revisar logs en Amplify Console → Build history

---

## Contacto y Soporte

Para problemas:
1. CloudWatch Logs para Lambda
2. Amplify Console para frontend builds
3. AWS Support (Basic plan incluido)
4. [AWS Forums](https://forums.aws.amazon.com/)

---

¡Listo! Con esta guía tendrás tu aplicación corriendo en AWS de forma **serverless y súper rentable** (~$5-15/mes). 🚀
