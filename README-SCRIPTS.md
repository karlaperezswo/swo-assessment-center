# 📚 Guía de Scripts del Proyecto

## 🎯 Scripts Principales

### 1️⃣ Instalación Inicial

#### `1-INSTALAR-NODEJS.bat`
Verifica si Node.js está instalado y te guía para instalarlo si es necesario.

```bash
1-INSTALAR-NODEJS.bat
```

#### `2-INSTALAR-DEPENDENCIAS.bat`
Instala todas las dependencias del proyecto (backend y frontend).

```bash
2-INSTALAR-DEPENDENCIAS.bat
```

### 2️⃣ Inicio del Proyecto

#### `3-INICIAR-PROYECTO.bat` ⭐ (Uso Normal)
Inicia el backend y frontend en modo desarrollo.

```bash
3-INICIAR-PROYECTO.bat
```

#### `INICIO-LIMPIO.bat` ⭐⭐ (Recomendado para Problemas)
Inicio limpio completo: detiene procesos, limpia, compila e inicia todo.

```bash
INICIO-LIMPIO.bat
```

#### `REINICIAR-TODO.bat`
Reinicia backend y frontend sin limpiar archivos.

```bash
REINICIAR-TODO.bat
```

### 3️⃣ Gestión de Servicios

#### `DETENER-TODO.bat`
Detiene todos los servicios (backend y frontend).

```bash
DETENER-TODO.bat
```

### 4️⃣ Pruebas y Diagnóstico

#### `4-GENERAR-DATOS-EJEMPLO.bat`
Genera un archivo Excel de ejemplo con dependencias de prueba.

```bash
4-GENERAR-DATOS-EJEMPLO.bat
```

#### `5-PROBAR-CONEXION.bat`
Verifica que el backend esté funcionando correctamente.

```bash
5-PROBAR-CONEXION.bat
```

## 🔄 Flujos de Trabajo

### Primera Vez (Instalación Completa)
```bash
1. 1-INSTALAR-NODEJS.bat
2. 2-INSTALAR-DEPENDENCIAS.bat
3. INICIO-LIMPIO.bat
4. 4-GENERAR-DATOS-EJEMPLO.bat (opcional)
```

### Uso Diario Normal
```bash
3-INICIAR-PROYECTO.bat
```

### Cuando Hay Problemas de Conexión
```bash
1. DETENER-TODO.bat
2. Espera 5 segundos
3. INICIO-LIMPIO.bat
4. 5-PROBAR-CONEXION.bat
```

### Al Final del Día
```bash
DETENER-TODO.bat
```

## 🎨 Diagrama de Flujo

```
┌─────────────────────────────────────────┐
│  ¿Primera vez usando el proyecto?      │
└─────────────┬───────────────────────────┘
              │
         ┌────▼────┐
         │   SÍ    │
         └────┬────┘
              │
    ┌─────────▼──────────┐
    │ 1-INSTALAR-NODEJS  │
    └─────────┬──────────┘
              │
    ┌─────────▼────────────────┐
    │ 2-INSTALAR-DEPENDENCIAS  │
    └─────────┬────────────────┘
              │
    ┌─────────▼──────────┐
    │  INICIO-LIMPIO     │
    └─────────┬──────────┘
              │
         ┌────▼────┐
         │   NO    │
         └────┬────┘
              │
    ┌─────────▼──────────────┐
    │ ¿Hay problemas?        │
    └─────────┬──────────────┘
              │
         ┌────▼────┐
         │   SÍ    │
         └────┬────┘
              │
    ┌─────────▼──────────┐
    │  DETENER-TODO      │
    └─────────┬──────────┘
              │
    ┌─────────▼──────────┐
    │  INICIO-LIMPIO     │
    └─────────┬──────────┘
              │
         ┌────▼────┐
         │   NO    │
         └────┬────┘
              │
    ┌─────────▼──────────────┐
    │ 3-INICIAR-PROYECTO     │
    └─────────┬──────────────┘
              │
    ┌─────────▼──────────────┐
    │  Usar la aplicación    │
    └─────────┬──────────────┘
              │
    ┌─────────▼──────────┐
    │  DETENER-TODO      │
    │  (al terminar)     │
    └────────────────────┘
```

