# 🚀 Guía Rápida: Solución Error de Upload

## ✅ Estado Actual

Tu configuración de AWS está **PERFECTA**:
- ✅ Credenciales de AWS CLI configuradas
- ✅ Bucket S3 accesible
- ✅ Permisos correctos
- ✅ URLs pre-firmadas funcionando

## 🔧 Problema

El servidor backend necesita reiniciarse para cargar los cambios en los controladores.

## 📋 Solución en 3 Pasos

### Paso 1: Reiniciar el Servidor Backend

**Opción A - Usando el script (RECOMENDADO):**
```bash
REINICIAR-SERVIDOR.bat
```

**Opción B - Manualmente:**
```bash
# Detener cualquier proceso de Node
taskkill /F /IM node.exe

# Ir a la carpeta backend
cd backend

# Iniciar el servidor
npm start
```

### Paso 2: Verificar que el Servidor Esté Funcionando

Ejecuta el script de verificación:
```bash
node verificar-servidor-funcionando.js
```

Deberías ver:
```
✅ Servidor backend está corriendo
✅ Endpoint funcionando correctamente
🎉 ¡SERVIDOR FUNCIONANDO CORRECTAMENTE!
```

### Paso 3: Probar la Subida de Archivo

1. Abre tu navegador en: **http://localhost:3005**
2. Ve a **Assess** → **Rapid Discovery**
3. Sube tu archivo Excel MPA
4. ✅ Debería funcionar sin errores

---

## 📊 Logs Esperados en el Servidor

Cuando el servidor inicie correctamente, deberías ver:

```
🔑 [UploadController] Using AWS credentials from profile: default
📦 [UploadController] S3 Configuration:
   Region: us-east-1
   Bucket: assessment-center-files-assessment-dashboard
   Profile: default

🔑 [ReportController] Using AWS credentials from profile: default
📦 [ReportController] S3 Configuration:
   Region: us-east-1
   Bucket: assessment-center-files-assessment-dashboard
   Profile: default

🔑 Using AWS credentials from profile: default
📦 S3 Configuration:
   Region: us-east-1
   Bucket: assessment-center-files-assessment-dashboard
   Profile: default

🚀 Server running on port 4000
```

---

## 🧪 Cuando Subas un Archivo

### En el Frontend (Consola del Navegador)

```
📡 API Request: POST /api/report/get-upload-url
✅ API Response: 200 /api/report/get-upload-url
📡 API Request: POST /api/report/upload-from-s3
✅ API Response: 200 /api/report/upload-from-s3
✅ AWS MPA cargado: 45 servidores, 12 bases de datos, 150 conexiones, 5 olas de migración calculadas
```

### En el Backend (Consola del Servidor)

```
[PRESIGNED] Generated URL for key: uploads/abc123.xlsx
[UPLOAD-S3] Start - Request received
[UPLOAD-S3] Fetching file from S3: uploads/abc123.xlsx
[UPLOAD-S3] File downloaded - Size: 1234567 bytes
[UPLOAD-S3] Starting Excel parse...
[UPLOAD-S3] Excel parsed in 234ms
[UPLOAD-S3] Parsing dependencies from Server Communication...
[UPLOAD-S3] Calculating migration waves...
🌊 Calculadas 5 olas de migración para 45 servidores
[UPLOAD-S3] ✅ 5 olas calculadas para 45 servidores
[UPLOAD-S3] Success - Total time: 1234ms
```

---

## 🐛 Si Aún Hay Problemas

### Error: "ECONNREFUSED"
```bash
# El servidor no está corriendo
REINICIAR-SERVIDOR.bat
```

### Error: "500 Internal Server Error"
```bash
# Verificar logs del servidor
# Buscar mensajes de error en la consola del backend
```

### Error: "Access Denied"
```bash
# Verificar credenciales
aws configure list

# Verificar bucket
node backend/listar-buckets-s3.js
```

---

## 📁 Scripts de Ayuda Disponibles

1. **`REINICIAR-SERVIDOR.bat`** - Reinicia el servidor backend limpiamente
2. **`diagnostico-upload-s3.js`** - Verifica configuración de AWS S3
3. **`verificar-servidor-funcionando.js`** - Verifica que el servidor esté corriendo
4. **`backend/verificar-aws-config.js`** - Verifica configuración de AWS
5. **`backend/listar-buckets-s3.js`** - Lista buckets disponibles

---

## ✅ Checklist Final

Antes de subir un archivo, verifica:

- [ ] Servidor backend corriendo (puerto 4000)
- [ ] Frontend corriendo (puerto 3005)
- [ ] Logs de AWS credentials visibles en el servidor
- [ ] Script de verificación pasó todos los tests
- [ ] Navegador abierto en http://localhost:3005

---

## 🎯 Resumen

1. **Ejecuta**: `REINICIAR-SERVIDOR.bat`
2. **Verifica**: `node verificar-servidor-funcionando.js`
3. **Prueba**: Sube un archivo en Rapid Discovery

**¡Listo!** El sistema debería funcionar perfectamente.

---

**Última actualización**: 2026-02-26
**Configuración verificada**: ✅ Todas las pruebas pasaron
