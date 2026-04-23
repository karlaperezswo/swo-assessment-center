# Menú Desplegable - Explicación

## ¿Qué se implementó?

Se creó un sistema de menú desplegable (accordion) en el sidebar para la sección "MAP Assessment", donde las sub-páginas están ocultas por defecto y se muestran al hacer clic.

## Cambios Realizados

### 1. Nuevo Archivo JavaScript (`scripts.js`)
- Controla el comportamiento de mostrar/ocultar submenús
- Agrega flechas indicadoras (▼/▲)
- Detecta automáticamente si estás en una sub-página y mantiene el menú abierto

### 2. CSS Actualizado (`styles.css`)
- Los submenús están ocultos por defecto (`display: none`)
- Se muestran solo cuando el elemento padre tiene la clase `open`
- Animación suave de la flecha al abrir/cerrar
- Ya NO se muestran al hacer hover

### 3. Estructura del Menú
```
MAP Assessment (clickeable)
  ├─ ▼ (flecha para expandir/contraer)
  └─ Submenú (oculto por defecto)
      ├─ Kickoff Interno
      ├─ Selección de Herramienta
      ├─ Instalación de Agentes
      ├─ Recolección de Datos
      ├─ Validación y Análisis
      ├─ Business Case
      ├─ Plan de Migración
      └─ Presentación Ejecutiva
```

## Cómo Funciona

### Comportamiento del Usuario:
1. **Estado Inicial:** El submenú de "MAP Assessment" está oculto
2. **Click en "MAP Assessment":** El submenú se despliega y muestra las opciones
3. **Click nuevamente:** El submenú se contrae y oculta
4. **Click en la flecha (▼):** También expande/contrae el menú
5. **Si estás en una sub-página:** El menú se mantiene abierto automáticamente

### Indicadores Visuales:
- **Flecha hacia abajo (▼):** Menú cerrado
- **Flecha hacia arriba (▲):** Menú abierto
- **Fondo destacado:** Página actual activa

## Páginas Creadas

### Páginas Nuevas (Sub-páginas de MAP Assessment):
1. ✅ `map-kickoff-interno.html` - Kickoff Interno (CREADA)
2. ⏳ `map-seleccion-herramienta.html` - Selección de Herramienta (pendiente)
3. ⏳ `map-instalacion-agentes.html` - Instalación de Agentes (pendiente)
4. ⏳ `map-recoleccion-datos.html` - Recolección de Datos (pendiente)
5. ⏳ `map-validacion-analisis.html` - Validación y Análisis (pendiente)
6. ⏳ `map-business-case.html` - Business Case (pendiente)
7. ⏳ `map-plan-migracion.html` - Plan de Migración (pendiente)
8. ⏳ `map-presentacion.html` - Presentación Ejecutiva (pendiente)

## Próximos Pasos

Para completar la implementación, necesito crear las 7 páginas restantes. Cada una seguirá la misma estructura que `map-kickoff-interno.html`:

- Header con logos
- Sidebar con menú desplegable
- Breadcrumbs de navegación
- Contenido específico de cada tema
- Botones de navegación (anterior/siguiente)
- Footer
- Script incluido

## Cómo Probar

1. Abre `index.html` en tu navegador
2. Observa el menú lateral
3. Haz click en "MAP Assessment"
4. El submenú debería desplegarse mostrando las 8 opciones
5. Haz click nuevamente para contraerlo
6. Click en "Kickoff Interno" para ir a esa página
7. El menú debería mantenerse abierto automáticamente

## Ventajas de esta Implementación

✅ **Menú más limpio:** No muestra todas las opciones todo el tiempo
✅ **Mejor organización:** Agrupa sub-páginas bajo su página padre
✅ **Navegación intuitiva:** Click para expandir/contraer
✅ **Indicadores visuales:** Flechas que muestran el estado
✅ **Memoria de estado:** Si estás en una sub-página, el menú permanece abierto
✅ **Escalable:** Fácil agregar más sub-páginas en el futuro

## ¿Quieres que cree las páginas restantes?

Dime si quieres que:
1. Cree todas las páginas restantes ahora
2. Cree solo algunas específicas
3. Te explique cómo crear más páginas tú mismo

El sistema de menú desplegable ya está funcionando. Solo falta crear el contenido de las páginas restantes.