## 📖 Descripción Detallada

### Scripts de Instalación

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `1-INSTALAR-NODEJS.bat` | Verifica/instala Node.js | Primera vez |
| `2-INSTALAR-DEPENDENCIAS.bat` | Instala npm packages | Primera vez o después de actualizar |

### Scripts de Inicio

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `3-INICIAR-PROYECTO.bat` | Inicio normal | Uso diario |
| `INICIO-LIMPIO.bat` | Inicio limpio completo | Problemas de conexión |
| `REINICIAR-TODO.bat` | Reinicio rápido | Después de cambios en backend |

### Scripts de Gestión

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `DETENER-TODO.bat` | Detener servicios | Al terminar o antes de reiniciar |

### Scripts de Prueba

| Script | Propósito | Cuándo Usar |
|--------|-----------|-------------|
| `4-GENERAR-DATOS-EJEMPLO.bat` | Crear archivo de prueba | Para probar la aplicación |
| `5-PROBAR-CONEXION.bat` | Verificar backend | Diagnosticar problemas |

## 🔍 Solución de Problemas por Script

### `3-INICIAR-PROYECTO.bat` no funciona
**Solución:**
```bash
INICIO-LIMPIO.bat
```

### Backend no se conecta
**Solución:**
```bash
1. DETENER-TODO.bat
2. 5-PROBAR-CONEXION.bat (para verificar)
3. INICIO-LIMPIO.bat
```

### Puerto ya en uso
**Solución:**
```bash
DETENER-TODO.bat
```

### Error de compilación
**Solución:**
```bash
cd backend
npm install
cd ..
INICIO-LIMPIO.bat
```

## 💡 Tips y Trucos

### Tip 1: Verificación Rápida
Después de iniciar, siempre ejecuta:
```bash
5-PROBAR-CONEXION.bat
```

### Tip 2: Generar Datos de Prueba
Para probar rápidamente:
```bash
4-GENERAR-DATOS-EJEMPLO.bat
```
Esto crea `sample-dependencies.xlsx`

### Tip 3: Reinicio Rápido
Si hiciste cambios en el backend:
```bash
REINICIAR-TODO.bat
```

### Tip 4: Limpieza Completa
Si nada funciona:
```bash
1. DETENER-TODO.bat
2. Elimina carpetas node_modules (backend y frontend)
3. 2-INSTALAR-DEPENDENCIAS.bat
4. INICIO-LIMPIO.bat
```

## 🎓 Guías Adicionales

- `GUIA-RAPIDA-REINICIO.md` - Guía de reinicio del sistema
- `GUIA-COMPLETA-CARGA-ARCHIVOS.md` - Guía de carga de archivos
- `DIAGNOSTICO-CARGA-ARCHIVOS.md` - Diagnóstico de problemas
- `TABLA-DEPENDENCIAS-MEJORADA.md` - Características de la tabla

## 🆘 Ayuda

Si ningún script funciona:

1. Verifica que Node.js esté instalado:
   ```bash
   node --version
   ```

2. Verifica que npm esté instalado:
   ```bash
   npm --version
   ```

3. Reinstala dependencias:
   ```bash
   2-INSTALAR-DEPENDENCIAS.bat
   ```

4. Intenta inicio limpio:
   ```bash
   INICIO-LIMPIO.bat
   ```

## 📞 Comandos Útiles

### Ver procesos en puertos
```bash
netstat -ano | findstr :4000
netstat -ano | findstr :3005
```

### Matar proceso específico
```bash
taskkill /F /PID [número_de_proceso]
```

### Ver logs del backend
Revisa la ventana "Backend Server"

### Ver logs del frontend
Revisa la ventana "Frontend Server"

## ✅ Checklist de Funcionamiento

Después de ejecutar cualquier script de inicio:

- [ ] Ventana "Backend Server" abierta
- [ ] Ventana "Frontend Server" abierta
- [ ] Backend: "Server running on http://localhost:4000"
- [ ] Frontend: "Local: http://localhost:3005"
- [ ] `5-PROBAR-CONEXION.bat` pasa
- [ ] http://localhost:3005 carga
- [ ] No hay errores en consola

¡Si todos pasan, estás listo! 🎉
