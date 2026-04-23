# Inicio Rápido - Desplegar Wiki a S3

## Pasos Rápidos (5 minutos)

### 1. Verificar AWS CLI

```powershell
aws --version
```

Si no está instalado, descarga desde: https://awscli.amazonaws.com/AWSCLIV2.msi

### 2. Configurar Credenciales (solo primera vez)

```powershell
aws configure
```

Ingresa:
- Access Key ID
- Secret Access Key
- Region: `us-east-1`
- Output: `json`

### 3. Desplegar

```powershell
.\deploy-to-s3.ps1 -BucketName "wiki-map-assessment-tuempresa"
```

**Importante:** Cambia `tuempresa` por un nombre único.

### 4. Acceder

El script te mostrará la URL:
```
http://wiki-map-assessment-tuempresa.s3-website-us-east-1.amazonaws.com
```

## Actualizar Contenido

Después de hacer cambios:

```powershell
.\actualizar-s3.ps1 -BucketName "wiki-map-assessment-tuempresa"
```

## Nombres de Bucket Sugeridos

- `wiki-map-swo-2026`
- `map-assessment-wiki-[tu-nombre]`
- `swo-aws-map-wiki`
- `consultores-map-wiki`

## Problemas Comunes

**"Bucket name already exists"**
→ Prueba con otro nombre, debe ser único globalmente

**"Access Denied"**
→ Verifica tus credenciales: `aws sts get-caller-identity`

**Sitio no carga**
→ Espera 1-2 minutos después del despliegue

## Eliminar el Sitio

Si necesitas eliminar todo:

```powershell
# Eliminar contenido
aws s3 rm s3://nombre-bucket --recursive

# Eliminar bucket
aws s3 rb s3://nombre-bucket
```

---

¿Necesitas ayuda? Revisa `GUIA_DESPLIEGUE_S3.md` para instrucciones detalladas.
