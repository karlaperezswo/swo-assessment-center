# AWS Bedrock Setup Guide

Este documento explica cómo configurar los permisos de AWS Bedrock para desarrollo local y producción.

## 🔐 Arquitectura de Seguridad

### Desarrollo Local
```
Tu Código → AWS SDK → Lee ~/.aws/credentials → Usa tu usuario IAM
```

### Producción (Lambda)
```
Tu Código → AWS SDK → Lambda detecta que está en AWS → Usa IAM Role automáticamente
```

**El código es EXACTAMENTE EL MISMO** - el SDK de AWS detecta automáticamente el entorno.

---

## 📋 Setup para Desarrollo Local

### Paso 1: Verificar tus credenciales de AWS

```bash
# Verificar que tu perfil de AWS CLI está configurado
aws configure list

# Verificar tu identidad
aws sts get-caller-identity
```

### Paso 2: Verificar acceso a Bedrock

```bash
# Intentar listar modelos de Bedrock
aws bedrock list-foundation-models --region us-east-1
```

Si este comando falla con un error de permisos, necesitas agregar permisos de Bedrock a tu usuario IAM.

### Paso 3: Agregar permisos de Bedrock a tu usuario IAM

**Opción A: Usando AWS Console**

1. Ir a [IAM Console](https://console.aws.amazon.com/iam/)
2. Ir a **Users** → Seleccionar tu usuario
3. Click en **Add permissions** → **Attach policies directly**
4. Click en **Create policy**
5. Seleccionar la pestaña **JSON**
6. Pegar el siguiente contenido:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    }
  ]
}
```

7. Click **Next**, darle un nombre (ej: `BedrockDevelopmentAccess`)
8. Click **Create policy**
9. Volver a tu usuario y adjuntar la política recién creada

**Opción B: Usando AWS CLI**

```bash
# Crear la política
aws iam create-policy \
  --policy-name BedrockDevelopmentAccess \
  --policy-document file://aws/lambda-bedrock-policy.json

# Adjuntar la política a tu usuario (reemplaza TU_USUARIO con tu nombre de usuario IAM)
aws iam attach-user-policy \
  --user-name TU_USUARIO \
  --policy-arn arn:aws:iam::TU_ACCOUNT_ID:policy/BedrockDevelopmentAccess
```

### Paso 4: Verificar que funciona

```bash
# Intentar invocar el modelo (esto debería funcionar ahora)
aws bedrock-runtime invoke-model \
  --model-id us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --region us-east-1 \
  output.json

# Ver la respuesta
cat output.json
```

---

## 🚀 Setup para Producción (Lambda)

### Paso 1: Verificar el IAM Role de Lambda

```bash
# Obtener el nombre del rol de Lambda
aws lambda get-function --function-name assessment-center-api --query 'Configuration.Role' --output text
```

### Paso 2: Agregar política de Bedrock al IAM Role

**Opción A: Usando AWS Console**

1. Ir a [IAM Console](https://console.aws.amazon.com/iam/)
2. Ir a **Roles** → Buscar el rol de tu Lambda (ej: `assessment-center-api-role`)
3. Click en **Add permissions** → **Attach policies**
4. Buscar y seleccionar la política que creaste anteriormente (`BedrockDevelopmentAccess`)
5. Click **Attach policies**

**Opción B: Usando AWS CLI**

```bash
# Obtener el nombre del rol (sin el ARN completo)
ROLE_NAME=$(aws lambda get-function --function-name assessment-center-api --query 'Configuration.Role' --output text | awk -F'/' '{print $NF}')

# Adjuntar la política inline al rol
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name BedrockAccess \
  --policy-document file://aws/lambda-bedrock-policy.json
```

### Paso 3: Verificar la configuración

```bash
# Listar las políticas del rol
aws iam list-attached-role-policies --role-name $ROLE_NAME

# Ver las políticas inline
aws iam list-role-policies --role-name $ROLE_NAME
```

### Paso 4: Probar en producción

Después de agregar los permisos, prueba el endpoint de análisis:

```bash
# Hacer una petición de prueba a tu API en producción
curl -X POST https://TU-API-ID.execute-api.us-east-1.amazonaws.com/prod/api/opportunities/analyze \
  -H "Content-Type: multipart/form-data" \
  -F "mpaFile=@test-mpa.xlsx" \
  -F "mraFile=@test-mra.pdf"
```

---

## 🔍 Troubleshooting

### Error: "AccessDeniedException" al llamar a Bedrock

**Causa:** Tu usuario IAM o el IAM Role de Lambda no tiene permisos de Bedrock.

**Solución:** Seguir los pasos de este documento para agregar los permisos.

### Error: "ModelNotFoundException"

**Causa:** El modelo especificado no existe o no está disponible en tu región.

**Solución:** Verificar que el modelo está disponible:

```bash
aws bedrock list-foundation-models --region us-east-1 | grep claude-3-5-sonnet
```

### Error: "ThrottlingException"

**Causa:** Has excedido el límite de peticiones por minuto.

**Solución:** 
- Esperar unos segundos y reintentar
- Implementar retry logic con backoff exponencial (ya implementado en `BedrockService.ts`)

### El backend local no puede conectarse a Bedrock

**Verificar:**

1. Credenciales configuradas:
```bash
aws configure list
```

2. Permisos de Bedrock:
```bash
aws bedrock list-foundation-models --region us-east-1
```

3. Variables de entorno en `backend/.env`:
```env
AWS_REGION=us-east-1
```

---

## 📚 Referencias

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

## 🔒 Buenas Prácticas de Seguridad

### ✅ DO (Hacer)

- Usar IAM Roles para Lambda en producción
- Usar perfiles de AWS CLI para desarrollo local
- Mantener credenciales en `~/.aws/credentials` (nunca en el código)
- Usar el principio de least privilege (solo los permisos necesarios)
- Rotar credenciales regularmente

### ❌ DON'T (No hacer)

- Hardcodear credenciales en el código
- Subir archivos `.env` con credenciales al repositorio
- Usar credenciales de producción en desarrollo local
- Dar permisos de administrador cuando no son necesarios
- Compartir credenciales entre desarrolladores

---

## 📝 Notas Adicionales

### Modelos de Bedrock disponibles

El proyecto está configurado para usar:
- **Modelo:** `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- **Región:** `us-east-1`

Si necesitas cambiar el modelo, actualiza la variable de entorno:

```env
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
```

### Costos de Bedrock

AWS Bedrock cobra por tokens procesados:
- **Input tokens:** ~$0.003 por 1K tokens
- **Output tokens:** ~$0.015 por 1K tokens

Monitorea el uso en [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home).
