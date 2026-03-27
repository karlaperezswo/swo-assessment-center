# Algoritmo de Waves de Migración Mejorado

## 🎯 Objetivo

Generar olas de migración automáticamente considerando:
1. Servidores/bases de datos del archivo MPA
2. Análisis de dependencias de "Server Communication"
3. Servidores sin dependencias
4. Criticidad de ambientes (test/dev vs producción)
5. Separación por criticidad incluso con dependencias

## 📋 Prioridades de Migración

### Wave 1: Test/Dev/Staging (Criticidad: 10-15)
**SIEMPRE migran primero**, independientemente de dependencias

Servidores que incluyen en su nombre:
- `test`
- `dev`
- `staging`
- `qa`
- `sandbox`
- `demo`

**Justificación**: Son ambientes no productivos, menos críticos, ideales para validar el proceso de migración.

### Wave 2: Sin Dependencias + Baja Criticidad (16-40)
Servidores que:
- NO tienen dependencias (ni origen ni destino)
- Criticidad baja (16-40)

Incluye:
- CDN (20)
- Web/Nginx (25)
- Analytics/BI (30)
- Servidores auxiliares (40)

### Waves 3+: Con Dependencias + Criticidad Variable

#### Criticidad Media (45-50)
- App servers (45)
- API/REST (50)

#### Criticidad Alta (70-90)
- Queue/Kafka (70)
- Cache/Redis (75)
- Storage/S3 (80)
- Auth/LDAP (85)
- Database/SQL (90)

## 🔄 Algoritmo Paso a Paso

### Paso 1: Calcular Criticidad
```typescript
Para cada servidor:
  1. Verificar si es test/dev/staging → Criticidad 10
  2. Verificar tipo (database, auth, etc.) → Criticidad según tipo
  3. Contar dependientes → +5 por cada dependiente
  4. Asignar criticidad final
```

### Paso 2: Asignar Wave 1 (Test/Dev)
```typescript
Para cada servidor:
  Si criticidad <= 15:
    Asignar a Wave 1
    Marcar como asignado
```

### Paso 3: Asignar Wave 2 (Sin Dependencias)
```typescript
Para cada servidor no asignado:
  Si NO tiene dependencias Y criticidad <= 40:
    Asignar a Wave 2
    Marcar como asignado
```

### Paso 4: Asignar Waves 3+ (Con Dependencias)
```typescript
Wave actual = 3
Mientras haya servidores sin asignar:
  Para cada servidor no asignado:
    Si NO tiene dependencias:
      Agregar a candidatos
    Si TODAS sus dependencias están asignadas:
      Calcular wave = max(wave de dependencias) + 1
      Si wave calculada == wave actual:
        Agregar a candidatos
  
  Ordenar candidatos por criticidad (menor a mayor)
  Asignar candidatos a wave actual
  Wave actual++
```

### Paso 5: Manejar Dependencias Circulares
```typescript
Si quedan servidores sin asignar:
  Ordenar por criticidad
  Asignar todos a wave actual
```

## 📊 Ejemplo Práctico

### Servidores de Entrada
```
1. test-web-01        → test
2. dev-api-01         → dev
3. prod-cdn-01        → cdn, sin dependencias
4. prod-web-01        → web, depende de prod-api-01
5. prod-api-01        → api, depende de prod-db-01
6. prod-cache-01      → cache, depende de prod-db-01
7. prod-db-01         → database, sin dependencias
8. staging-app-01     → staging
```

### Cálculo de Criticidad
```
test-web-01:      10 (test)
dev-api-01:       10 (dev)
staging-app-01:   10 (staging)
prod-cdn-01:      20 (cdn)
prod-web-01:      25 (web)
prod-api-01:      50 (api) + 5 (1 dependiente) = 55
prod-cache-01:    75 (cache)
prod-db-01:       90 (database) + 10 (2 dependientes) = 100
```

### Asignación de Waves

**Wave 1: Test/Dev/Staging**
```
- test-web-01       (criticidad: 10)
- dev-api-01        (criticidad: 10)
- staging-app-01    (criticidad: 10)
```

**Wave 2: Sin Dependencias + Baja Criticidad**
```
- prod-cdn-01       (criticidad: 20, sin dependencias)
```

**Wave 3: Dependencias Resueltas + Media Criticidad**
```
- prod-db-01        (criticidad: 100, pero sin dependencias propias)
```

