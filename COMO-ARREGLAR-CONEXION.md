# 🔧 Cómo Arreglar el Error de Conexión

## ❌ PROBLEMA

```
Error: No se pudo conectar con el servidor
Error: ERR_NETWORK
Error: ECONNREFUSED
```

---

## ✅ SOLUCIÓN AUTOMÁTICA (Recomendada)

### Ejecuta este comando:

```bash
ARREGLAR-CONEXION.bat
```

o

```bash
SOLUCION-RAPIDA.bat
```

### ¿Qué hace este script?

1. ✅ Detiene procesos existentes
2. ✅ Verifica dependencias instaladas
3. ✅ Compila el backend
4. ✅ Inicia backend (puerto 4000)
5. ✅ Inicia frontend (puerto 3005)
6. ✅ Verifica la conexión
7. ✅ Abre el navegador automáticamente

### Tiempo: ~30 segundos

---

## 🎯 DESPUÉS DE EJECUTAR

Verás 2 ventanas abiertas:

### Ventana 1: Backend (Azul)
```
╔════════════════════════════════════════╗
║     BACKEND - SERVIDOR LOCAL          ║
╚════════════════════════════════════════╝

✅ Server running on http://localhost:4000
```

### Ventana 2: Frontend (Amarillo)
```
╔════════════════════════════════════════╗
║     FRONTEND - APLICACIÓN WEB         ║
╚════════════════════════════════════════╝

➜  Local:   http://localhost:3005/
```

### ⚠️ NO CIERRES ESTAS VENTANAS

---

## 🌐 ACCEDER AL MÓDULO

1. Abre tu navegador en: **http://localhost:3005**
2. Click en **"Assess"**
3. Click en **"Mapa de Dependencias"**
4. ¡Listo! El módulo está funcionando

---

## 🐛 SI AÚN NO FUNCIONA

### Opción 1: Diagnóstico Completo
```bash
6-DIAGNOSTICO-COMPLETO.bat
```

Este script te dirá exactamente qué está fallando.

### Opción 2: Inicio Limpio
```bash
INICIO-LIMPIO.bat
```

Este script hace una limpieza completa y reinicia todo.

### Opción 3: Detener y Reiniciar
```bash
DETENER-TODO.bat
```
Espera 5 segundos, luego:
```bash
ARREGLAR-CONEXION.bat
```

---

## 📊 VERIFICACIÓN MANUAL

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

### 3. Verificar Puertos
```bash
netstat -ano | findstr :4000
netstat -ano | findstr :3005
```

Deberías ver procesos escuchando en ambos puertos.

---

## 🔍 CAUSAS COMUNES DEL ERROR

### 1. Backend No Ejecutándose
**Síntoma:** Error de conexión al cargar archivo

**Causa:** El servidor backend no está iniciado

**Solución:** `ARREGLAR-CONEXION.bat`

### 2. Puerto Ocupado
**Síntoma:** Error "EADDRINUSE"

**Causa:** Otro proceso usa el puerto 4000 o 3005

**Solución:** `DETENER-TODO.bat` luego `ARREGLAR-CONEXION.bat`

### 3. Dependencias Faltantes
**Síntoma:** Error al iniciar backend o frontend

**Causa:** node_modules no instalados

**Solución:** El script `ARREGLAR-CONEXION.bat` lo detecta y soluciona automáticamente

### 4. Backend No Compilado
**Síntoma:** Error al ejecutar backend

**Causa:** Carpeta dist no existe

**Solución:** El script `ARREGLAR-CONEXION.bat` compila automáticamente

---

## 💡 PREVENCIÓN

### Para evitar el error en el futuro:

1. **Siempre inicia con el script:**
   ```bash
   ARREGLAR-CONEXION.bat
   ```

2. **No cierres las ventanas del backend y frontend**

3. **Al terminar, detén correctamente:**
   ```bash
   DETENER-TODO.bat
   ```

---

## 📝 RESUMEN

### El error de conexión se debe a:
❌ Backend no está ejecutándose

### La solución es:
✅ Iniciar el backend

### El script automático:
✅ `ARREGLAR-CONEXION.bat` hace todo por ti

---

## 🎯 FLUJO CORRECTO

```
1. Ejecutar: ARREGLAR-CONEXION.bat
        ↓
2. Esperar 30 segundos
        ↓
3. Ver 2 ventanas abiertas (Backend + Frontend)
        ↓
4. Abrir: http://localhost:3005
        ↓
5. Ir a: Assess → Mapa de Dependencias
        ↓
6. ¡Funciona! ✅
```

---

## 🆘 AYUDA ADICIONAL

Si después de ejecutar `ARREGLAR-CONEXION.bat` sigues teniendo problemas:

1. Ejecuta: `6-DIAGNOSTICO-COMPLETO.bat`
2. Copia el resultado
3. Revisa los logs en las ventanas del Backend y Frontend
4. Verifica que no haya errores en rojo

---

## ✅ CHECKLIST

Después de ejecutar `ARREGLAR-CONEXION.bat`:

- [ ] Ventana "Backend - Servidor Local" abierta (azul)
- [ ] Ventana "Frontend - Aplicación Web" abierta (amarilla)
- [ ] Backend muestra: "Server running on http://localhost:4000"
- [ ] Frontend muestra: "Local: http://localhost:3005"
- [ ] http://localhost:3005 carga en el navegador
- [ ] Tab "Mapa de Dependencias" visible
- [ ] Botones "Seleccionar Archivo" y "Cargar" visibles

Si todos los checks pasan, ¡el error está arreglado! 🎉

---

## 🎬 PRÓXIMOS PASOS

Una vez que el error esté arreglado:

1. ✅ Genera un archivo de prueba: `4-GENERAR-DATOS-EJEMPLO.bat`
2. ✅ Carga el archivo en el módulo
3. ✅ Explora las dependencias
4. ✅ Exporta a PDF o Word
5. ✅ Disfruta del módulo funcionando

---

**El error de conexión es simple: el backend no está ejecutándose.**

**La solución es simple: ejecutar `ARREGLAR-CONEXION.bat`**

**¡Listo en 30 segundos!** ⚡
