# 🎯 Guía Rápida: Drag & Drop en Wave Planner Tool

## ⚡ Inicio Rápido (3 Pasos)

### 1️⃣ Cargar Excel
```
📁 Arrastra tu archivo Excel → Zona verde
   ↓
✅ Sistema genera olas automáticamente
```

### 2️⃣ Reorganizar con Drag & Drop
```
🖱️ Haz clic en servidor → Mantén presionado
   ↓
↔️ Arrastra a otra columna de ola
   ↓
✅ Suelta y el servidor se mueve
```

### 3️⃣ Exportar Plan
```
💾 Clic en "Descargar Plan (CSV)"
   ↓
✅ Archivo con olas actualizadas
```

## 🎨 Interfaz Visual

```
┌─────────────────────────────────────────────────────────┐
│  🚀 AWS MAP Wave Planner                                │
│  Arrastra servidores entre olas para reorganizar        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📁 Cargar Archivo Excel                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ⬆️  Arrastra Excel o haz clic                     │  │
│  │     ServerName, Criticidad, Ambiente              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📦 Organizar Servidores por Olas                       │
│                                                          │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐               │
│  │Ola 1 │  │Ola 2 │  │Ola 3 │  │Ola 4 │               │
│  │3 srv │  │5 srv │  │2 srv │  │4 srv │               │
│  │🟢2🟠1│  │🟢1🟠3│  │🟠1🔴1│  │🔴4   │               │
│  ├──────┤  ├──────┤  ├──────┤  ├──────┤               │
│  │⋮⋮    │  │⋮⋮    │  │⋮⋮    │  │⋮⋮    │               │
│  │WEB-01│  │APP-01│  │DB-01 │  │API-01│               │
│  │🟢Test│  │🟠Test│  │🔴Test│  │🔴Prod│               │
│  │      │  │      │  │      │  │      │               │
│  │⋮⋮    │  │⋮⋮    │  │⋮⋮    │  │⋮⋮    │               │
│  │WEB-02│  │APP-02│  │DB-02 │  │API-02│               │
│  └──────┘  └──────┘  └──────┘  └──────┘               │
│                                                          │
│  💡 Arrastra servidores entre columnas                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  📊 Resumen de Planificación                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Ola  │ Total │ 🟢Baja │ 🟠Media │ 🔴Alta │         │ │
│  ├──────┼───────┼────────┼─────────┼────────┤         │ │
│  │ Ola 1│   3   │   2    │    1    │   0    │         │ │
│  │ Ola 2│   5   │   1    │    3    │   1    │         │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

[Cerrar]  [💾 Descargar Plan (CSV)]
```

## 🎯 Acciones Principales

### Cargar Archivo
```
Acción: Arrastra Excel a zona verde
Resultado: Olas generadas automáticamente
Tiempo: ~2 segundos
```

### Mover Servidor
```
Acción: Arrastra servidor entre columnas
Resultado: Servidor cambia de ola
Feedback: Toast "Servidor movido a Ola X"
```

### Reasignar Automáticamente
```
Acción: Clic en botón "Reasignar Automáticamente"
Resultado: Todos los servidores reorganizados
Algoritmo: Test/Dev primero, luego Prod por criticidad
```

### Exportar Plan
```
Acción: Clic en "Descargar Plan (CSV)"
Resultado: Archivo CSV con olas actualizadas
Formato: ServerName,Criticidad,Ambiente,Ola,Dependencia
```

## 🖱️ Interacciones de Drag & Drop

### Estado 1: Normal
```
┌─────────────────┐
│ ⋮⋮ WEB-SERVER-01│  ← Cursor: move (manita)
│ 🟢 Baja  🔵 Test│
└─────────────────┘
```

### Estado 2: Arrastrando
```
┌─────────────────┐
│ ⋮⋮ WEB-SERVER-01│  ← Semi-transparente (50%)
│ 🟢 Baja  🔵 Test│     Escala reducida (95%)
└─────────────────┘
```

### Estado 3: Sobre Columna Destino
```
╔═════════════════╗  ← Borde azul brillante
║  Ola 2          ║     Fondo azul claro
║  5 servidores   ║     Escala aumentada (105%)
║                 ║
║  [Suelta aquí]  ║
╚═════════════════╝
```

### Estado 4: Movimiento Completado
```
✅ WEB-SERVER-01 movido a Ola 2
   ↓
Actualización automática de:
- Contador de servidores por ola
- Estadísticas de criticidad
- Tabla de resumen
```

## 📋 Formato del Excel

### Estructura Mínima
```
ServerName     | Criticidad | Ambiente
---------------|------------|----------
WEB-SERVER-01  | Baja       | Test
APP-SERVER-01  | Media      | Test
DB-SERVER-01   | Alta       | Prod
```