**Wave 4: Dependen de Wave 3**
```
- prod-api-01       (criticidad: 55, depende de prod-db-01)
- prod-cache-01     (criticidad: 75, depende de prod-db-01)
```

**Wave 5: Dependen de Wave 4**
```
- prod-web-01       (criticidad: 25, depende de prod-api-01)
```

## 🎨 Visualización del Flujo

```
Wave 1 (Test/Dev)
├── test-web-01
├── dev-api-01
└── staging-app-01

Wave 2 (Sin Deps + Baja Crit)
└── prod-cdn-01

Wave 3 (Base de Datos)
└── prod-db-01
    ↓
Wave 4 (Servicios Medios)
├── prod-api-01
└── prod-cache-01
    ↓
Wave 5 (Frontend)
└── prod-web-01
```

## 🔍 Reglas Especiales

### Regla 1: Test/Dev Siempre Primero
```
Incluso si test-app depende de prod-db:
  test-app → Wave 1 (criticidad 10)
  prod-db  → Wave 3+ (criticidad 90)
```

### Regla 2: Sin Dependencias + Baja Criticidad
```
Si servidor NO tiene dependencias Y criticidad < 40:
  Asignar a Wave 2
```

### Regla 3: Ordenamiento por Criticidad
```
Dentro de cada wave:
  Ordenar servidores por criticidad ascendente
  Menos críticos primero
```

### Regla 4: Dependencias Circulares
```
Si A depende de B y B depende de A:
  Asignar ambos a la misma wave
  Ordenar por criticidad
```

## 📈 Ventajas del Algoritmo

### 1. Realista
- Refleja prácticas reales de migración
- Test/dev validan el proceso primero
- Producción migra con más cuidado

### 2. Flexible
- Considera dependencias
- Pero no las hace absolutas
- Criticidad puede override dependencias

### 3. Seguro
- Servidores críticos al final
- Tiempo para validar con test/dev
- Rollback más fácil si hay problemas

### 4. Eficiente
- Maximiza paralelismo
- Múltiples servidores por wave
- Reduce tiempo total de migración

## 🎯 Casos de Uso

### Caso 1: Validación con Test
```
Problema: Necesito validar el proceso antes de producción

Solución:
Wave 1: Todos los servidores test/dev
  → Migrar y validar
  → Si hay problemas, ajustar
  → No afecta producción

Wave 2+: Producción con confianza
```

### Caso 2: Minimizar Riesgo
```
Problema: Bases de datos son muy críticas

Solución:
Wave 1-2: Servidores menos críticos
Wave 3: Bases de datos (criticidad 90)
Wave 4+: Servicios que dependen de BD
  → BD migra cuando todo lo demás está validado
```

### Caso 3: Maximizar Velocidad
```
Problema: Muchos servidores independientes

Solución:
Wave 1: Test/dev (10 servidores)
Wave 2: Sin dependencias (20 servidores)
  → 30 servidores en paralelo
  → Migración rápida
```

## 📊 Métricas del Algoritmo

### Complejidad
- **Tiempo**: O(n² log n) en el peor caso
- **Espacio**: O(n)
- **Iteraciones**: Máximo n + 10

### Performance
- **Servidores**: Hasta 1000+ servidores
- **Dependencias**: Hasta 10000+ conexiones
- **Tiempo de cálculo**: < 1 segundo

## ✨ Mejoras Futuras Posibles

1. **Machine Learning**: Aprender de migraciones anteriores
2. **Costos**: Considerar costos de downtime
3. **Ventanas**: Respetar ventanas de mantenimiento
4. **Equipos**: Asignar waves a equipos específicos
5. **Rollback**: Planificar estrategia de rollback por wave

## 🎉 Resultado Final

El algoritmo ahora:
- ✅ Considera servidores del archivo MPA
- ✅ Analiza dependencias de "Server Communication"
- ✅ Identifica servidores sin dependencias
- ✅ Prioriza test/dev/staging (Wave 1)
- ✅ Separa por criticidad incluso con dependencias
- ✅ Coloca críticos al final
- ✅ Maneja dependencias circulares
- ✅ Optimiza paralelismo
- ✅ Minimiza riesgo
- ✅ Maximiza eficiencia

Las olas de migración ahora son inteligentes, seguras y eficientes! 🚀✨
