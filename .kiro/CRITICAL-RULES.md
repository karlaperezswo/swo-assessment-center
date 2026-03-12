# 🚨 REGLAS CRÍTICAS Y OBLIGATORIAS DEL PROYECTO

## ⚠️ MÓDULO SELECTOR - CÓDIGO ESTABLE Y PROTEGIDO

**FECHA DE ESTABILIZACIÓN**: 12 de Marzo 2026  
**VERSIÓN ESTABLE**: main @ commit 3c83588

### 🔒 ARCHIVOS PROTEGIDOS - NO MODIFICAR

Los siguientes archivos están en **PRODUCCIÓN ESTABLE** y **NO DEBEN SER MODIFICADOS** bajo ninguna circunstancia sin aprobación explícita:

#### Backend - Selector Module
```
backend/src/controllers/selector/
├── SelectorController.ts          ❌ NO MODIFICAR
backend/src/services/selector/
├── SelectorCalculationService.ts  ❌ NO MODIFICAR
├── SelectorConfigService.ts       ❌ NO MODIFICAR
├── SelectorExportService.ts       ❌ NO MODIFICAR
├── SelectorSessionService.ts      ❌ NO MODIFICAR
backend/src/config/selector/
├── matrix.json                    ❌ NO MODIFICAR
├── questions.json                 ❌ NO MODIFICAR
backend/src/types/
├── selector.ts                    ❌ NO MODIFICAR
backend/src/routes/
├── selectorRoutes.ts              ❌ NO MODIFICAR
```

#### Frontend - Selector Module
```
frontend/src/components/phases/
├── SelectorPhase.tsx              ❌ NO MODIFICAR
```

#### Data Storage
```
backend/data/selector/             ❌ NO MODIFICAR
└── sessions/                      ❌ NO MODIFICAR (contiene datos de clientes)
```

### 📦 DEPENDENCIAS PROTEGIDAS

Las siguientes dependencias son **CRÍTICAS** para el módulo Selector y **NO DEBEN SER ACTUALIZADAS** sin testing exhaustivo:

#### Backend Dependencies
```json
{
  "pdfkit": "^0.15.0",           ❌ NO ACTUALIZAR (usado en PDF export)
  "express": "^4.18.2",          ⚠️  CUIDADO al actualizar
  "serverless-http": "^3.2.0"    ⚠️  CUIDADO al actualizar
}
```

#### Frontend Dependencies
```json
{
  "recharts": "^2.x.x"           ⚠️  CUIDADO al actualizar (radar charts)
}
```

### 🛡️ REGLAS OBLIGATORIAS

#### 1. **PROHIBIDO MODIFICAR**
- ❌ NO cambiar la lógica de cálculo de scores
- ❌ NO modificar el formato de export PDF/CSV
- ❌ NO alterar la estructura de datos de sesiones
- ❌ NO cambiar los endpoints de la API
- ❌ NO modificar la configuración de questions.json o matrix.json
- ❌ NO tocar el manejo de Base64 en PDF export (funciona en producción)

#### 2. **PROHIBIDO ELIMINAR**
- ❌ NO borrar archivos del módulo Selector
- ❌ NO eliminar endpoints de Selector
- ❌ NO remover dependencias usadas por Selector
- ❌ NO borrar datos de sesiones guardadas

#### 3. **PROHIBIDO REFACTORIZAR**
- ❌ NO renombrar archivos del módulo Selector
- ❌ NO mover archivos a otras carpetas
- ❌ NO cambiar nombres de funciones públicas
- ❌ NO modificar interfaces/types de Selector

#### 4. **SI NECESITAS HACER CAMBIOS**
Si absolutamente necesitas modificar algo del módulo Selector:

1. ✅ Crear una rama específica: `fix-selector-[descripcion]`
2. ✅ Documentar EXACTAMENTE qué cambiarás y por qué
3. ✅ Hacer backup de los archivos originales
4. ✅ Testing exhaustivo en local
5. ✅ Testing en producción con datos de prueba
6. ✅ Obtener aprobación explícita antes de merge
7. ✅ Crear tag de versión antes del cambio

