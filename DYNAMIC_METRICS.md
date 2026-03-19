# Métricas Dinámicas - Cálculos Automáticos

## 📊 Cómo funcionan los cálculos dinámicos

Cuando el usuario sube un archivo Excel (MPA), los datos se extraen automáticamente y se usan para calcular todas las métricas dinámicamente.

## 🧮 Fórmulas de Cálculo

### 1. **Migration Complexity Score** (0-100)
```
complexityScore = MIN(100,
  (serverCount × 0.5) +
  (databaseCount × 2) +
  (applicationCount × 1.5) +
  (totalStorageGB / 1000)
)
```

**Ejemplo:**
- 10 servidores = 5 puntos
- 3 bases de datos = 6 puntos
- 15 aplicaciones = 22.5 puntos
- 500 GB almacenamiento = 0.5 puntos
- **Total: 34/100 = BAJO RIESGO**

---

### 2. **Estimated Timeline** (meses)
```
timeline = MAX(3,
  (serverCount / 20) +
  (databaseCount / 5) +
  (applicationCount / 10)
)
```

**Ejemplo:**
- 10 servidores ÷ 20 = 0.5 meses
- 3 bases de datos ÷ 5 = 0.6 meses
- 15 aplicaciones ÷ 10 = 1.5 meses
- **Total: 2.6 meses → Mínimo 3 meses**

---

### 3. **Resource Requirements (FTE)** - Full-Time Equivalents
```
FTE = MAX(2,
  (serverCount / 50) +
  (databaseCount / 10) +
  (applicationCount / 15)
)
```

**Ejemplo:**
- 10 servidores ÷ 50 = 0.2 FTE
- 3 bases de datos ÷ 10 = 0.3 FTE
- 15 aplicaciones ÷ 15 = 1 FTE
- **Total: 1.5 FTE → Mínimo 2 FTE**

---

### 4. **Optimization Potential** - Nuevas oportunidades
```
optimizationPotential =
  (serverCount × 0.8) +
  (databaseCount × 1.2) +
  (applicationCount × 0.5)
```

**Ejemplo:**
- 10 servidores × 0.8 = 8
- 3 bases de datos × 1.2 = 3.6
- 15 aplicaciones × 0.5 = 7.5
- **Total: 19 oportunidades de optimización**

---

### 5. **Cost Reduction Percentage** (%)
```
costReduction = MIN(60%,
  15 +
  (serverCount × 0.3) +
  (databaseCount × 0.4) +
  (totalStorageGB / 5000) × 10
)
```

**Ejemplo:**
- Base: 15%
- 10 servidores × 0.3 = 3%
- 3 bases de datos × 0.4 = 1.2%
- 500 GB ÷ 5000 × 10 = 1%
- **Total: 20.2% de reducción de costos**

---

### 6. **Estimated Annual Savings** (USD)
```
annualSavings =
  (serverCount × $8,000) × (costReductionPercentage / 100)
```

**Ejemplo:**
- 10 servidores × $8,000 = $80,000/año
- $80,000 × 20.2% = **$16,160/año en ahorros**

---

### 7. **ROI Timeline** (meses hasta break-even)
```
ROI = (serverCount × $50,000) / annualSavings
```

**Ejemplo:**
- Costo inicial: 10 × $50,000 = $500,000
- Ahorros anuales: $16,160
- ROI: $500,000 ÷ $16,160 = **~31 meses (~2.6 años)**

---

## 🔄 Flujo de datos

```
┌─────────────────────────┐
│  Excel MPA Upload       │
│  (FileUploader.tsx)     │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│ Backend API Parsing                 │
│ /api/assessment/upload              │
│ - Extrae servidores                 │
│ - Extrae bases de datos             │
│ - Extrae aplicaciones               │
│ - Suma almacenamiento total         │
└────────────┬────────────────────────┘
             │
             ↓
┌──────────────────────────────────────┐
│ Frontend receives data               │
│ {                                    │
│   serverCount: 10,                   │
│   databaseCount: 3,                  │
│   applicationCount: 15,              │
│   totalStorageGB: 500                │
│ }                                    │
└────────────┬─────────────────────────┘
             │
             ↓
┌──────────────────────────────────────┐
│ BusinessCaseMetrics Component        │
│ Calcula AUTOMÁTICAMENTE:             │
│ - complexityScore                    │
│ - estimatedTimeline                  │
│ - estimatedFTE                       │
│ - optimizationPotential              │
│ - costReductionPercentage            │
│ - estimatedAnnualSavings             │
│ - ROI timeline                       │
└────────────┬─────────────────────────┘
             │
             ↓
┌──────────────────────────────────────┐
│ UI Updated with Real Data            │
│ Muestra todas las métricas dinámicas │
│ en tiempo real                       │
└──────────────────────────────────────┘
```

---

## 💡 Cómo personalizar los cálculos

Si quieres ajustar los valores de los cálculos, edita estas líneas en `BusinessCaseMetrics.tsx`:

**Línea 31-37:** Ajusta los multiplicadores de complexity score
```tsx
const complexityScore = Math.min(
  100,
  Math.round(
    (serverCount * 0.5) +        // ← Ajusta esto
    (databaseCount * 2) +         // ← Ajusta esto
    (applicationCount * 1.5) +    // ← Ajusta esto
    (totalStorageGB / 1000)       // ← Ajusta esto
  )
);
```

**Línea 83-94:** Ajusta los multiplicadores de optimization potential
```tsx
const optimizationPotential = Math.round(
  (serverCount * 0.8) +           // ← Ajusta esto
  (databaseCount * 1.2) +         // ← Ajusta esto
  (applicationCount * 0.5)        // ← Ajusta esto
);
```

**Línea 97-105:** Ajusta el cálculo de cost reduction
```tsx
const costReductionPercentage = Math.min(
  60,                             // ← Máximo cap
  Math.round(
    15 +                          // ← Base %
    (serverCount * 0.3) +         // ← Ajusta esto
    (databaseCount * 0.4) +       // ← Ajusta esto
    (totalStorageGB / 5000) * 10  // ← Ajusta esto
  )
);
```

---

## 🔍 Ejemplo Real

**Excel cargado:**
```
Servidores: 50
Bases de datos: 8
Aplicaciones: 45
Almacenamiento: 2000 GB
Readiness: "Ready"
```

**Cálculos resultantes:**
- **Complexity Score:** (50×0.5) + (8×2) + (45×1.5) + (2000/1000) = 95/100 → **HIGH RISK**
- **Timeline:** 2.5 + 1.6 + 4.5 = **8.6 meses**
- **FTE Required:** 1 + 0.8 + 3 = **4.8 FTE**
- **Optimization Potential:** (50×0.8) + (8×1.2) + (45×0.5) = **59 oportunidades**
- **Cost Reduction:** 15 + 15 + 3.2 + 4 = **37.2%**
- **Annual Savings:** (50×$8,000) × 0.372 = **$148,800/año**
- **ROI Timeline:** (50×$50,000) / $148,800 = **~16.8 meses (1.4 años)**

---

## 📝 Notas Importantes

1. **Todos los cálculos son en tiempo real** - Se recalculan automáticamente cada vez que cambian los datos
2. **Los valores se basan en estimaciones** - Ajusta los multiplicadores según tu experiencia
3. **Cada métrica es independiente** - Puedes cambiar una fórmula sin afectar las otras
4. **El UI se actualiza automáticamente** - No necesitas recargar la página

