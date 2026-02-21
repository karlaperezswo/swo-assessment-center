// Traducciones para el documento Word en español

export const TRANSLATIONS = {
  // Portada
  TITLE: 'Reporte de Análisis de Evaluación',
  VERSION: 'Versión 1.0',

  // Tabla de contenidos
  TABLE_OF_CONTENTS: 'Tabla de Contenidos',

  // Secciones principales
  SECTION_1_TITLE: '1. PROYECCIÓN DE COSTOS MULTI-AÑOS',
  SECTION_1_1: '1.1 Descripción General del Proyecto',
  SECTION_1_2: '1.2 Descripción de la Empresa',
  SECTION_1_3: '1.3 Prioridades del Cliente',
  SECTION_1_4: '1.4 Alcance del Proyecto',

  SECTION_2_TITLE: '2. ANÁLISIS DE COSTOS',
  SECTION_2_1: '2.1 Costos Actuales On-Premises',
  SECTION_2_1_TEXT: 'Costo estimado actual on-premises anual',
  SECTION_2_2: '2.2 Resumen del Modelo de Costos',
  SECTION_2_3: 'Los Costos On-Premises Incluyen:',
  SECTION_2_4: 'Los Costos On-Premises Excluyen:',

  SECTION_3_TITLE: '3. DESGLOSE DE COSTOS PARA SERVICIOS AWS INICIALES',
  SECTION_3_1: '3.1 Instancias Amazon EC2',
  SECTION_3_2: '3.2 Almacenamiento Amazon EBS',
  SECTION_3_3: '3.3 Bases de Datos Amazon RDS',
  SECTION_3_4: '3.4 Resumen de Costos AWS',
  SECTION_3_5: 'Enlaces a la Calculadora AWS',

  SECTION_4_TITLE: '4. INGRESOS RECURRENTES ANUALES (ARR)',
  SECTION_4_TEXT: 'La siguiente tabla muestra los costos proyectados durante un período de 3 años para diferentes modelos de precios:',
  SECTION_4_SAVINGS: 'Ahorros Potenciales de 3 Años con Instancias Reservadas',

  SECTION_5_TITLE: '5. REQUISITOS COMERCIALES Y CONTRACTUALES',
  SECTION_5_1: '5.1 Requisitos de SLA de Tiempo de Actividad',
  SECTION_5_2: '5.2 Requisitos de Seguridad y Cumplimiento',
  SECTION_5_3: '5.3 Recuperación ante Desastres y Continuidad del Negocio',

  SECTION_6_TITLE: '6. PREPARACIÓN DEL CLIENTE PARA MIGRAR',
  SECTION_6_TEXT: 'Basado en los hallazgos de la evaluación y las discusiones con el cliente, se han identificado los siguientes factores de preparación:',

  SECTION_7_TITLE: '7. ENLACES DE SOPORTE Y DOCUMENTOS',
  SECTION_7_1: '7.1 Arquitectura Objetivo de Alto Nivel',
  SECTION_7_2: '7.2 Análisis de las 7Rs',
  SECTION_7_3: '7.3 Esfuerzo de Migración - Movilizar y Migrar',
  SECTION_7_4: '7.4 Enlaces a Estimaciones de Costos',

  // Tabla de información
  VERTICAL_INDUSTRY: 'Vertical/Industria',
  AWS_REGION: 'Región AWS',
  TOTAL_SERVERS_SCOPE: 'Total de Servidores en Alcance',
  REPORT_DATE: 'Fecha del Reporte',
  TOTAL_SERVERS: 'Total de Servidores',
  TOTAL_DATABASES: 'Total de Bases de Datos',
  TOTAL_APPLICATIONS: 'Total de Aplicaciones',
  TOTAL_STORAGE: 'Almacenamiento Total (GB)',

  // Costos on-premises
  ONPREM_INCLUDES: [
    'Costos de hardware',
    'Licencias de software',
    'Mantenimiento y soporte',
    'Instalaciones de centros de datos',
    'Energía y refrigeración'
  ],
  ONPREM_EXCLUDES: [
    'Costos de personal',
    'Infraestructura de red',
    'Sistemas de seguridad'
  ],

  // Tabla de servidores EC2
  EC2_TABLE_HEADERS: ['Hostname', 'SO', 'vCPUs', 'RAM (GB)', 'Almacenamiento (GB)', 'Instancia Recomendada', 'Costo Mensual'],

  // Tabla de bases de datos
  DB_TABLE_HEADERS: ['Nombre DB', 'Motor Origen', 'Servicio Destino', 'Clase de Instancia', 'Tamaño (GB)', 'Costo Mensual'],

  // Tabla de comparación de costos
  COST_TABLE_HEADERS: ['Modelo de Precios', 'Costo Mensual', 'Costo Anual', 'Costo 3 Años'],
  PRICING_ONDEMAND: 'On-Demand',
  PRICING_1YEAR: 'Reservada 1 Año (NURI)',
  PRICING_3YEAR: 'Reservada 3 Años (NURI)',

  // Resumen de costos AWS
  AWS_COST_HEADERS: ['Servicio', 'Costo Mensual (On-Demand)'],
  SERVICE_EC2: 'Amazon EC2',
  SERVICE_EBS: 'Amazon EBS',
  SERVICE_RDS: 'Amazon RDS',
  SERVICE_NETWORKING: 'Redes (VPC, NAT)',
  TOTAL: 'TOTAL',

  // Almacenamiento
  TOTAL_STORAGE_TEXT: 'Almacenamiento Total',
  STORAGE_TYPE: 'Tipo de Almacenamiento',
  STORAGE_TYPE_GP3: 'gp3 (SSD de Propósito General)',
  ESTIMATED_MONTHLY_COST: 'Costo Mensual Estimado',

  // Enlaces calculadora
  CALCULATOR_LINKS_TEXT: 'Enlaces a la Calculadora AWS',
  CALC_ONDEMAND: 'On-Demand',
  CALC_1YEAR: 'Reservada 1 Año (NURI)',
  CALC_3YEAR: 'Reservada 3 Años (NURI)',

  // Tabla ARR
  ARR_TABLE_HEADERS: ['Modelo de Precios', 'Año 1', 'Año 2', 'Año 3', 'Total'],

  // Tabla SLA
  SLA_TABLE_HEADERS: ['Nivel SLA', 'Tiempo Activo', 'Tiempo Inactivo/Año', 'Servicios AWS'],
  SLA_STANDARD: 'Estándar',
  SLA_HIGH: 'Alta Disponibilidad',
  SLA_CRITICAL: 'Misión Crítica',
  SLA_STANDARD_SERVICES: 'EC2, RDS Una-AZ',
  SLA_HIGH_SERVICES: 'RDS Multi-AZ, ALB',
  SLA_CRITICAL_SERVICES: 'Multi-Región, Route 53',

  // Tabla de seguridad
  SECURITY_TABLE_HEADERS: ['Requisito', 'Solución AWS', 'Estado'],
  SECURITY_REQ_1: 'Cifrado de Datos en Reposo',
  SECURITY_REQ_2: 'Cifrado de Datos en Tránsito',
  SECURITY_REQ_3: 'Gestión de Identidades',
  SECURITY_REQ_4: 'Seguridad de Red',
  SECURITY_REQ_5: 'Certificaciones de Cumplimiento',
  SECURITY_SOL_1: 'AWS KMS, Cifrado EBS',
  SECURITY_SOL_2: 'TLS 1.2+, ACM',
  SECURITY_SOL_3: 'AWS IAM, SSO',
  SECURITY_SOL_4: 'VPC, Grupos de Seguridad, NACLs',
  SECURITY_SOL_5: 'SOC 2, ISO 27001, HIPAA',
  AVAILABLE: 'Disponible',

  // Tabla DR
  DR_TABLE_HEADERS: ['Estrategia DR', 'RPO', 'RTO', 'Impacto en Costos'],
  DR_BACKUP: 'Backup y Restauración',
  DR_PILOT: 'Pilot Light',
  DR_WARM: 'Warm Standby',
  DR_MULTISITE: 'Multi-Sitio Activo-Activo',
  COST_LOW: 'Bajo',
  COST_MEDIUM: 'Medio',
  COST_MEDIUM_HIGH: 'Medio-Alto',
  COST_HIGH: 'Alto',

  // Estado de preparación
  READINESS_READY: 'Listo para Migrar',
  READINESS_EVALUATING: 'Evaluando Actualmente',
  READINESS_NOT_READY: 'Aún No Está Listo',
  READINESS_STATUS: 'Estado Actual',
  READINESS_FACTORS: [
    'Evaluación de preparación técnica completada',
    'Dependencias de aplicaciones mapeadas',
    'Inventario de infraestructura documentado',
    'Análisis de costos proporcionado'
  ],

  // 7Rs
  SEVEN_RS_TABLE_HEADERS: ['Estrategia de Migración', 'Cantidad de Servidores', 'Porcentaje'],
  SEVEN_RS_REHOST: 'Rehost (Lift & Shift)',
  SEVEN_RS_REPLATFORM: 'Replatform',
  SEVEN_RS_REFACTOR: 'Refactor',
  SEVEN_RS_REPURCHASE: 'Repurchase',
  SEVEN_RS_RETIRE: 'Retire',
  SEVEN_RS_RETAIN: 'Retain',

  // Esfuerzo de migración
  EFFORT_TABLE_HEADERS: ['Fase', 'Actividades', 'Horas Estimadas'],
  EFFORT_MOBILIZE: 'Movilizar',
  EFFORT_MOBILIZE_ACT: 'Planificación, Arquitectura, Landing Zone',
  EFFORT_MIGRATE_SERVERS: 'Migrar - Servidores',
  EFFORT_MIGRATE_SERVERS_ACT: 'Migración y validación de servidores',
  EFFORT_MIGRATE_DBS: 'Migrar - Bases de Datos',
  EFFORT_MIGRATE_DBS_ACT: 'Migración y validación de bases de datos',
  EFFORT_OPTIMIZE: 'Optimizar',
  EFFORT_OPTIMIZE_ACT: 'Ajuste de rendimiento, optimización de costos',

  // Prioridades del cliente
  PRIORITY_REDUCED_COSTS: 'Reducción de costos de infraestructura',
  PRIORITY_OPERATIONAL_RESILIENCE: 'Mejorar la resiliencia operativa',
  PRIORITY_BUSINESS_AGILITY: 'Agilidad empresarial',
  PRIORITY_ENVIRONMENT_UPDATED: 'Entorno siempre actualizado',
  PRIORITY_MODERNIZE_DATABASES: 'Modernizar cargas de trabajo de bases de datos',
  PRIORITY_SECURITY_COMPLIANCE: 'Cumplimiento de seguridad',

  // Misc
  NO_DESCRIPTION: 'No se proporcionó descripción.',
  ARCHITECTURE_PLACEHOLDER: '[Diagrama de arquitectura para insertar]',
};
