# 📊 Análisis: Mapeo de Security Groups con Información de Puertos

## 🎯 Objetivo
Mejorar el mapeo de Security Groups utilizando información de puertos (source/destination) y protocolos de ambos formatos de Excel (Concierto MPA y AWS MPA Export).

---

## 📋 Estado Actual

### ✅ **LO QUE YA FUNCIONA:**

1. **ConciertoParser** (líneas 237-238):
   ```typescript
   sourcePort: this.parseNumber(row['Source Port'] || 0),
   destinationPort: this.parseNumber(row['Destination Port'] || 0),
   protocol: this.cleanString(row['Protocol'] || 'tcp').toLowerCase()
   ```
   ✅ **Ya parsea correctamente** Source Port, Destination Port y Protocol

2. **AWSMPAParser** (líneas 243-246):
   ```typescript
   destinationPort: this.parseNumber(row['Port'] || row['Destination Port'] || 0),
   protocol: this.cleanString(row['Protocol'] || 'tcp').toLowerCase()
   ```
   ✅ **Parsea Destination Port y Protocol**
   ⚠️ **NO parsea Source Port** (falta agregarlo)

3. **SecurityGroupService**:
   - ✅ Agrupa reglas por `protocol:destinationPort` (líneas 184, 230)
   - ✅ Tiene diccionario de puertos comunes (22 servicios mapeados)
   - ✅ Genera descripciones automáticas (ej: "Allow inbound HTTPS (tcp/443)")
   - ✅ Consolida múltiples comunicaciones en una sola regla

---

## 🔍 Datos Disponibles

### **Concierto MPA Report.xlsx**

| Hoja | Columnas Clave | Filas | Uso |
|------|----------------|-------|-----|
| **Overall Connections - Prod** | Source Port, Destination Port, Protocol | 4,351 | ✅ Parseado |
| **Overall Connections - Dev** | Source Port, Destination Port, Protocol | 64 | ✅ Parseado |
| **Overall Connections - UAT** | Source Port, Destination Port, Protocol | 705 | ✅ Parseado |
| **Overall Connections - SIT** | Source Port, Destination Port, Protocol | 137 | ✅ Parseado |
| **Overall Connections - DR** | Source Port, Destination Port, Protocol | 964 | ✅ Parseado |
| **App Dashboard** | (6,237 filas) | - | ⚠️ No tiene columnas de puertos |

**Total comunicaciones:** 6,221 conexiones con información de puertos

### **mpa-export.xlsx (AWS MPA)**

| Hoja | Columnas Clave | Filas | Uso |
|------|----------------|-------|-----|
| **Server Communication** | Source Port, Target Port, Protocol | 660 | ⚠️ Source Port NO parseado |

---

## 📊 Servicios Detectados (Top 15 en Concierto)

| Puerto/Protocolo | Conexiones | Servicio | Observación |
|------------------|-----------|----------|-------------|
| `tcp/443` | 751 | HTTPS | ✅ Identificado |
| `tcp/1435` | 585 | ? | ❌ Puerto custom no identificado |
| `tcp/1524` | 568 | ? | ❌ Puerto custom no identificado |
| `tcp/8027` | 429 | ? | ❌ Puerto custom no identificado |
| `tcp/22233` | 384 | ? | ❌ Puerto custom no identificado |
| `tcp/5736` | 318 | ? | ❌ Puerto custom no identificado |
| `tcp/1433` | 296 | MSSQL | ✅ Identificado |
| `tcp/808` | 252 | ? | ❌ Puerto custom no identificado |
| `tcp/22` | 239 | SSH | ✅ Identificado |
| `tcp/1434` | 93 | MSSQL Browser | ⚠️ No identificado |
| `tcp/3389` | 83 | RDP | ✅ Identificado |
| `tcp/8085` | 47 | HTTP Alt | ⚠️ No identificado |
| `tcp/9999` | 44 | ? | ❌ Puerto custom no identificado |
| `tcp/445` | 31 | SMB | ✅ Identificado |
| `tcp/32843` | 28 | ? | ❌ Puerto custom (dinámico?) |