### 🎯 FUNCIONALIDAD ESTABLE

El módulo Selector actualmente incluye:

✅ **Cuestionario de 28 preguntas** - Funcionando correctamente  
✅ **Cálculo de scores** - Algoritmo validado y estable  
✅ **Recomendación de herramienta** - Lógica probada  
✅ **Export PDF** - Funciona en producción con Base64 en JSON  
✅ **Export CSV** - Funciona correctamente  
✅ **Visualización con Radar Chart** - Renderiza correctamente  
✅ **Factores decisivos** - Muestra top 5 preguntas con mayor impacto  
✅ **Persistencia de sesiones** - Guarda datos en filesystem  

### 📊 ENDPOINTS PROTEGIDOS

```
GET  /api/selector/questions                          ❌ NO MODIFICAR
POST /api/selector/session                            ❌ NO MODIFICAR
POST /api/selector/session/:sessionId/calculate       ❌ NO MODIFICAR
POST /api/selector/export/pdf                         ❌ NO MODIFICAR
POST /api/selector/export/csv                         ❌ NO MODIFICAR
```

### 🔧 CONFIGURACIÓN PROTEGIDA

#### Lambda Configuration
```
Function: assessment-center-api
Handler: dist/backend/src/lambda.handler
Runtime: nodejs20.x
Memory: 2048 MB
Timeout: 600s
Environment Variables:
  - BEDROCK_TIMEOUT_MS: 300000                        ❌ NO MODIFICAR
  - S3_BUCKET_NAME: assessment-center-files-...      ❌ NO MODIFICAR
```

#### API Gateway Configuration
```
API ID: 6tk4qqlhs6
Stage: prod
Binary Media Types: (none - intencional)              ❌ NO MODIFICAR
CORS: Habilitado para todos los orígenes              ⚠️  CUIDADO
```

### 📝 NOTAS IMPORTANTES

1. **PDF Export usa JSON con Base64**: Esta es la solución estable que funciona sin modificar API Gateway. NO cambiar a respuesta binaria.

2. **serverless-http maneja binarios automáticamente**: El código en `lambda.ts` detecta si serverless-http ya convirtió a Base64. NO modificar esta lógica.

3. **Frontend decodifica Base64 manualmente**: El código en `SelectorPhase.tsx` usa `atob()` para decodificar. NO cambiar a `response.blob()`.

4. **Datos de sesiones son críticos**: Los archivos JSON en `backend/data/selector/sessions/` contienen datos de clientes reales. NO borrar ni modificar.

### 🚀 PARA NUEVOS FEATURES

Si necesitas agregar funcionalidad nueva:

✅ **PERMITIDO**:
- Crear NUEVOS módulos en carpetas separadas
- Agregar NUEVOS endpoints que NO interfieran con Selector
- Agregar NUEVAS dependencias que NO conflictúen con las existentes
- Crear NUEVOS componentes de frontend en carpetas separadas

❌ **PROHIBIDO**:
- Modificar código existente del módulo Selector
- Compartir servicios o utilidades con Selector (crear copias si es necesario)
- Actualizar dependencias compartidas sin verificar impacto en Selector

### 📞 CONTACTO

Si tienes dudas sobre si un cambio afecta al módulo Selector:
- **PREGUNTA PRIMERO** antes de hacer cualquier cambio
- **DOCUMENTA** el impacto potencial
- **PRUEBA** exhaustivamente en local antes de desplegar

---

## 🎯 RESUMEN EJECUTIVO

**EL MÓDULO SELECTOR ESTÁ EN PRODUCCIÓN Y FUNCIONA CORRECTAMENTE.**  
**NO TOCAR A MENOS QUE SEA ABSOLUTAMENTE NECESARIO.**  
**CUALQUIER CAMBIO REQUIERE APROBACIÓN EXPLÍCITA.**

---

*Última actualización: 12 de Marzo 2026*  
*Versión estable: main @ 3c83588*
