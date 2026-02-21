// Textos de la aplicación en español

export const TEXTS = {
  // Header
  header: {
    title: 'Centro de Evaluación de Migración AWS',
    subtitle: 'Evaluar → Movilizar → Migrar y Modernizar',
    poweredBy: 'Desarrollado por',
  },

  // Phases
  phases: {
    assess: {
      name: 'EVALUAR',
      subtitle: 'Crear un caso de cambio',
      tabs: {
        rapidDiscovery: 'Descubrimiento Rápido',
        tcoReport: 'Reporte TCO',
        migrationReadiness: 'Preparación para Migración',
        briefingsWorkshops: 'Briefings y Talleres',
        immersionDay: 'Día de Inmersión',
      },
    },
    mobilize: {
      name: 'MOVILIZAR',
      subtitle: 'Construir preparación a través de experiencias',
      groups: {
        portfolio: 'Portafolio',
        people: 'Personas',
        platform: 'Plataforma',
      },
      tabs: {
        discoveryPlanning: 'Descubrimiento y Planificación',
        migrationPlan: 'Plan de Migración',
        businessCase: 'Caso de Negocio',
        skillsCoe: 'Habilidades y CoE',
        landingZone: 'Landing Zone',
        securityCompliance: 'Seguridad y Cumplimiento',
      },
    },
    migrate: {
      name: 'MIGRAR Y MODERNIZAR',
      subtitle: 'Acelerar la transformación a escala',
      groups: {
        migrate: 'Migrar',
        optimize: 'Optimizar',
        modernize: 'Modernizar',
      },
      tabs: {
        ec2Recommendations: 'Recomendaciones EC2',
        rdsRecommendations: 'Recomendaciones RDS',
        migrationWaves: 'Olas de Migración',
        costOptimization: 'Optimización de Costos',
        modernizationRoadmap: 'Hoja de Ruta de Modernización',
      },
    },
  },

  // Common
  common: {
    reset: 'Reiniciar Todo',
    complete: 'Completar',
    phase: 'Fase',
    completed: 'Completada',
    planned: 'Planificado',
    inProgress: 'En Progreso',
    blocked: 'Bloqueado',
    cancel: 'Cancelar',
    save: 'Guardar',
    edit: 'Editar',
    delete: 'Eliminar',
    add: 'Agregar',
    addNotes: 'Agregar notas...',
  },

  // File Uploader
  fileUploader: {
    title: 'Cargar Excel MPA',
    dragDrop: 'Arrastra y suelta el archivo Excel aquí',
    dragDropActive: 'Suelta el archivo Excel aquí',
    orClick: 'o haz clic para seleccionar archivo (.xlsx)',
    processing: 'Procesando',
    parsingSheets: 'Analizando hojas de Excel',
    uploadFailed: 'Carga Fallida',
    tryAgain: 'Haz clic para intentar de nuevo',
    servers: 'Servidores',
    databases: 'Bases de Datos',
    applications: 'Aplicaciones',
    totalGB: 'GB Totales',
  },

  // Client Form
  clientForm: {
    title: 'Información del Cliente',
    clientName: 'Nombre del Cliente',
    vertical: 'Sector Industrial',
    region: 'Región AWS',
    onPremisesCost: 'Costo Anual On-Premises (USD)',
    companyDescription: 'Descripción de la Empresa',
    migrationReadiness: 'Preparación para Migración',
    priorities: 'Prioridades del Proyecto',
    reportDate: 'Fecha del Reporte',
    verticals: {
      technology: 'Tecnología',
      finance: 'Finanzas',
      healthcare: 'Salud',
      retail: 'Retail',
      manufacturing: 'Manufactura',
      energy: 'Energía',
      education: 'Educación',
      government: 'Gobierno',
      other: 'Otro',
    },
    readiness: {
      ready: 'Listo',
      evaluating: 'Evaluando',
      planning: 'Planificando',
    },
    priorityOptions: {
      cost: 'Reducción de Costos',
      speed: 'Velocidad de Migración',
      security: 'Seguridad y Cumplimiento',
      innovation: 'Innovación y Modernización',
    },
  },

  // Phase Complete Button
  phaseComplete: {
    completePhase: 'Completar Fase de',
    phaseCompleted: 'Fase Completada',
    requirements: 'Requisitos para completar esta fase:',
    assess: {
      requirements: [
        'Cargar archivo Excel MPA',
        'Ingresar nombre del cliente',
        'Ingresar costo anual on-premises',
      ],
    },
    mobilize: {
      requirements: [
        'Completar fase de Evaluación',
        'Definir al menos 1 ola de migración',
        'Iniciar configuración de Landing Zone (marcar al menos 1 item)',
      ],
    },
    migrate: {
      requirements: [
        'Completar fase de Movilización',
        'Generar reporte de evaluación final',
      ],
    },
  },

  // Empty States
  emptyStates: {
    noData: 'No hay datos disponibles',
    uploadInAssess: 'Carga tu archivo Excel MPA en la fase de Evaluación',
    completeAssess: 'Completa la fase de Evaluación para ver el caso de negocio',
    uploadDataFirst: 'Carga datos e ingresa información del cliente en la pestaña de Evaluación',
  },
};