**Análisis:**
- ✅ Solo 5 de 15 puertos más usados están identificados
- ❌ 67% de los puertos son CUSTOM y no se identifican
- ⚠️ Muchos puertos custom sugieren aplicaciones específicas del cliente

---

## 🚀 Recomendaciones de Mejora

### **1. Agregar Source Port al AWS MPA Parser** ⭐ PRIORIDAD ALTA

**Problema:** AWS MPA Parser no parsea `Source Port`

**Solución:**
```typescript
// En AWSMPAParser.ts, línea 243
sourcePort: this.parseNumber(row['Source Port'] || 0),
destinationPort: this.parseNumber(row['Port'] || row['Destination Port'] || 0),
```

**Impacto:** ✅ Completitud de datos para análisis de seguridad

---

### **2. Expandir Diccionario de Servicios Comunes** ⭐ PRIORIDAD ALTA

**Problema:** Solo 22 puertos están mapeados, pero hay cientos de puertos standard

**Solución:** Agregar más servicios al método `getServiceNameForPort()`:

```typescript
// Servicios adicionales a agregar:
'1434': 'MSSQL Browser',
'1521': 'Oracle TNS',
'5000': 'Flask/UPnP',
'5001': 'Synology DSM',
'5900-5999': 'VNC',
'6000-6063': 'X11',
'7000-7999': 'Custom Applications',
'8000-8999': 'Web Applications',
'9000-9999': 'Custom Services',
'10000-19999': 'Custom Ports',
'20000-29999': 'Custom Ports',
'30000-65535': 'Dynamic/Ephemeral Ports'
```

**Impacto:** ✅ Mejor identificación de servicios en descripciones de reglas

---

### **3. Detección Inteligente de Servicios Custom** ⭐⭐ PRIORIDAD MEDIA

**Problema:** Puertos como 1435, 1524, 8027, 22233, 5736 no se identifican

**Solución:** Crear un servicio de detección heurística:

```typescript
class ServiceDetectionService {
  detectService(port: number, protocol: string, communications: ServerCommunication[]): string {
    // 1. Puertos cercanos a conocidos (ej: 1435 ≈ 1433 MSSQL)
    if (port >= 1430 && port <= 1440) return 'MSSQL Variant';

    // 2. Rangos de aplicaciones web
    if (port >= 8000 && port <= 8999) return 'Web Application';

    // 3. Puertos dinámicos/ephemeral (>= 32768)
    if (port >= 32768) return 'Dynamic Port';

    // 4. Análisis de patrones (múltiples conexiones al mismo puerto)
    const count = communications.filter(c => c.destinationPort === port).length;
    if (count > 100) return 'High-Traffic Service';

    return 'Custom Application';
  }
}
```

**Impacto:** ✅ Mejor categorización de servicios custom del cliente

---

### **4. Agrupación por Application Name** ⭐⭐⭐ PRIORIDAD ALTA

**Problema:** Security Groups se crean por servidor, no por aplicación lógica

**Solución:** Mejorar agrupación usando `sourceAppName` y `targetAppName`:

```typescript
// Ejemplo de regla mejorada:
{
  groupName: "ACA-PROD-sg",  // Basado en Application Name
  inboundRules: [
    {
      protocol: "tcp",
      port: 1435,  // Puerto custom detectado
      source: "Load Balancer",
      description: "Allow inbound Custom MSSQL Variant (tcp/1435) from Load Balancer for ACA application"
    }
  ]
}
```

**Impacto:** ✅✅ Security Groups más organizados y mantenibles

---

### **5. Port Range Detection** ⭐ PRIORIDAD BAJA

**Problema:** Algunos servicios usan rangos de puertos (ej: VNC 5900-5999)

**Solución:**
```typescript
// Detectar y consolidar rangos consecutivos
function consolidatePortRanges(ports: number[]): string[] {
  const sorted = ports.sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = sorted[i];
    }
  }

  ranges.push(start === end ? `${start}` : `${start}-${end}`);
  return ranges;
}
```

**Ejemplo:**
- Antes: 5 reglas separadas para puertos 8080, 8081, 8082, 8083, 8084
- Después: 1 regla para rango 8080-8084

**Impacto:** ✅ Menos reglas, más mantenible

