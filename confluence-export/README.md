# Exportación a Confluence - Instrucciones

## ¿Qué necesitas para que yo lo haga automáticamente?

Para que pueda subir todo automáticamente a Confluence, necesito que me proporciones:

### 1. URL de Confluence
Ejemplo: `https://softwareone.atlassian.net` o `https://tuempresa.confluence.com`

### 2. Credenciales de API
- **Email:** Tu email de Confluence
- **API Token:** Token de acceso (ver cómo obtenerlo abajo)

### 3. Información del Espacio
- **Space Key:** Clave del espacio (ej: "MAP", "WIKI", "DOCS")
- **Space Name:** Nombre del espacio (ej: "MAP Assessment Wiki")

---

## Cómo obtener un API Token

1. Ve a: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click en **"Create API token"**
3. Dale un nombre: "Wiki MAP Import"
4. Click en **"Create"**
5. **Copia el token** (solo se muestra una vez)
6. Guárdalo en un lugar seguro

---

## Cómo encontrar tu Space Key

1. Ve a tu espacio en Confluence
2. Mira la URL en el navegador
3. Busca algo como: `/wiki/spaces/MAP/` 
4. El Space Key es la parte después de `/spaces/` (en este caso: "MAP")

---

## Opción 1: Dame los datos y yo lo hago

**Comparte conmigo de forma segura:**
```
URL de Confluence: https://_____.atlassian.net
Email: _____@_____.com
API Token: _____
Space Key: _____
```

**Yo haré:**
1. Configurar el script con tus credenciales
2. Ejecutar la importación automática
3. Crear todas las páginas con la jerarquía correcta
4. Configurar los enlaces entre páginas
5. Verificar que todo se importó correctamente

**Tiempo estimado:** 5-10 minutos

---

## Opción 2: Hazlo tú mismo

### Paso 1: Instalar Python
Si no tienes Python instalado:
- Windows: https://www.python.org/downloads/
- Mac: Ya viene instalado
- Linux: `sudo apt install python3`

### Paso 2: Instalar dependencias
```bash
pip install requests
```

### Paso 3: Configurar credenciales
Edita el archivo `auto-upload.py` y completa:
```python
CONFLUENCE_URL = "https://tuempresa.atlassian.net"
CONFLUENCE_EMAIL = "tu-email@empresa.com"
CONFLUENCE_API_TOKEN = "tu-api-token-aqui"
CONFLUENCE_SPACE_KEY = "MAP"
```

### Paso 4: Ejecutar el script
```bash
# Navega a la carpeta del proyecto
cd "ruta/a/tu/proyecto"

# Ejecuta el script
python confluence-export/auto-upload.py
```

### Paso 5: Verificar
Ve a tu espacio en Confluence y verifica que todas las páginas se crearon correctamente.

---

## Opción 3: Importación Manual (Sin script)

Si prefieres no usar scripts, puedes hacerlo manualmente:

### Método Simple (Copiar y Pegar):
1. Abre cada archivo HTML en tu navegador
2. Selecciona todo el contenido (Ctrl+A)
3. Copia (Ctrl+C)
4. En Confluence, crea una nueva página
5. Pega el contenido (Ctrl+V)
6. Confluence convertirá el formato automáticamente

### Orden de páginas a crear:
1. Inicio (index.html)
2. Introducción al Programa MAP
3. MAP Assessment
4. Herramientas de Colecta
   - Cloudamize (como página hija)
   - Concierto (como página hija)
   - Matilda (como página hija)
5. Cuestionario de Infraestructura
6. Diagrama de Infraestructura
7. Immersion Days
8. Checklist de Entregables Finales
9. Recursos y Descargables
10. Preguntas Frecuentes (FAQ)
11. Glosario de Términos
12. Contacto y Soporte

---

## Ventajas de cada opción

### Opción 1 (Yo lo hago):
✅ Más rápido (5-10 minutos)
✅ Sin configuración técnica
✅ Garantizo que funcione
✅ Jerarquía perfecta
⚠️ Necesitas compartir credenciales (de forma segura)

### Opción 2 (Tú lo haces con script):
✅ Automático
✅ Mantiene control de credenciales
✅ Reutilizable para actualizaciones
⚠️ Requiere Python instalado
⚠️ Configuración técnica básica

### Opción 3 (Manual):
✅ Sin configuración técnica
✅ Control total del proceso
✅ No requiere credenciales de API
⚠️ Toma más tiempo (30-60 minutos)
⚠️ Más propenso a errores

---

## Recomendación

**Si tienes prisa:** Opción 1 (yo lo hago)
**Si eres técnico:** Opción 2 (script automático)
**Si prefieres control manual:** Opción 3 (copiar y pegar)

---

## Seguridad de Credenciales

Si decides compartir credenciales conmigo:
- Usa un canal seguro (no email sin cifrar)
- Puedes revocar el API token después
- El token solo da acceso a Confluence, no a otros sistemas
- Puedes crear un token temporal solo para la importación

---

## ¿Preguntas?

Dime qué opción prefieres y te ayudo con los siguientes pasos.
