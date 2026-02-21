# 🌐 Guía: Compartir tu App con Port Forwarding

Esta guía te explica cómo compartir tu aplicación AWS Assessment Generator con otras personas usando **VSCode Port Forwarding**, sin necesidad de subirla a un servidor.

---

## ✅ Requisitos Previos

- ✓ VSCode instalado
- ✓ Estar logueado con GitHub en VSCode (esquina inferior izquierda)
- ✓ Node.js instalado
- ✓ Dependencias instaladas (`npm install`)

---

## 📋 Pasos Detallados

### **PASO 1: Inicia el Backend**

Opción A - Script automático (recomendado):
```powershell
.\start-portforward.bat
```

Opción B - Manual:
```powershell
cd backend
npm run dev
```

Deberías ver:
```
✅ Server running on http://localhost:4000
```

---

### **PASO 2: Expón el Backend a Internet**

1. En VSCode, presiona **`Ctrl+J`** (abre el panel inferior)

2. Haz clic en la pestaña **"PORTS"** (junto a Terminal, Output, etc.)

3. Verás algo como:
   ```
   Port    Running Process
   4000    node
   ```

4. **Clic derecho** en el puerto **4000**

5. Selecciona: **"Port Visibility"** → **"Public"**

6. Aparecerá una columna "Forwarded Address" con una URL como:
   ```
   https://xyz789-4000.preview.app.github.dev
   ```

7. **¡IMPORTANTE!** Copia esta URL completa (incluyendo `https://`)

---

### **PASO 3: Configura el Frontend**

1. Abre el archivo:
   ```
   frontend\.env.portforward
   ```

2. Reemplaza la línea `VITE_API_URL` con la URL que copiaste:
   ```env
   VITE_API_URL=https://xyz789-4000.preview.app.github.dev
   ```

3. **Guarda el archivo** (`Ctrl+S`)

---

### **PASO 4: Inicia el Frontend en Modo Port Forwarding**

Abre una **nueva terminal** en VSCode (`Ctrl+Shift+ñ` o menú Terminal → New Terminal)

```powershell
cd frontend
npm run dev:portforward
```

Deberías ver:
```
✅ VITE v5.x.x ready in XXX ms
➜  Local:   http://localhost:3000/
```

---

### **PASO 5: Expón el Frontend a Internet**

1. Ve de nuevo al panel **"PORTS"** en VSCode

2. Ahora verás dos puertos:
   ```
   Port    Running Process       Forwarded Address
   3000    vite                  (aparecerá después del paso 4)
   4000    node                  https://xyz-4000.preview.app.github.dev
   ```

3. **Clic derecho** en el puerto **3000**

4. Selecciona: **"Port Visibility"** → **"Public"**

5. Aparecerá una URL como:
   ```
   https://abc123-3000.preview.app.github.dev
   ```

---

### **PASO 6: ¡Comparte la URL!**

🎉 **¡Listo!** Comparte la URL del puerto **3000** con cualquier persona:
```
https://abc123-3000.preview.app.github.dev
```

---

## 🔍 Verificación

Para verificar que todo funciona:

1. Abre la URL del frontend en un **navegador privado/incógnito**
2. Sube un archivo Excel
3. Genera un reporte

Si funciona en modo incógnito, funcionará para cualquier persona con la URL.

---

## ⚠️ Importante

### Seguridad
- ✅ Las URLs son **públicas** pero difíciles de adivinar (tienen un hash aleatorio)
- ✅ Requiere que estés logueado con GitHub en VSCode
- ⚠️ Cualquier persona con la URL puede acceder
- ⚠️ No compartas estas URLs en lugares públicos si manejas datos sensibles

### Disponibilidad
- 🟢 La aplicación está disponible **mientras VSCode esté abierto**
- 🔴 Si cierras VSCode, las URLs dejan de funcionar
- 🔴 Si tu computadora se apaga/suspende, las URLs dejan de funcionar

### Limitaciones
- 📊 No es para uso en producción (solo demos, pruebas, compartir con clientes)
- ⏱️ Puede tener algo de latencia dependiendo de tu conexión
- 💾 Los archivos subidos se procesan en tu computadora local

---

## 🐛 Solución de Problemas

### Error: "Cannot connect to backend"

**Causa:** El frontend no puede comunicarse con el backend

**Solución:**
1. Verifica que ambos puertos (3000 y 4000) estén marcados como **"Public"** en el panel PORTS
2. Verifica que la URL en `frontend\.env.portforward` sea correcta (debe incluir `https://`)
3. Reinicia el frontend: `Ctrl+C` → `npm run dev:portforward`

---

### Error: "Port already in use"

**Causa:** Los puertos 3000 o 4000 ya están siendo usados

**Solución:**
```powershell
# Ver qué proceso usa el puerto
netstat -ano | findstr :3000
netstat -ano | findstr :4000

# Matar el proceso (reemplaza PID con el número que te da netstat)
taskkill /PID <PID> /F
```

---

### El frontend carga pero muestra errores en consola

**Solución:**
1. Presiona **F12** para abrir DevTools
2. Ve a la pestaña **Console**
3. Busca errores que mencionen la URL del backend
4. Verifica que `VITE_API_URL` en `.env.portforward` sea correcta

---

### Las URLs cambian cada vez que reinicio VSCode

**Causa:** Es comportamiento normal de VSCode Port Forwarding

**Solución:**
- Las URLs son temporales y cambian al reiniciar
- Si necesitas URLs permanentes, usa **ngrok** o **Railway**

---

## 🔄 Alternativa: ngrok

Si VSCode Port Forwarding no funciona, puedes usar **ngrok**:

### Instalación:
```powershell
# Con Chocolatey
choco install ngrok

# O descarga desde https://ngrok.com/download
```

### Uso:
```powershell
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: ngrok para backend
ngrok http 4000
# Copia la URL generada (ej: https://abc.ngrok-free.app)

# Terminal 3: Frontend
# 1. Edita frontend\.env.portforward con la URL de ngrok
# 2. Luego ejecuta:
cd frontend
npm run dev:portforward

# Terminal 4: ngrok para frontend
ngrok http 3000
# Comparte esta URL con tus usuarios
```

---

## 📞 ¿Necesitas Ayuda?

Si tienes problemas:
1. Revisa los logs en ambas terminales (backend y frontend)
2. Verifica el panel PORTS en VSCode
3. Abre DevTools (F12) en el navegador y revisa la consola
4. Verifica que estés logueado con GitHub en VSCode

---

**¡Disfruta compartiendo tu aplicación!** 🚀