---

### **6. Exportación a Terraform/CloudFormation** ⭐⭐ PRIORIDAD MEDIA

**Estado Actual:** Métodos placeholder (líneas 415-428)

**Solución:** Implementar exportación real:

```typescript
exportToTerraform(securityGroups: SecurityGroup[]): string {
  let terraform = '# Security Groups for AWS Migration\n\n';

  securityGroups.forEach(sg => {
    terraform += `resource "aws_security_group" "${sg.groupId}" {\n`;
    terraform += `  name        = "${sg.groupName}"\n`;
    terraform += `  description = "${sg.description}"\n\n`;

    sg.inboundRules.forEach(rule => {
      terraform += `  ingress {\n`;
      terraform += `    from_port   = ${rule.port}\n`;
      terraform += `    to_port     = ${rule.port}\n`;
      terraform += `    protocol    = "${rule.protocol}"\n`;
      terraform += `    cidr_blocks = ["${rule.source}"]\n`;
      terraform += `    description = "${rule.description}"\n`;
      terraform += `  }\n\n`;
    });

    terraform += `}\n\n`;
  });

  return terraform;
}
```

**Impacto:** ✅✅ Generación automática de IaC para deployment

---

## 📈 Plan de Implementación Sugerido

### **Fase 1: Quick Wins** (2-3 horas)
1. ✅ Agregar `sourcePort` al AWSMPAParser
2. ✅ Expandir diccionario de servicios comunes (+50 puertos)
3. ✅ Mejorar descripciones de reglas con app names

### **Fase 2: Mejoras Inteligentes** (4-6 horas)
4. ✅ Implementar ServiceDetectionService con heurísticas
5. ✅ Mejorar agrupación por Application Name
6. ✅ Agregar port range detection

### **Fase 3: Exportación** (3-4 horas)
7. ✅ Implementar exportación a Terraform
8. ✅ Implementar exportación a CloudFormation
9. ✅ Agregar validación de reglas

---

## 💡 Ejemplo de Mejora

### **ANTES:**
```typescript
{
  groupName: "Prod227-Prod-sg",
  inboundRules: [
    {
      protocol: "tcp",
      port: 1435,
      source: "192.0.x.x",
      description: "Allow inbound tcp/1435"  // ❌ No identifica el servicio
    }
  ]
}
```

### **DESPUÉS:**
```typescript
{
  groupName: "ACA-PROD-sg",  // ✅ Nombre basado en aplicación
  inboundRules: [
    {
      protocol: "tcp",
      port: 1435,
      source: "LoadBalancer-SG",  // ✅ Referencia a otro SG
      description: "Allow inbound MSSQL Variant (tcp/1435) from LoadBalancer for ACA application",  // ✅ Descripción clara
      serviceName: "MSSQL Variant",  // ✅ Servicio detectado
      relatedApplications: ["ACA"],  // ✅ Aplicaciones relacionadas
      connectionCount: 585  // ✅ Estadísticas
    }
  ]
}
```

---

## 🎯 Conclusiones

### ✅ **Fortalezas Actuales:**
- Los parsers ya capturan correctamente la información de puertos
- SecurityGroupService tiene buena estructura para consolidación de reglas
- Sistema funciona correctamente para servicios estándar

### ⚠️ **Áreas de Mejora:**
- 67% de puertos custom no se identifican
- AWS MPA Parser no captura Source Port
- Falta detección inteligente de servicios custom
- No hay exportación funcional a IaC (Terraform/CloudFormation)

### 🚀 **Valor de las Mejoras:**
- ✅ Mejor documentación de security groups
- ✅ Reglas más organizadas y mantenibles
- ✅ Generación automática de IaC
- ✅ Identificación de servicios custom del cliente
- ✅ Reducción de tiempo en configuración manual de seguridad

---

## 📝 Próximos Pasos

¿Quieres que implemente alguna de estas mejoras? Recomiendo empezar con:

1. **Agregar sourcePort al AWS MPA Parser** (5 minutos)
2. **Expandir diccionario de servicios** (15 minutos)
3. **Implementar ServiceDetectionService** (1 hora)

¿Por cuál prefieres que empiece?
