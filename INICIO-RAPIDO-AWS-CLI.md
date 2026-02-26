# 🚀 Inicio Rápido - Usar AWS CLI Profile

Ya tienes configurado `aws configure`, así que solo necesitas 3 pasos:

---

## ✅ Paso 1: Listar tus Buckets de S3

```bash
cd backend
node listar-buckets-s3.js
```

Esto te mostrará todos los buckets disponibles en tu cuenta AWS.

---

## ✅ Paso 2: Configurar el Nombre del Bucket

1. Abre el archivo `backend/.env`
2. Actualiza la línea `S3_BUCKET_NAME` con el nombre de tu bucket:

```env
S3_BUCKET_NAME=nombre-de-tu-bucket
```

**Ejemplo**:
```env
S3_BUCKET_NAME=assessment-center-files-prod
```

---

## ✅ Paso 3: Verificar y Reiniciar

```bash
# Verificar configuración
node verificar-aws-config.js

# Si todo está OK, reinicia el servidor
npm start
```

---

## 🎯 ¡Listo!

El sistema ahora usará automáticamente las credenciales de tu perfil AWS CLI.

Deberías ver en la consola:
```
🔑 Using AWS credentials from profile: default
📦 S3 Configuration:
   Region: us-east-1
   Bucket: tu-bucket-name
   Profile: default
```

---

## 🧪 Probar

1. Abre http://localhost:3005
2. Ve a **Assess** → **Rapid Discovery**
3. Sube un archivo Excel
4. ✅ Debería funcionar sin errores

---

## 🐛 Si hay problemas

### "No buckets found"
```bash
# Verifica que aws configure esté correcto
aws s3 ls

# Si no funciona, reconfigura
aws configure
```

### "Bucket not found"
- Verifica que el nombre en `.env` sea exacto
- O crea un nuevo bucket en AWS Console

### "Access Denied"
- Tu usuario IAM necesita permisos de S3
- Agrega la política `AmazonS3FullAccess` en IAM

---

**¡Eso es todo!** 🎉
