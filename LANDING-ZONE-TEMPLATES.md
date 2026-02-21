# 🚀 Generador de Templates de Landing Zone

## Descripción

El componente Landing Zone ahora incluye un **generador automático de templates de CloudFormation y Terraform** basado en las mejores prácticas de AWS. Ya no es solo un checklist, sino una herramienta que genera código listo para ejecutar.

## ✨ Características

### Templates Generados

1. **CloudFormation (.yaml)**
   - VPC multi-AZ con subnets públicas y privadas
   - NAT Gateways para alta disponibilidad
   - Internet Gateway
   - Route Tables configuradas
   - VPC Flow Logs
   - CloudTrail (opcional)
   - GuardDuty (opcional)
   - Security Hub con CIS Benchmarks (opcional)
   - AWS Config (opcional)
   - Organizational Units (OUs)

2. **Terraform (.tf)**
   - Mismos recursos que CloudFormation
   - Backend S3 configurado (comentado por defecto)
   - Variables parametrizadas
   - Outputs útiles
   - Política de tags por defecto

3. **README.md**
   - Guía completa de despliegue
   - Comandos AWS CLI
   - Comandos Terraform
   - Configuración post-despliegue
   - Troubleshooting
   - Referencias a documentación AWS

## 📋 Cómo Usar

### Paso 1: Navegar a Landing Zone

1. Ve a la fase **MOVILIZAR** (tab violeta)
2. Haz clic en la pestaña **"Landing Zone"**
3. Verás una nueva sección azul: **"Generador de Templates IaC"**

### Paso 2: Configurar Parámetros

1. Haz clic en el botón **"Configurar"**
2. Completa el formulario:

   **Información Básica:**
   - **Nombre de Organización**: Ej. "MiEmpresa", "Acme Corp"
   - **Región Principal**: Selecciona tu región AWS principal
   - **VPC CIDR Block**: Rango de IPs (por defecto: 10.0.0.0/16)
   - **Email de Contacto**: Email para notificaciones AWS

   **Servicios de Seguridad:** (marcar/desmarcar según necesites)
   - ✅ CloudTrail - Auditoría de API calls
   - ✅ GuardDuty - Detección de amenazas
   - ✅ Security Hub - Postura de seguridad
   - ✅ AWS Config - Compliance continuo

### Paso 3: Descargar Templates

Tienes 4 opciones de descarga:

1. **CloudFormation (.yaml)** - Botón naranja
   - Template YAML listo para AWS CloudFormation

2. **Terraform (.tf)** - Botón morado
   - Configuración HCL para Terraform

3. **Guía README** - Botón blanco
   - Documentación completa de despliegue

4. **Descargar Todo** - Botón azul
   - Descarga los 3 archivos automáticamente

## 🔧 Desplegar la Landing Zone

### Opción A: CloudFormation

```bash
# 1. Validar el template
aws cloudformation validate-template \
  --template-body file://MiEmpresa-landing-zone.yaml

# 2. Crear el stack
aws cloudformation create-stack \
  --stack-name mi-empresa-landing-zone \
  --template-body file://MiEmpresa-landing-zone.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# 3. Monitorear progreso
aws cloudformation wait stack-create-complete \
  --stack-name mi-empresa-landing-zone \
  --region us-east-1

# 4. Ver resultados
aws cloudformation describe-stacks \
  --stack-name mi-empresa-landing-zone \
  --query 'Stacks[0].Outputs'
```

### Opción B: Terraform

```bash
# 1. Inicializar
terraform init

# 2. Planear
terraform plan

# 3. Aplicar
terraform apply

# 4. Ver outputs
terraform output
```

### Opción C: AWS Console (GUI)

1. Ve a **CloudFormation** en AWS Console
2. Haz clic en **Create Stack**
3. Sube el archivo `.yaml` descargado
4. Llena los parámetros
5. Haz clic en **Create Stack**

## 📊 Recursos Creados

### Networking
- **1 VPC** con DNS habilitado
- **2 Public Subnets** (multi-AZ)
- **2 Private Subnets** (multi-AZ)
- **1 Internet Gateway**
- **2 NAT Gateways** (alta disponibilidad)
- **Route Tables** configuradas
- **VPC Flow Logs** para auditoría

