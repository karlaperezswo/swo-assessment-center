# Comparación Detallada de Costos AWS

Análisis de costos para diferentes arquitecturas de deployment en AWS para Assessment Center.

---

## Suposiciones Base

- **Tráfico**: 10,000 requests/mes (~330/día)
- **Usuarios concurrentes**: 5-10
- **Tamaño promedio Excel**: 5 MB
- **Archivos procesados**: 200/mes
- **Documentos Word generados**: 200/mes
- **Almacenamiento temporal**: ~50 GB/mes

---

## Opción 1: SERVERLESS (RECOMENDADA)

### Arquitectura
```
Frontend: AWS Amplify Hosting
Backend: Lambda + API Gateway
Storage: S3
CDN: CloudFront (incluido en Amplify)
```

### Cálculo Detallado

#### AWS Amplify Hosting
- **Build minutes**: 100 min/mes × $0.01/min = **$1.00**
- **Hosting**: 50 GB almacenado × $0.15/GB = **$7.50**
- **Data transfer**: 100 GB × $0.15/GB = **$15.00**
- **Subtotal Amplify**: **$23.50/mes**

*Con bajo tráfico (10 GB transfer): ~$3/mes*

#### AWS Lambda
- **Requests**: 10,000/mes
  - Free Tier: 1,000,000 requests/mes → **$0**
- **Compute time**: 10,000 × 5 seg × 1024 MB = 50,000 GB-seg
  - Free Tier: 400,000 GB-seg/mes → **$0**
- **Subtotal Lambda**: **$0/mes** (dentro Free Tier)

#### API Gateway
- **Requests**: 10,000/mes
  - Free Tier: 1,000,000 requests/mes → **$0**
- **Data transfer**: Incluido en Lambda
- **Subtotal API Gateway**: **$0/mes** (dentro Free Tier)

#### Amazon S3
- **Storage**: 50 GB × $0.023/GB = **$1.15**
- **PUT requests**: 400 (uploads + docs) × $0.005/1,000 = **$0.002**
- **GET requests**: 400 × $0.0004/1,000 = **$0.0002**
- **Data transfer OUT**: Primeros 100 GB gratis → **$0**
- **Subtotal S3**: **$1.15/mes**

#### CloudWatch Logs
- **Ingestion**: 1 GB × $0.50/GB = **$0.50**
- **Storage**: 1 GB × $0.03/GB = **$0.03**
- **Subtotal CloudWatch**: **$0.53/mes**

### Total Opción 1 (Tráfico Bajo)
```
Amplify:     $3.00
Lambda:      $0.00  (Free Tier)
API Gateway: $0.00  (Free Tier)
S3:          $1.15
CloudWatch:  $0.53
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $4.68/mes ≈ $5/mes
```

### Total Opción 1 (Tráfico Medio)
```
Amplify:     $23.50
Lambda:      $0.00  (Free Tier)
API Gateway: $0.00  (Free Tier)
S3:          $1.15
CloudWatch:  $0.53
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $25.18/mes ≈ $25/mes
```

### Escalabilidad
- **1M requests/mes**: ~$50/mes
- **10M requests/mes**: ~$300/mes
- Auto-scaling incluido
- Sin gestión de servidores

---

## Opción 2: CONTENEDORES SERVERLESS

### Arquitectura
```
Frontend: AWS Amplify Hosting
Backend: AWS App Runner
Storage: S3
```

### Cálculo Detallado

#### AWS Amplify
- Mismo que Opción 1: **$3-23/mes**

#### AWS App Runner
- **Provisioned resources**:
  - 1 vCPU × $0.007/vCPU-hora × 730 horas = **$5.11**
  - 2 GB RAM × $0.0008/GB-hora × 730 horas = **$1.17**
- **Compute**:
  - 10,000 requests × 5 seg = 50,000 seg
  - 50,000 seg / 3600 = 13.9 horas × 1 vCPU × $0.064 = **$0.89**
  - 13.9 horas × 2 GB × $0.0071 = **$0.20**
- **Subtotal App Runner**: **$7.37/mes**

#### S3 y CloudWatch
- Mismo que Opción 1: **$1.68/mes**

### Total Opción 2 (Tráfico Bajo)
```
Amplify:     $3.00
App Runner:  $7.37
S3:          $1.15
CloudWatch:  $0.53
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $12.05/mes ≈ $12/mes
```

### Total Opción 2 (Tráfico Medio)
```
Amplify:     $23.50
App Runner:  $7.37
S3:          $1.15
CloudWatch:  $0.53
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $32.55/mes ≈ $33/mes
```

### Ventajas sobre Lambda
- Sin cold starts
- Timeouts más largos (ilimitado)
- Más fácil de debuggear
- Deploy más simple (solo Docker)

---

## Opción 3: ELASTIC BEANSTALK

### Arquitectura
```
Frontend: S3 + CloudFront
Backend: Elastic Beanstalk (1x t3.micro)
Storage: S3
Load Balancer: Application Load Balancer
```

### Cálculo Detallado

#### CloudFront + S3 (Frontend)
- **S3 storage**: 1 GB × $0.023 = **$0.02**
- **CloudFront**:
  - 100 GB transfer × $0.085/GB = **$8.50**
  - Requests: 1M × $0.0075/10,000 = **$0.75**
- **Subtotal Frontend**: **$9.27/mes**

*Con bajo tráfico (10 GB): ~$1/mes*

