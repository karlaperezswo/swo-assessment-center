# 🚀 Guía Rápida - Levantar el Proyecto

## Paso 1: Instalar Node.js (si no lo tienes)

1. Ve a: https://nodejs.org/
2. Descarga la versión **LTS** (Long Term Support)
3. Ejecuta el instalador con las opciones por defecto
4. Reinicia tu terminal/PowerShell

Para verificar que se instaló correctamente:
```powershell
node --version
npm --version
```

## Paso 2: Instalar Dependencias

Haz doble clic en:
```
SETUP-COMPLETO.bat
```

Este script instalará automáticamente todas las dependencias necesarias para:
- Proyecto raíz
- Backend (Express + TypeScript)
- Frontend (React + Vite)

## Paso 3: Iniciar el Proyecto

Haz doble clic en:
```
INICIAR-PROYECTO.bat
```

Esto iniciará:
- **Backend** en http://localhost:4000
- **Frontend** en http://localhost:3000

El navegador se abrirá automáticamente en http://localhost:3000

## ⚠️ Importante

- NO cierres la ventana negra (terminal) mientras uses la aplicación
- Para detener los servidores: presiona `Ctrl+C` en la terminal
- Si algo falla, revisa que Node.js esté instalado correctamente

## 🎯 ¿Qué hace cada archivo?

- `SETUP-COMPLETO.bat` → Instala todas las dependencias (solo una vez)
- `INICIAR-PROYECTO.bat` → Inicia backend + frontend
- `package.json` → Configuración del proyecto

## 🐛 Problemas Comunes

### "Node.js no está instalado"
→ Instala Node.js desde https://nodejs.org/ y reinicia la terminal

### "Puerto 3000 o 4000 ya está en uso"
→ Cierra otras aplicaciones que usen esos puertos

### "Error al instalar dependencias"
→ Ejecuta en PowerShell:
```powershell
npm cache clean --force
```
Luego ejecuta `SETUP-COMPLETO.bat` nuevamente

## 📚 Más Información

Lee el archivo `README.md` para:
- Documentación completa
- Cómo usar la aplicación
- Estructura del proyecto
- API endpoints
