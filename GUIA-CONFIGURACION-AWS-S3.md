# 🔐 Guía de Configuración AWS S3

## Objetivo
Configurar las credenciales de AWS para permitir que el módulo de Descubrimiento Rápido pueda subir archivos a S3.

---

## 📋 Paso 1: Obtener tus Credenciales de AWS

### Opción A: Si ya tienes Access Key y Secret Key
Si ya tienes tus credenciales, pasa directamente al **Paso 2**.

### Opción B: Crear nuevas credenciales en AWS Console

1. **Inicia sesión en AWS Console**
   - Ve a: https://console.aws.amazon.com/

2. **Navega a IAM (Identity and Access Management)**
   - En el buscador superior, escribe "IAM"
   - Click en "IAM"

3. **Crea un nuevo usuario (si no tienes uno)**
   - Click en "Users" (Usuarios) en el menú lateral
   - Click en "Add users" (Agregar usuarios)
   - Nombre: `assessment-center-app`
   - Tipo de acceso: Selecciona "Access key - Programmatic access"
   - Click "Next: Permissions"

4. **Asigna permisos de S3**
   - Selecciona "Attach existing policies directly"
   - Busca y selecciona: `AmazonS3FullAccess`
   - Click "Next: Tags" → "Next: Review" → "Create user"

5. **Guarda tus credenciales**
   - ⚠️ **IMPORTANTE**: Esta es la única vez que verás el Secret Access Key
   - Copia y guarda en un lugar seguro:
     - **Access Key ID**: `AKIA...`
     - **Secret Access Key**: `wJalr...`

---

## 📋 Paso 2: Crear el Bucket de S3

1. **Navega a S3**
   - En AWS Console, busca "S3"
   - Click en "S3"

2. **Crea un nuevo bucket**
   - Click en "Create bucket"
   - **Nombre del bucket**: `assessment-center-files-[tu-nombre]`
     - Ejemplo: `assessment-center-files-softwareone`
     - ⚠️ El nombre debe ser único globalmente
   - **Región**: Selecciona tu región preferida (ej: `us-east-1`)
   - **Block Public Access**: Deja todas las opciones marcadas (seguridad)
   - Click "Create bucket"

3. **Configura CORS (opcional, para acceso desde navegador)**
   - Click en tu bucket
   - Ve a la pestaña "Permissions"
   - Scroll hasta "Cross-origin resource sharing (CORS)"
   - Click "Edit" y pega:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["http://localhost:3005", "http://localhost:3000"],
       "ExposeHeaders": []
     }
   ]
   ```
   - Click "Save changes"

---

## 📋 Paso 3: Configurar las Variables de Entorno

### 3.1 Crear archivo `.env` en el backend

1. **Navega a la carpeta backend**
   ```bash
   cd backend
   ```

2. **Crea el archivo `.env`** (si no existe)
   ```bash
   # En Windows (PowerShell)
   New-Item -Path .env -ItemType File
   
   # O simplemente crea el archivo manualmente
   ```

3. **Edita el archivo `.env`** y agrega:
   ```env
   # Local Development
   NODE_ENV=development
   PORT=4000

   # AWS Configuration
   AWS_REGION=us-east-1
   S3_BUCKET_NAME=assessment-center-files-[tu-nombre]
   AWS_ACCESS_KEY_ID=AKIA...tu-access-key...
   AWS_SECRET_ACCESS_KEY=wJalr...tu-secret-key...
   ```

4. **Reemplaza los valores**:
   - `AWS_REGION`: La región donde creaste el bucket (ej: `us-east-1`)
   - `S3_BUCKET_NAME`: El nombre exacto de tu bucket
   - `AWS_ACCESS_KEY_ID`: Tu Access Key ID de AWS
   - `AWS_SECRET_ACCESS_KEY`: Tu Secret Access Key de AWS

### 3.2 Ejemplo de archivo `.env` completo

```env
# Local Development
NODE_ENV=development
PORT=4000

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=assessment-center-files-softwareone
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## 📋 Paso 4: Verificar la Configuración

### 4.1 Instalar dependencias (si no lo has hecho)

```bash
cd backend
npm install
```

### 4.2 Reiniciar el servidor backend

```bash
# Detén el servidor actual (Ctrl+C)

# Inicia el servidor nuevamente
npm start
```

### 4.3 Verificar que las variables se cargaron

El servidor debería mostrar en la consola:
```
🚀 Server running on port 4000
✅ AWS S3 configurado: assessment-center-files-softwareone (us-east-1)
```