### Estructura Completa
```
ServerName     | Criticidad | Ambiente | Dependencia
---------------|------------|----------|------------------
WEB-SERVER-01  | Baja       | Test     | APP-SERVER-01
APP-SERVER-01  | Media      | Test     | DB-SERVER-01
DB-SERVER-01   | Alta       | Test     |
```

### Variaciones Aceptadas

**Nombres de Columnas:**
- ServerName → Server Name, Hostname, HOSTNAME, Server
- Criticidad → Criticality, Priority
- Ambiente → Environment, Env
- Dependencia → Dependencies

**Valores de Criticidad:**
- Baja → Low, baja, low
- Media → Medium, media, medium
- Alta → High, Critical, alta, high, critical

**Valores de Ambiente:**
- Test → test, TEST
- Dev → dev, DEV, Development
- Prod → prod, PROD, Production, Producción

## 🎨 Códigos de Color

### Criticidad
- 🟢 **Baja**: Verde claro (bg-green-100)
- 🟠 **Media**: Naranja claro (bg-orange-100)
- 🔴 **Alta**: Rojo claro (bg-red-100)

### Ambiente
- 🔵 **Todos**: Azul claro (bg-blue-100)

### Estados de Drag
- **Normal**: Blanco (bg-white)
- **Arrastrando**: Semi-transparente (opacity-50)
- **Destino**: Azul claro (bg-blue-50)

## ⚡ Atajos y Tips

### Tip 1: Reasignación Rápida
```
Si no te gusta la organización:
Clic en "Reasignar Automáticamente" → Todo se reorganiza
```

### Tip 2: Verificar Dependencias
```
Busca el símbolo → en las tarjetas
Ejemplo: → DB-SERVER-01
Significa: Este servidor depende de DB-SERVER-01
```

### Tip 3: Balancear Olas
```
Mira el contador en cada columna
Ejemplo: "5 servidores"
Arrastra servidores para balancear la carga
```

### Tip 4: Identificación Rápida
```
Usa los badges de color:
🟢 = Migración de bajo riesgo
🟠 = Migración de riesgo medio
🔴 = Migración de alto riesgo
```

## 🐛 Solución Rápida de Problemas

### Problema: No se carga el Excel
```
✓ Verifica que sea .xlsx o .xls
✓ Asegúrate de que tenga la columna ServerName
✓ Revisa que no esté vacío
```

### Problema: No puedo arrastrar
```
✓ Haz clic en el área de la tarjeta
✓ Mantén presionado el botón del mouse
✓ El cursor debe cambiar a "move"
```

### Problema: La columna no se resalta
```
✓ Arrastra sobre el área de la columna
✓ No sueltes hasta ver el resaltado azul
✓ Toda la columna es área de drop
```

### Problema: El servidor vuelve a su lugar
```
✓ Suelta dentro de una columna válida
✓ No sueltes fuera de las columnas
✓ Espera a ver el resaltado azul
```

## 📊 Algoritmo de Asignación

### Lógica Simple
```
1. Separa por ambiente:
   - Test/Dev/QA → Grupo 1
   - Prod → Grupo 2

2. Dentro de cada grupo, ordena por criticidad:
   - Baja → Ola N
   - Media → Ola N+1
   - Alta → Ola N+2

3. Resultado:
   Ola 1: Test Baja
   Ola 2: Test Media
   Ola 3: Test Alta
   Ola 4: Prod Baja
   Ola 5: Prod Media
   Ola 6: Prod Alta
```

## ✅ Checklist de Uso

### Antes de Empezar
- [ ] Tengo mi archivo Excel preparado
- [ ] El archivo tiene las columnas requeridas
- [ ] Los valores están en el formato correcto

### Durante el Uso
- [ ] Cargué el archivo Excel
- [ ] Revisé la asignación automática
- [ ] Moví servidores según necesidad
- [ ] Verifiqué las dependencias
- [ ] Revisé el resumen de planificación

### Antes de Exportar
- [ ] Todas las olas están balanceadas
- [ ] Las dependencias están en orden correcto
- [ ] Los servidores críticos están en olas apropiadas
- [ ] Revisé el contador total de servidores

### Después de Exportar
- [ ] Descargué el archivo CSV
- [ ] Verifiqué el contenido del CSV
- [ ] Compartí el plan con el equipo

## 🎓 Recursos Adicionales

- `DRAG-DROP-WAVE-PLANNER-COMPLETADO.md` - Documentación técnica completa
- `GUIA-USO-WAVE-PLANNER-EXCEL.md` - Guía de usuario detallada
- `ejemplo-servidores-wave-planner.csv` - Archivo de ejemplo

---

**💡 Tip Final**: Experimenta con el drag & drop. Es intuitivo y seguro. Siempre puedes usar "Reasignar Automáticamente" para volver al inicio.

**🚀 Estado**: ✅ Listo para usar en `http://localhost:3005/`
