# 🚀 Configuración de Amplify - Paso a Paso

## ✅ Pre-configuración Completada

- ✅ Código en GitHub: `rekyli198/assessment-center`
- ✅ Backend funcionando: `https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod`
- ✅ Rate limiting configurado: 5 req/s, 1000/día
- ✅ Amplify Console abierta en tu navegador

---

## 📋 Sigue Estos Pasos Exactos

### Paso 1: Tipo de Deploy

En la página que se abrió:

1. Verás **"Host your web app"**
2. Click en **"Get started"** bajo **"Amplify Hosting"**

---

### Paso 2: Conectar Repositorio

1. **Selecciona**: **GitHub**

2. Click **"Continue"**

3. **Autorizar AWS Amplify**:
   - Se abrirá una ventana de GitHub
   - Click **"Authorize AWS Amplify"**
   - Puede pedirte tu contraseña de GitHub

4. **Seleccionar repositorio**:
   - En "Recently updated repositories", busca:
   - Repository: **`rekyli198/assessment-center`**
   - Branch: **`main`**

5. Click **"Next"**

---

### Paso 3: Configurar Build Settings

1. **App name**: `assessment-center` (dejar como está)

2. **Build and test settings**:
   - Amplify detectará automáticamente `frontend/amplify.yml` ✅
   - NO cambies nada aquí

3. **Environment variables** (MUY IMPORTANTE):
   - Click **"Advanced settings"** para expandir

   **Agregar variable**:
   - Click **"Add environment variable"**
   - Variable 1:
     - Key: `VITE_API_URL`
     - Value: `https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod`

4. Click **"Next"**

---

### Paso 4: 🔒 Configurar Password Protection

**ESTE ES EL PASO MÁS IMPORTANTE PARA SEGURIDAD**

1. En la página de Review, ANTES de hacer deploy:
   - Busca la sección **"Access control - optional"**
   - Click **"Manage access"**

2. **Enable access control**:
   - ✅ Check **"Restrict access"**
   - Tipo: **"Username and password"**

3. **Configurar credenciales**:
   - Username: `assessment-admin`
   - Password: `AssessmentMVP@2024!`

   *Puedes usar otra contraseña fuerte si prefieres*

4. Click **"Save"**

---

### Paso 5: Iniciar Deploy

1. Revisa el resumen:
   - Repository: `rekyli198/assessment-center`
   - Branch: `main`
   - Build directory: `frontend`
   - Environment variable: `VITE_API_URL` configurada ✅
   - Access control: Enabled ✅

2. Click **"Save and deploy"**

---

### Paso 6: Esperar Deployment (5-10 minutos)

Verás el progreso en 4 fases:

1. **Provision** ⏳ (1 min)
   - Preparando infraestructura

2. **Build** ⏳ (3-5 min)
   - Instalando dependencias
   - Compilando React

3. **Deploy** ⏳ (1 min)
   - Subiendo a CloudFront

4. **Verify** ✅
   - ¡Listo!

**NO cierres la ventana**. Puedes ver los logs en tiempo real.

---

### Paso 7: Obtener URL

Cuando termine (marca ✅ verde):

1. Verás en la parte superior:
   ```
   https://main.d[xxxxxxx].amplifyapp.com
   ```

2. **COPIA ESTA URL** - es tu app deployada

---

## ✅ Verificación

### Test 1: Password Protection

1. Abre la URL en una ventana incógnita
2. Deberías ver un **cuadro de login**
3. Ingresa:
   - Username: `assessment-admin`
   - Password: `AssessmentMVP@2024!`
4. Deberías ver tu aplicación ✅

### Test 2: Funcionalidad Completa

1. Sube un archivo Excel de prueba
2. Llena el formulario de cliente
3. Genera un reporte
4. Descarga el documento Word

**Todo debería funcionar** ✅

---

## 🔒 Compartir el MVP

### ✅ Forma Segura:

**Mensaje 1 (Email)**:
```
Hola,

Puedes acceder al MVP del Assessment Center en:
[TU-URL-DE-AMPLIFY]

Te envío las credenciales por WhatsApp.
```

**Mensaje 2 (WhatsApp - separado)**:
```
Credenciales:
User: assessment-admin
Pass: AssessmentMVP@2024!
```

---

## 🎯 URLs Finales

Después del deployment, tendrás:

| Servicio | URL |
|----------|-----|
| **Frontend** | `https://main.d[xxxxxxx].amplifyapp.com` |
| **Backend API** | `https://6tk4qqlhs6.execute-api.us-east-1.amazonaws.com/prod` |
| **Amplify Console** | https://console.aws.amazon.com/amplify/home?region=us-east-1 |

---

## 🔧 Si Algo Sale Mal

### Build Failed

1. Ve a **Build logs** en Amplify Console
2. Busca el error
3. Usualmente es por:
   - Variables de entorno faltantes
   - Ruta incorrecta del build

**Solución**:
- Click **"Redeploy this version"**

### No Pide Contraseña

1. Ve a Amplify Console → Tu app
2. **Access control**
3. Verifica que esté **Enabled**
4. Re-deploy si es necesario

### Error 404

1. Verifica que la ruta base en `frontend/amplify.yml` sea correcta
2. Re-deploy

---

## 📊 Monitoreo Post-Deployment

### Ver Logs de Build

1. Amplify Console → Tu app
2. Click en el build más reciente
3. Puedes ver logs completos

### Ver Métricas

1. Amplify Console → Monitoring
2. Verás:
   - Requests
   - Data transfer
   - Build minutes

---

## 💰 Costos Estimados

Con tu configuración:
- **Amplify Hosting**: $1-3/mes (primeros GB gratis)
- **Build minutes**: $0.01/min (primeros 1000 min gratis)
- **Data transfer**: Primeros 15 GB gratis

**Total MVP**: ~$5-10/mes (muy controlado)

---

## 🎊 Siguiente Paso

Una vez que veas el ✅ verde en Amplify:

1. Copia tu URL
2. Pruébala en incógnito
3. Verifica que pida contraseña
4. ¡Comparte con tu equipo!

---

**¿Problemas durante el deployment?** Avísame y te ayudo en tiempo real.
