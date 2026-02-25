# Guía Rápida - Reinicio del Sistema

## 🚀 Inicio Rápido

### Opción 1: Inicio Limpio (Recomendado)
```bash
INICIO-LIMPIO.bat
```

Este script hace todo automáticamente:
- ✅ Detiene procesos existentes
- ✅ Limpia archivos compilados
- ✅ Compila el backend
- ✅ Inicia backend y frontend
- ✅ Verifica la conexión

### Opción 2: Solo Reiniciar
```bash
REINICIAR-TODO.bat
```

Reinicia los servicios sin limpiar:
- ✅ Detiene procesos existentes
- ✅ Compila el backend
- ✅ Inicia backend y frontend
- ✅ Verifica la conexión

### Opción 3: Solo Detener
```bash
DETENER-TODO.bat
```

Solo detiene todos los servicios:
- ✅ Detiene backend (puerto 4000)
- ✅ Detiene frontend (puerto 3005)

## 🔧 Solución de Problemas

### Problema: "No se pudo conectar con el servidor"

**Solución Rápida:**
```bash
1. DETENER-TODO.bat
2. Espera 5 segundos
3. INICIO-LIMPIO.bat
```

### Problema: "Puerto ya en uso"

**Solución:**
```bash
DETENER-TODO.bat
```

Luego inicia nuevamente con:
```bash
INICIO-LIMPIO.bat
```

### Problema: "Error al compilar el backend"

**Solución:**
```bash
cd backend
npm install
cd ..
INICIO-LIMPIO.bat
```

### Problema: Ventanas de Backend/Frontend cerradas accidentalmente

**Solución:**
```bash
REINICIAR-TODO.bat
```

## 📋 Verificación Manual

### 1. Verificar Backend
Abre una terminal y ejecuta:
```bash
curl http://localhost:4000/health
```

Deberías ver:
```json
{"status":"ok","timestamp":"..."}
```

### 2. Verificar Frontend
Abre tu navegador en:
```
http://localhost:3005
```

Deberías ver la aplicación cargando.

### 3. Verificar Conexión Completa
```bash
5-PROBAR-CONEXION.bat
```

## 🎯 Flujo Recomendado

### Primera Vez
```bash
1. 1-INSTALAR-NODEJS.bat
2. 2-INSTALAR-DEPENDENCIAS.bat
3. INICIO-LIMPIO.bat
```

### Uso Diario
```bash
REINICIAR-TODO.bat
```

### Si Hay Problemas
```bash
1. DETENER-TODO.bat
2. Espera 5 segundos
3. INICIO-LIMPIO.bat
```

## 📊 Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend  | 4000   | http://localhost:4000 |
| Frontend | 3005   | http://localhost:3005 |

## ⚠️ Notas Importantes

1. **NO cierres las ventanas** de Backend y Frontend mientras uses la aplicación

2. **Si cambias código del backend**, necesitas reiniciar:
   ```bash
   REINICIAR-TODO.bat
   ```

3. **Si cambias código del frontend**, Vite recarga automáticamente (no necesitas reiniciar)

4. **Para detener todo** al final del día:
   ```bash
   DETENER-TODO.bat
   ```

## 🆘 Ayuda Adicional

Si después de usar `INICIO-LIMPIO.bat` sigues teniendo problemas:

1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes de error en rojo
4. Copia los errores
5. Revisa también la terminal del Backend

### Errores Comunes

**"EADDRINUSE: address already in use"**
- Solución: `DETENER-TODO.bat` y luego `INICIO-LIMPIO.bat`

**"Cannot find module"**
- Solución: `cd backend && npm install && cd .. && cd frontend && npm install && cd ..`

**"TypeScript compilation failed"**
- Solución: Revisa los errores de TypeScript en la terminal
- Puede haber errores de sintaxis en el código

## 📞 Comandos de Emergencia

### Matar todos los procesos de Node.js (Usar con cuidado)
```bash
taskkill /F /IM node.exe
```

### Ver qué está usando el puerto 4000
```bash
netstat -ano | findstr :4000
```

### Ver qué está usando el puerto 3005
```bash
netstat -ano | findstr :3005
```

## ✅ Checklist de Verificación

Después de ejecutar `INICIO-LIMPIO.bat`, verifica:

- [ ] Ventana "Backend Server" abierta
- [ ] Ventana "Frontend Server" abierta
- [ ] Backend muestra: "Server running on http://localhost:4000"
- [ ] Frontend muestra: "Local: http://localhost:3005"
- [ ] `5-PROBAR-CONEXION.bat` pasa exitosamente
- [ ] http://localhost:3005 carga en el navegador
- [ ] No hay errores en la consola del navegador

Si todos los checks pasan, ¡estás listo para usar la aplicación! 🎉