#### Elastic Beanstalk
- **EC2 t3.micro**: $0.0104/hora × 730 horas = **$7.59**
- **EBS Volume**: 20 GB × $0.10/GB = **$2.00**
- **Elastic IP**: Gratis si está asociado
- **Subtotal EB**: **$9.59/mes**

#### Application Load Balancer
- **ALB hours**: $0.0225/hora × 730 = **$16.43**
- **LCU hours**: ~$7.00 (mínimo)
- **Subtotal ALB**: **$23.43/mes**

#### S3 (Backend storage)
- Mismo que Opción 1: **$1.15/mes**

### Total Opción 3 (Tráfico Bajo)
```
Frontend:    $1.00
EB:          $9.59
ALB:         $23.43
S3:          $1.15
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $35.17/mes ≈ $35/mes
```

### Total Opción 3 (Tráfico Medio)
```
Frontend:    $9.27
EB:          $9.59
ALB:         $23.43
S3:          $1.15
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $43.44/mes ≈ $43/mes
```

### Desventajas
- ALB es caro para poco tráfico
- Servidor siempre corriendo (no serverless)
- Requiere más mantenimiento
- No auto-escala tan fácilmente

---

## Opción 4: EC2 SIMPLE (Sin ALB)

### Arquitectura
```
Frontend: S3 + CloudFront
Backend: 1x EC2 t3.micro con Nginx
Storage: S3
```

### Cálculo Detallado

#### Frontend (S3 + CloudFront)
- Mismo que Opción 3: **$1-9/mes**

#### EC2 t3.micro
- **Compute**: $0.0104/hora × 730 = **$7.59**
- **EBS**: 20 GB × $0.10 = **$2.00**
- **Elastic IP**: **$0** (si está asociado)
- **Data transfer OUT**:
  - Primeros 100 GB gratis → **$0**
- **Subtotal EC2**: **$9.59/mes**

#### S3
- **$1.15/mes**

### Total Opción 4
```
Frontend:    $1.00
EC2:         $9.59
S3:          $1.15
━━━━━━━━━━━━━━━━━━━━━━
TOTAL:       $11.74/mes ≈ $12/mes
```

### Ventajas
- Más barato que EB (sin ALB)
- Control total del servidor
- Fácil de entender

### Desventajas
- No es serverless
- Requiere mantenimiento del servidor
- No auto-escala
- Single point of failure

---

## Resumen Comparativo

| Opción | Tráfico Bajo | Tráfico Medio | Tráfico Alto | Auto-Scale | Mantenimiento | Cold Start |
|--------|--------------|---------------|--------------|------------|---------------|------------|
| **1. Serverless** | **$5/mes** | **$25/mes** | **$50-300/mes** | ✅ Automático | ✅ Mínimo | ⚠️ Sí (~1s) |
| **2. App Runner** | $12/mes | $33/mes | $50-100/mes | ✅ Automático | ✅ Bajo | ✅ No |
| **3. Beanstalk** | $35/mes | $43/mes | $60-150/mes | ⚠️ Manual | ⚠️ Medio | ✅ No |
| **4. EC2 Simple** | $12/mes | $15/mes | ❌ No escala | ❌ No | ❌ Alto | ✅ No |

---

## Recomendación por Caso de Uso

### 🥇 Para Máxima Rentabilidad: **Opción 1 - Serverless**
- Ideal para: Tráfico variable, bajo-medio volumen
- Ventajas:
  - Pagas solo por lo que usas
  - Free Tier cubre mucho
  - Auto-escala sin límites
  - Cero mantenimiento de servidores

### 🥈 Para Mejor Rendimiento: **Opción 2 - App Runner**
- Ideal para: Necesitas baja latencia, procesos largos
- Ventajas:
  - Sin cold starts
  - Timeouts ilimitados
  - Más fácil de debuggear que Lambda
  - Aún es serverless

### 🥉 Para Control Total: **Opción 4 - EC2 Simple**
- Ideal para: Quieres control completo, tráfico predecible
- Ventajas:
  - Costo fijo predecible
  - Control total del servidor
  - No hay sorpresas en la factura

### ❌ NO Recomendado: **Opción 3 - Elastic Beanstalk**
- El ALB es muy caro para poco tráfico
- Solo tiene sentido con alta disponibilidad requerida
- Mejor usar App Runner o EC2 simple

---

## Calculadora AWS Real

Para calcular tu caso específico:
- [AWS Pricing Calculator](https://calculator.aws/)

### Template Pre-configurado
```
https://calculator.aws/#/estimate?id=XXXXX
```

---

## Optimizaciones de Costo

### 1. Usar Lambda Layers
- Reduce tamaño de deployment
- Reutiliza dependencias
- Ahorro: ~30% en storage

### 2. S3 Intelligent-Tiering
- Auto-mueve archivos a storage más barato
- Ahorro: ~40% en archivos viejos

### 3. CloudFront Caching
- Reduce hits a Lambda
- Ahorro: ~50% en requests

### 4. Reserved Instances (si usas EC2/RDS)
- 1 año NURI: ~40% descuento
- 3 años NURI: ~60% descuento

### 5. Comprimir Assets
- Gzip/Brotli en CloudFront
- Ahorro: ~70% en data transfer

---

## Conclusión

Para tu aplicación **Assessment Center**, la **Opción 1 (Serverless)** es la más rentable:

**Costo mensual estimado: $5-25/mes**
- $5/mes con tráfico bajo (ideal para empezar)
- $25/mes con tráfico medio
- Escala automáticamente según demanda
- Pagas solo por lo que usas

**Ahorro anual**: ~$360-480/año vs EC2 tradicional
