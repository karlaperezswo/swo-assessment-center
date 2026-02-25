# 📋 Instrucciones de Instalación Manual

## ⚠️ Node.js No Está Instalado

Para que el módulo de dependencias funcione, necesitas instalar Node.js primero.

---

## 🔧 PASO 1: Instalar Node.js

### Opción A: Instalación Automática con Permisos de Administrador

1. **Cierra esta terminal**
2. **Abre PowerShell como Administrador:**
   - Presiona `Windows + X`
   - Selecciona "Windows PowerShell (Administrador)" o "Terminal (Administrador)"
3. **Navega a la carpeta del proyecto:**
   ```powershell
   cd C:\kiro\swo-assessment-center
   ```
4. **Ejecuta el script de instalación:**
   ```powershell
   .\1-INSTALAR-NODEJS.bat
   ```
5. **Sigue las instrucciones en pantalla**

### Opción B: Instalación Manual (Recomendada)

1. **Abre tu navegador**
2. **Ve a:** https://nodejs.org/
3. **Descarga la versión LTS** (Long Term Support - recomendada)
   - Busca el botón verde que dice "LTS"
   - Versión recomendada: v20.x o superior
4. **Ejecuta el instalador descargado**
   - Acepta los términos y condiciones
   - Usa las opciones por defecto
   - Asegúrate de marcar "Add to PATH"
5. **Reinicia tu terminal** (cierra y abre una nueva)
6. **Verifica la instalación:**
   ```batch
   node --version
   npm --version
   ```

---

## 🚀 PASO 2: Instalar Dependencias del Proyecto

Una vez que Node.js esté instalado:

1. **Abre una nueva terminal** (PowerShell o CMD)
2. **Navega a la carpeta del proyecto:**
   ```batch
   cd C:\kiro\swo-assessment-center
   ```
3. **Ejecuta el script de instalación:**
   ```batch
   INSTALAR-CON-DEPENDENCIAS.bat
   ```

Este script:
- ✅ Instala dependencias del backend
- ✅ Instala dependencias del frontend (incluyendo reactflow)
- ✅ Genera archivo de ejemplo `sample-dependencies.xlsx`

**Tiempo estimado:** 5-10 minutos

---

## 🎮 PASO 3: Iniciar la Aplicación

Después de instalar las dependencias:

1. **Ejecuta el script de inicio:**
   ```batch
   3-INICIAR-PROYECTO.bat
   ```

2. **Espera a que se inicien ambos servicios:**
   - Backend: http://localhost:4000
   - Frontend: http://localhost:5173

3. **Abre tu navegador en:** http://localhost:5173

---

## 🗺️ PASO 4: Usar el Módulo de Dependencias

1. En la aplicación, ve a la fase **"Assess"**
2. Haz clic en la pestaña **"Mapa de Dependencias"**
3. Carga el archivo **`sample-dependencies.xlsx`**
4. Explora el grafo interactivo
5. Prueba la búsqueda con "APP-SERVER-01"

---

## ✅ Verificación Rápida

Después de instalar Node.js, verifica que todo esté correcto:

```batch
# Verificar Node.js
node --version
# Debe mostrar: v20.x.x o superior

# Verificar npm
npm --version
# Debe mostrar: 10.x.x o superior
```

---

## 🐛 Solución de Problemas

### Problema: "node no se reconoce como comando"

**Solución:**
1. Reinicia tu terminal completamente
2. Si persiste, reinicia tu computadora
3. Verifica que Node.js esté en el PATH:
   - Abre "Variables de entorno"
   - Busca "Path" en variables del sistema
   - Debe incluir: `C:\Program Files\nodejs\`

### Problema: "npm no se reconoce como comando"

**Solución:**
- npm se instala automáticamente con Node.js
- Si no funciona, reinstala Node.js

### Problema: Error de permisos al instalar dependencias

**Solución:**
1. Abre PowerShell como Administrador
2. Ejecuta: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Intenta nuevamente

---

## 📞 Ayuda Adicional

Si tienes problemas:

1. **Verifica la versión de Windows:**
   - Node.js requiere Windows 10 o superior

2. **Revisa los logs:**
   - Los errores se muestran en la terminal

3. **Documentación oficial:**
   - https://nodejs.org/en/docs/

---

## 📝 Resumen de Comandos

```batch
# 1. Verificar Node.js (después de instalar)
node --version
npm --version

# 2. Instalar dependencias del proyecto
INSTALAR-CON-DEPENDENCIAS.bat

# 3. Iniciar aplicación
3-INICIAR-PROYECTO.bat

# 4. Abrir en navegador
# http://localhost:5173
```

---

## 🎯 Próximos Pasos

Una vez completada la instalación:

1. ✅ Node.js instalado
2. ✅ Dependencias instaladas
3. ✅ Aplicación iniciada
4. ✅ Módulo de dependencias funcionando

**¡Listo para mapear tus dependencias!** 🗺️✨

---

**Nota:** Si necesitas ayuda adicional, revisa los archivos:
- `LEEME-PRIMERO-DEPENDENCIAS.md`
- `INICIO-RAPIDO-DEPENDENCIAS.md`
- `DEPENDENCY-MAP-GUIDE.md`
