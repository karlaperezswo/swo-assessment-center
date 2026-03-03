# ✅ Configuración de AWS Bedrock - Resumen

## 📁 Archivos Creados

1. **`aws/lambda-bedrock-policy.json`** - Política IAM para permisos de Bedrock
2. **`aws/README-BEDROCK-SETUP.md`** - Guía completa de configuración
3. **`backend/.env.example`** - Actualizado con variables de Bedrock

---

## 🎯 Próximos Pasos para Desarrollo Local

### Paso 1: Agregar permisos de Bedrock a tu usuario IAM

**Opción A: AWS Console (Recomendado)**

1. Ir a https://console.aws.amazon.com/iam/
2. Users → Seleccionar tu usuario `karla`
3. Add permissions → Attach policies directly
4. Create policy → JSON
5. Copiar el contenido de `aws/lambda-bedrock-policy.json`
6. Crear política con nombre: `BedrockDevelopmentAccess`
7. Adjuntar la política a tu usuario

**Opción B: AWS CLI**

```bash
# Crear la política
aws iam create-policy \
  --policy-name BedrockDevelopmentAccess \
  --policy-document file://aws/lambda-bedrock-policy.json

# Adjuntar a tu usuario (reemplaza con tu Account ID)
aws iam attach-user-policy \
  --user-name karla \
  --policy-arn arn:aws:iam::212268884430:policy/BedrockDevelopmentAccess
```

### Paso 2: Verificar que funciona

```bash
# Test 1: Listar modelos de Bedrock
aws bedrock list-foundation-models --region us-east-1

# Test 2: Invocar el modelo
aws bedrock-runtime invoke-model \
  --model-id us.anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --region us-east-1 \
  output.json
```

### Paso 3: Reiniciar el backend

```bash
# Detener el backend actual (Ctrl+C)
# Reiniciar con:
cd backend
npm run dev
```

### Paso 4: Probar el endpoint de análisis

Ahora deberías poder usar la funcionalidad de análisis de oportunidades sin errores 500.

---

## 🚀 Próximos Pasos para Producción

### Paso 1: Agregar permisos de Bedrock al IAM Role de Lambda

```bash
# Obtener el nombre del rol
ROLE_NAME=$(aws lambda get-function --function-name assessment-center-api --query 'Configuration.Role' --output text | awk -F'/' '{print $NF}')

# Adjuntar la política
aws iam put-role-policy \
  --role-name $ROLE_NAME \
  --policy-name BedrockAccess \
  --policy-document file://aws/lambda-bedrock-policy.json
```

### Paso 2: Verificar en producción

Después de agregar los permisos, la Lambda podrá usar Bedrock automáticamente.

---

## 🔐 Seguridad - Confirmación

### ✅ Buenas Prácticas Implementadas

- **Desarrollo Local:**
  - Usa tu perfil de AWS CLI (`~/.aws/credentials`)
  - Tus credenciales NUNCA se suben al código
  - Solo tú tienes acceso con tu usuario IAM

- **Producción (Lambda):**
  - Usa IAM Role automáticamente
  - NO necesita credenciales hardcodeadas
  - Los permisos están en el IAM Role, NO en el código

### ❌ Lo que NO se hizo (correcto)

- NO se agregaron credenciales al código
- NO se modificó el código de la aplicación
- NO se crearon recursos en AWS automáticamente
- NO se expusieron secretos

---

## 📚 Documentación Adicional

Para más detalles, ver: `aws/README-BEDROCK-SETUP.md`

---

## ❓ Troubleshooting

### Si sigues viendo error 500:

1. Verificar que agregaste los permisos a tu usuario IAM
2. Verificar que reiniciaste el backend después de agregar permisos
3. Ver los logs del backend para el error específico
4. Ejecutar los comandos de verificación arriba

### Si necesitas ayuda:

Consulta la guía completa en `aws/README-BEDROCK-SETUP.md`
