# Guía para Desplegar la Wiki MAP Assessment en AWS S3

Esta guía te ayudará a publicar tu wiki en un bucket de S3 para que sea accesible desde cualquier navegador.

## Requisitos Previos

### 1. Instalar AWS CLI

Si no tienes AWS CLI instalado:

**Windows:**
```powershell
# Opción 1: Usando MSI Installer
# Descarga desde: https://awscli.amazonaws.com/AWSCLIV2.msi
# Ejecuta el instalador

# Opción 2: Usando winget
winget install Amazon.AWSCLI

# Opción 3: Usando Chocolatey
choco install awscli
```

**Verificar instalación:**
```powershell
aws --version
```

### 2. Configurar Credenciales AWS

Necesitas tener credenciales de AWS (Access Key ID y Secret Access Key).

**Configurar credenciales:**
```powershell
aws configure
```

Te pedirá:
- AWS Access Key ID: [Tu Access Key]
- AWS Secret Access Key: [Tu Secret Key]
- Default region name: us-east-1 (o tu región preferida)
- Default output format: json

**Verificar configuración:**
```powershell
aws sts get-caller-identity
```

## Opción 1: Despliegue Automático (Recomendado)

### Paso 1: Ejecutar el Script

Abre PowerShell en la carpeta de tu proyecto y ejecuta:

```powershell
# Sintaxis básica
.\deploy-to-s3.ps1 -BucketName "nombre-unico-de-tu-bucket"

# Con región específica
.\deploy-to-s3.ps1 -BucketName "wiki-map-assessment-2026" -Region "us-east-1"

# Con perfil específico de AWS
.\deploy-to-s3.ps1 -BucketName "wiki-map-assessment-2026" -Profile "mi-perfil"
```

**Importante:** El nombre del bucket debe ser único globalmente en AWS.

### Paso 2: Acceder a tu Wiki

Una vez completado el script, verás la URL de tu wiki:
```
http://nombre-de-tu-bucket.s3-website-us-east-1.amazonaws.com
```

## Opción 2: Despliegue Manual

Si prefieres hacerlo paso a paso:

### Paso 1: Crear el Bucket

```powershell
aws s3 mb s3://nombre-de-tu-bucket --region us-east-1
```

### Paso 2: Configurar Hosting Estático

```powershell
aws s3 website s3://nombre-de-tu-bucket --index-document index.html --error-document index.html
```

### Paso 3: Configurar Acceso Público

Crear archivo `bucket-policy.json`:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::nombre-de-tu-bucket/*"
        }
    ]
}
```

Aplicar política:
```powershell
aws s3api put-public-access-block --bucket nombre-de-tu-bucket --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy --bucket nombre-de-tu-bucket --policy file://bucket-policy.json
```

### Paso 4: Subir Archivos

```powershell
# Subir todos los archivos
aws s3 sync . s3://nombre-de-tu-bucket --exclude ".git/*" --exclude "node_modules/*" --exclude "*.ps1" --exclude "confluence-export/*"
```

### Paso 5: Configurar Content-Types

```powershell
# HTML
aws s3 sync . s3://nombre-de-tu-bucket --exclude "*" --include "*.html" --content-type "text/html"

# CSS
aws s3 sync . s3://nombre-de-tu-bucket --exclude "*" --include "*.css" --content-type "text/css"

# JavaScript
aws s3 sync . s3://nombre-de-tu-bucket --exclude "*" --include "*.js" --content-type "application/javascript"

# Imágenes
aws s3 sync assets s3://nombre-de-tu-bucket/assets --content-type "image/png"
```

## Actualizar el Sitio

Para actualizar el contenido después de hacer cambios:

```powershell
# Usando el script
.\deploy-to-s3.ps1 -BucketName "nombre-de-tu-bucket"

# O manualmente
aws s3 sync . s3://nombre-de-tu-bucket --delete
```

## Solución de Problemas

### Error: "Bucket name already exists"
El nombre del bucket debe ser único globalmente. Prueba con otro nombre.

### Error: "Access Denied"
Verifica que tus credenciales AWS tengan permisos para:
- s3:CreateBucket
- s3:PutObject
- s3:PutBucketPolicy
- s3:PutBucketWebsite

### El sitio no carga
1. Espera 1-2 minutos después del despliegue
2. Verifica que la política de bucket esté configurada correctamente
3. Asegúrate de usar la URL correcta: `http://bucket-name.s3-website-region.amazonaws.com`

### Imágenes no se muestran
Verifica que la carpeta `assets/imagenes` se haya subido correctamente:
```powershell
aws s3 ls s3://nombre-de-tu-bucket/assets/imagenes/
```

## URLs de Acceso

Dependiendo de la región, tu URL será:

- **us-east-1:** `http://bucket-name.s3-website-us-east-1.amazonaws.com`
- **us-west-2:** `http://bucket-name.s3-website-us-west-2.amazonaws.com`
- **eu-west-1:** `http://bucket-name.s3-website-eu-west-1.amazonaws.com`

## Costos Estimados

S3 Static Website Hosting es muy económico:
- Almacenamiento: ~$0.023 por GB/mes
- Transferencia de datos: Primeros 100 GB gratis/mes
- Solicitudes GET: $0.0004 por 1,000 solicitudes

Para una wiki como esta (~5-10 MB), el costo mensual será menor a $1 USD.

## Dominio Personalizado (Opcional)

Si quieres usar un dominio personalizado (ej: wiki.tuempresa.com):

1. Registra un dominio en Route 53 o tu proveedor preferido
2. Crea un registro CNAME apuntando a tu bucket S3
3. Configura el bucket con el nombre del dominio

## Seguridad Adicional

Para restringir el acceso:

### Opción 1: Autenticación Básica con CloudFront
1. Crea una distribución de CloudFront
2. Configura Lambda@Edge para autenticación
3. Apunta CloudFront a tu bucket S3

### Opción 2: VPN o IP Whitelist
Modifica la política del bucket para permitir solo IPs específicas.

## Comandos Útiles

```powershell
# Ver contenido del bucket
aws s3 ls s3://nombre-de-tu-bucket --recursive

# Eliminar todo el contenido
aws s3 rm s3://nombre-de-tu-bucket --recursive

# Eliminar el bucket
aws s3 rb s3://nombre-de-tu-bucket --force

# Ver configuración de website
aws s3api get-bucket-website --bucket nombre-de-tu-bucket

# Ver política del bucket
aws s3api get-bucket-policy --bucket nombre-de-tu-bucket
```

## Soporte

Si tienes problemas:
1. Revisa los logs de AWS CLI
2. Verifica la consola de AWS S3
3. Consulta la documentación oficial: https://docs.aws.amazon.com/s3/

---

**¡Listo!** Tu wiki MAP Assessment ahora está disponible en la nube y puedes compartir el enlace con tu equipo.
