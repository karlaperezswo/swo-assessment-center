# Resumen: Cómo Desplegar tu Wiki a S3

## 📋 Archivos Creados para Ti

He creado los siguientes archivos para facilitar el despliegue:

1. **`deploy-to-s3.ps1`** - Script principal de despliegue (automático)
2. **`actualizar-s3.ps1`** - Script para actualizaciones rápidas
3. **`verificar-antes-despliegue.ps1`** - Verifica que todo esté listo
4. **`GUIA_DESPLIEGUE_S3.md`** - Guía completa y detallada
5. **`INICIO_RAPIDO_S3.md`** - Pasos rápidos (5 minutos)
6. **`NOMBRES_BUCKET_SUGERIDOS.txt`** - Ideas para nombres de bucket

## 🚀 Proceso Completo (3 Pasos)

### PASO 1: Preparación (Solo Primera Vez)

#### 1.1 Instalar AWS CLI

**Opción A - Descarga directa:**
- Ve a: https://awscli.amazonaws.com/AWSCLIV2.msi
- Descarga e instala

**Opción B - Usando winget:**
```powershell
winget install Amazon.AWSCLI
```

**Verificar instalación:**
```powershell
aws --version
```

#### 1.2 Configurar Credenciales AWS

Necesitas obtener tus credenciales AWS:
- Access Key ID
- Secret Access Key

Si no las tienes, pídelas a tu administrador AWS o créalas en:
AWS Console → IAM → Users → [Tu usuario] → Security credentials → Create access key

**Configurar:**
```powershell
aws configure
```

Ingresa cuando te pregunte:
- AWS Access Key ID: [pega tu access key]
- AWS Secret Access Key: [pega tu secret key]
- Default region name: us-east-1
- Default output format: json

### PASO 2: Verificar que Todo Esté Listo

```powershell
.\verificar-antes-despliegue.ps1
```

Este script verificará:
- ✓ AWS CLI instalado
- ✓ Credenciales configuradas
- ✓ Archivos del proyecto presentes
- ✓ Tamaño del proyecto

### PASO 3: Desplegar

```powershell
.\deploy-to-s3.ps1 -BucketName "wiki-map-assessment-tuempresa"
```

**IMPORTANTE:** Cambia `tuempresa` por un nombre único. Ver `NOMBRES_BUCKET_SUGERIDOS.txt` para ideas.

El script hará automáticamente:
1. ✓ Crear el bucket S3
2. ✓ Configurar hosting estático
3. ✓ Configurar acceso público
4. ✓ Subir todos los archivos
5. ✓ Configurar tipos de contenido correctos
6. ✓ Mostrarte la URL final

## 🌐 Acceder a tu Wiki

Después del despliegue, verás algo como:

```
========================================
  ¡Despliegue Completado!
========================================

Tu wiki está disponible en:
http://wiki-map-assessment-tuempresa.s3-website-us-east-1.amazonaws.com
```

**Copia esa URL y compártela con tu equipo.**

## 🔄 Actualizar Contenido

Cuando hagas cambios en tu wiki local:

```powershell
.\actualizar-s3.ps1 -BucketName "wiki-map-assessment-tuempresa"
```

Esto sincronizará los cambios en segundos.

## 💰 Costos

Para una wiki de este tamaño (~5-10 MB):
- **Almacenamiento:** ~$0.02/mes
- **Transferencia:** Primeros 100 GB gratis
- **Total estimado:** Menos de $1 USD/mes

## ❓ Solución de Problemas

### "Bucket name already exists"
→ El nombre ya está en uso. Prueba con otro nombre.

### "Access Denied" al configurar
→ Verifica tus credenciales:
```powershell
aws sts get-caller-identity
```

### El sitio no carga
→ Espera 1-2 minutos después del despliegue. S3 necesita tiempo para propagar.

### Imágenes no se ven
→ Verifica que se subieron:
```powershell
aws s3 ls s3://tu-bucket/assets/imagenes/
```

## 📞 Comandos Útiles

**Ver contenido del bucket:**
```powershell
aws s3 ls s3://tu-bucket --recursive
```

**Eliminar todo (si necesitas empezar de nuevo):**
```powershell
aws s3 rm s3://tu-bucket --recursive
aws s3 rb s3://tu-bucket
```

**Ver la URL de tu sitio:**
```powershell
aws s3api get-bucket-website --bucket tu-bucket
```

## 📚 Documentación Adicional

- **Guía completa:** Lee `GUIA_DESPLIEGUE_S3.md`
- **Inicio rápido:** Lee `INICIO_RAPIDO_S3.md`
- **Nombres de bucket:** Lee `NOMBRES_BUCKET_SUGERIDOS.txt`

## ✅ Checklist Final

Antes de tu presentación, verifica:

- [ ] AWS CLI instalado y configurado
- [ ] Credenciales AWS funcionando
- [ ] Nombre de bucket elegido (único)
- [ ] Script de despliegue ejecutado exitosamente
- [ ] URL del sitio funcionando
- [ ] Todas las páginas cargan correctamente
- [ ] Imágenes se muestran
- [ ] Menús desplegables funcionan
- [ ] URL compartida con tu equipo

## 🎯 Resumen Ultra-Rápido

```powershell
# 1. Instalar AWS CLI (si no lo tienes)
winget install Amazon.AWSCLI

# 2. Configurar credenciales
aws configure

# 3. Verificar
.\verificar-antes-despliegue.ps1

# 4. Desplegar
.\deploy-to-s3.ps1 -BucketName "wiki-map-assessment-2026"

# 5. Acceder a la URL que te muestra
```

---

**¡Listo para tu presentación!** 🎉

Tu wiki estará disponible 24/7 desde cualquier navegador, sin necesidad de tener tu computadora encendida.
