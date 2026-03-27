# Guía del Mapa de Dependencias

## Descripción

El módulo de Mapa de Dependencias permite visualizar y analizar las conexiones de red entre servidores y aplicaciones en tu infraestructura. Es compatible con archivos Excel generados por herramientas de descubrimiento como:

- **Matilda**
- **Cloudamize**
- **Concierto**
- **AWS Migration Portfolio Assessment (MPA)**

## Características

### 1. Carga de Archivos
- Soporta archivos Excel (.xlsx, .xls)
- Detección automática de hojas de dependencias
- Procesamiento de múltiples formatos de columnas

### 2. Visualización Interactiva
- Grafo de red interactivo con ReactFlow
- Nodos representan servidores y aplicaciones
- Flechas muestran direcciones de conexión
- Etiquetas con protocolo y puerto

### 3. Búsqueda Avanzada
- Búsqueda por nombre de servidor
- Visualización de dependencias transitivas (hasta 2 niveles)
- Filtrado automático de conexiones relacionadas

### 4. Análisis de Dependencias
- Conexiones entrantes (incoming)
- Conexiones salientes (outgoing)
- Servidores relacionados
- Aplicaciones relacionadas

## Formato del Archivo Excel

### Columnas Requeridas

El archivo debe contener una hoja con información de dependencias. Las columnas pueden tener diferentes nombres (el sistema detecta automáticamente):

#### Origen (Source)
- `source`, `origen`, `from`, `source_server`, `source_host`
- `servidor_origen`, `host_origen`, `source hostname`

#### Destino (Destination)
- `destination`, `destino`, `to`, `dest`, `destination_server`
- `servidor_destino`, `host_destino`, `destination hostname`

#### Puerto (Port)
- `port`, `puerto`, `destination_port`, `dest_port`
- `puerto_destino`, `destination port`

#### Protocolo (Protocol)
- `protocol`, `protocolo`, `proto`
- Por defecto: TCP

### Columnas Opcionales

- **Servicio**: `service`, `servicio`, `service_name`
- **Aplicación Origen**: `source_app`, `source_application`, `app_origen`
- **Aplicación Destino**: `destination_app`, `dest_app`, `app_destino`
- **IP Origen**: `source_ip`, `ip_origen`
- **IP Destino**: `destination_ip`, `dest_ip`, `ip_destino`

### Ejemplo de Estructura

```
| Source Server | Destination Server | Port | Protocol | Service Name | Source App | Destination App |
|---------------|-------------------|------|----------|--------------|------------|-----------------|
| WEB-SERVER-01 | APP-SERVER-01     | 8080 | TCP      | HTTP         | Frontend   | Backend         |
| APP-SERVER-01 | DB-SERVER-01      | 3306 | TCP      | MySQL        | Backend    | Database        |
| APP-SERVER-01 | CACHE-SERVER-01   | 6379 | TCP      | Redis        | Backend    | Cache           |
```

## Cómo Usar

### Paso 1: Acceder al Módulo
1. Abre la aplicación MAP
2. Ve a la fase **Assess**
3. Selecciona la pestaña **Mapa de Dependencias**

### Paso 2: Cargar Archivo
1. Haz clic en "Seleccionar archivo"
2. Elige tu archivo Excel de dependencias
3. Haz clic en "Cargar"
4. Espera a que se procese el archivo

### Paso 3: Visualizar el Mapa Completo
- El grafo mostrará todos los servidores y sus conexiones
- Los nodos azules son servidores
- Los nodos verdes son aplicaciones
- Las flechas muestran la dirección del flujo de datos
- Las etiquetas muestran protocolo:puerto

### Paso 4: Buscar Dependencias Específicas
1. Ingresa el nombre del servidor en el campo de búsqueda
2. Haz clic en "Buscar" o presiona Enter
3. El sistema mostrará:
   - Conexiones entrantes al servidor
   - Conexiones salientes del servidor
   - Servidores relacionados
   - Aplicaciones relacionadas
   - Grafo filtrado con dependencias transitivas

### Paso 5: Explorar el Grafo
- **Zoom**: Usa la rueda del mouse o los controles
- **Pan**: Arrastra el fondo del grafo
- **Mover nodos**: Arrastra los nodos individuales
- **Ver detalles**: Pasa el mouse sobre las conexiones

## Casos de Uso

### 1. Planificación de Migración
- Identifica dependencias críticas antes de migrar
- Agrupa servidores por aplicación
- Planifica el orden de migración basado en dependencias

### 2. Análisis de Impacto
- Evalúa el impacto de apagar un servidor
- Identifica puntos únicos de fallo
- Documenta conexiones para troubleshooting

### 3. Seguridad y Compliance
- Mapea flujos de datos sensibles
- Identifica conexiones no autorizadas
- Documenta reglas de firewall necesarias

### 4. Optimización de Arquitectura
- Identifica cuellos de botella
- Detecta dependencias circulares
- Simplifica arquitecturas complejas

## Estadísticas Mostradas

- **Total de Dependencias**: Número total de conexiones
- **Servidores Únicos**: Cantidad de servidores diferentes
- **Aplicaciones Únicas**: Cantidad de aplicaciones identificadas
- **Puertos Únicos**: Cantidad de puertos diferentes utilizados

## Limitaciones

- Máximo 2 niveles de dependencias transitivas en búsqueda
- Los datos se almacenan en memoria (sesión temporal)
- Archivos muy grandes (>10,000 dependencias) pueden ser lentos

## Troubleshooting

### El archivo no se carga
- Verifica que sea un archivo Excel válido (.xlsx o .xls)
- Asegúrate de que tenga una hoja con datos de dependencias
- Revisa que las columnas tengan nombres reconocibles

### No se encuentran resultados en la búsqueda
- Verifica el nombre exacto del servidor
- La búsqueda es case-insensitive pero debe coincidir parcialmente
- Asegúrate de que el servidor exista en el archivo cargado

### El grafo se ve desordenado
- Usa los controles de zoom para ajustar la vista
- Arrastra los nodos para reorganizarlos manualmente
- Haz búsquedas específicas para ver subconjuntos más pequeños

## Integración con AWS

Este módulo complementa el análisis de migración AWS al:
- Identificar grupos de migración lógicos
- Documentar requisitos de Security Groups
- Planificar VPCs y subnets basados en patrones de comunicación
- Estimar costos de transferencia de datos entre servicios

## Próximas Mejoras

- Exportar grafo como imagen
- Filtros por protocolo y puerto
- Detección automática de aplicaciones
- Sugerencias de Security Groups AWS
- Análisis de latencia y ancho de banda