---

## 📋 Paso 5: Probar la Subida de Archivos

1. **Abre la aplicación**
   - Frontend: http://localhost:3005
   - Ve al módulo "Assess" → "Rapid Discovery"

2. **Sube un archivo Excel**
   - Click en "Upload Excel File"
   - Selecciona un archivo MPA
   - Click "Upload"

3. **Verifica el resultado**
   - ✅ Si funciona: Verás "File uploaded successfully"
   - ❌ Si falla: Revisa los logs del backend

---

## 🐛 Solución de Problemas

### Error: "Access Denied"

**Causa**: Las credenciales no tienen permisos suficientes

**Solución**:
1. Ve a IAM en AWS Console
2. Encuentra tu usuario
3. Verifica que tenga la política `AmazonS3FullAccess`
4. Si no, agrégala:
   - Click en el usuario
   - "Add permissions" → "Attach existing policies directly"
   - Busca y selecciona `AmazonS3FullAccess`

### Error: "Bucket does not exist"

**Causa**: El nombre del bucket en `.env` no coincide con el bucket real

**Solución**:
1. Ve a S3 en AWS Console
2. Copia el nombre exacto del bucket
3. Actualiza `S3_BUCKET_NAME` en `.env`
4. Reinicia el servidor backend

### Error: "Invalid credentials"

**Causa**: Access Key o Secret Key incorrectos

**Solución**:
1. Verifica que copiaste correctamente las credenciales
2. No debe haber espacios al inicio o final
3. Si perdiste el Secret Key, debes crear nuevas credenciales:
   - IAM → Users → Tu usuario → Security credentials
   - "Create access key"
   - Guarda las nuevas credenciales
   - Actualiza `.env`

### Error: "Region not found"

**Causa**: La región especificada no existe o está mal escrita

**Solución**:
1. Verifica que la región sea válida:
   - `us-east-1` (Virginia del Norte)
   - `us-west-2` (Oregón)
   - `eu-west-1` (Irlanda)
   - etc.
2. Debe coincidir con la región donde creaste el bucket

### El archivo `.env` no se está leyendo

**Causa**: El archivo no está en la ubicación correcta

**Solución**:
1. Verifica que `.env` esté en la carpeta `backend/`
2. Estructura correcta:
   ```
   backend/
   ├── .env          ← Aquí debe estar
   ├── src/
   ├── package.json
   └── ...
   ```

---

## 🔒 Seguridad

### ⚠️ IMPORTANTE: Protege tus Credenciales

1. **NUNCA subas el archivo `.env` a Git**
   - Ya está en `.gitignore`
   - Verifica: `git status` no debe mostrar `.env`

2. **No compartas tus credenciales**
   - No las envíes por email, Slack, etc.
   - No las pegues en código fuente

3. **Rota tus credenciales periódicamente**
   - Cada 90 días, crea nuevas credenciales
   - Elimina las antiguas en IAM

4. **Usa permisos mínimos**
   - En producción, usa políticas más restrictivas
   - Solo permisos necesarios para tu bucket específico

---

## 📝 Checklist de Configuración

- [ ] Tengo mis credenciales de AWS (Access Key + Secret Key)
- [ ] Creé un bucket de S3 con nombre único
- [ ] Creé el archivo `backend/.env`
- [ ] Agregué todas las variables de entorno necesarias
- [ ] Reinicié el servidor backend
- [ ] Probé subir un archivo y funcionó
- [ ] Verifiqué que `.env` está en `.gitignore`

---

## 🎉 ¡Configuración Completada!

Si completaste todos los pasos, tu aplicación ahora puede:
- ✅ Subir archivos Excel a S3
- ✅ Generar URLs firmadas para descarga
- ✅ Eliminar archivos cuando sea necesario
- ✅ Almacenar archivos de forma segura en AWS

---

## 📞 Soporte Adicional

Si sigues teniendo problemas:

1. **Revisa los logs del backend**
   ```bash
   # En la terminal donde corre el backend
   # Busca mensajes de error relacionados con AWS/S3
   ```

2. **Verifica las credenciales en AWS Console**
   - IAM → Users → Tu usuario → Security credentials
   - Verifica que las Access Keys estén "Active"

3. **Prueba las credenciales con AWS CLI** (opcional)
   ```bash
   aws configure
   aws s3 ls s3://tu-bucket-name
   ```

---

**Última actualización**: 2026-02-25