### Security
- **CloudTrail**: Logs de todas las API calls
- **GuardDuty**: Detección de amenazas en tiempo real
- **Security Hub**: Dashboard centralizado de seguridad
- **AWS Config**: Evaluación de compliance continuo

### Governance
- **Organizational Units**: Security, Infrastructure, Workloads
- **S3 Buckets**: CloudTrail y Config con encriptación
- **IAM Roles**: Configurados con least privilege

## 💰 Estimación de Costos

Los costos mensuales estimados varían según la región y uso:

| Servicio | Costo Mensual Aprox. |
|----------|---------------------|
| NAT Gateways (2) | ~$65 USD |
| VPC Flow Logs | ~$10-30 USD |
| CloudTrail | ~$5-15 USD |
| GuardDuty | ~$30-50 USD |
| Security Hub | ~$1-10 USD |
| AWS Config | ~$10-20 USD |
| **TOTAL** | **~$120-200 USD/mes** |

**💡 Tip:** Deshabilita servicios opcionales en entornos de desarrollo para reducir costos.

## ⚙️ Personalización

### Modificar VPC CIDR

Si necesitas un rango diferente:
```yaml
# En CloudFormation
VpcCIDR:
  Default: "10.1.0.0/16"  # Cambia aquí

# En Terraform
variable "vpc_cidr" {
  default = "10.1.0.0/16"  # Cambia aquí
}
```

### Agregar Más Regiones

Para alta disponibilidad multi-región, descarga templates separados para cada región y despliega:
```bash
# Región 1: us-east-1
aws cloudformation create-stack --region us-east-1 ...

# Región 2: us-west-2
aws cloudformation create-stack --region us-west-2 ...
```

### Deshabilitar Servicios

Edita la configuración antes de descargar y desmarca servicios no necesarios, o edita el template manualmente eliminando los recursos correspondientes.

## 🔐 Mejores Prácticas

### Antes del Despliegue

1. ✅ Revisar todos los parámetros
2. ✅ Verificar que el CIDR no traslape con redes existentes
3. ✅ Confirmar que tienes permisos de administrador
4. ✅ Habilitar MFA en cuenta root
5. ✅ Configurar presupuestos de AWS

### Después del Despliegue

1. ✅ Revisar Security Hub findings
2. ✅ Configurar notificaciones de GuardDuty
3. ✅ Crear usuarios IAM (no usar root)
4. ✅ Habilitar MFA para todos los usuarios
5. ✅ Configurar AWS Budgets y alertas
6. ✅ Documentar arquitectura

## 🆘 Troubleshooting

### Error: "InsufficientCapabilities"
**Causa:** Falta el flag de capacidades IAM
**Solución:** Agregar `--capabilities CAPABILITY_NAMED_IAM`

### Error: "VPC CIDR overlap"
**Causa:** El CIDR configurado ya existe
**Solución:** Cambiar el parámetro `VpcCIDR` a un rango diferente

### Error: "GuardDuty already enabled"
**Causa:** GuardDuty ya está activo en la cuenta
**Solución:** Deshabilitar en consola o remover del template

### Error: Terraform State Lock
**Causa:** Otro proceso está usando el estado
**Solución:** Esperar o forzar unlock: `terraform force-unlock <LOCK_ID>`

## 📚 Referencias

- [AWS Landing Zone Guide](https://aws.amazon.com/solutions/implementations/landing-zone/)
- [Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [CloudFormation Docs](https://docs.aws.amazon.com/cloudformation/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS Organizations Best Practices](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_best-practices.html)

## 🎯 Próximos Pasos Recomendados

1. Descargar todos los templates
2. Revisar el README generado
3. Personalizar parámetros según necesidad
4. Ejecutar en cuenta de prueba primero
5. Documentar cambios específicos
6. Desplegar en producción
7. Configurar monitoreo y alertas
8. Implementar backup strategy

---

**Generado por**: AWS Assessment Center
**Documentación**: Generación automática de Infrastructure as Code para AWS Landing Zones
