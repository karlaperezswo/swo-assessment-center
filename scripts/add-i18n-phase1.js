const fs = require('fs');
const base = 'c:/Users/karla.perez/KiroProjects/swo-assessment-center/frontend/public/locales/';

const additions = {
  'en.json': {
    opportunitiesFilters: { priorityLabel: 'Priority' },
    assess: { tabs: { executiveSummary: 'Executive Summary' } },
    phaseNavigator: {
      assess:     { label: 'ASSESS',               subtitle: 'Build a case for change' },
      mobilize:   { label: 'MOBILIZE',             subtitle: 'Build readiness through experiences' },
      migrate:    { label: 'MIGRATE & MODERNIZE',  subtitle: 'Accelerate transformation at scale' },
      techMemory: { label: 'TECHNICAL MEMORY',     subtitle: 'AWS technical documentation with APA standards' }
    },
    executiveSummary: {
      subtitle:               'AWS Migration Business Case',
      annualCostReduction:    'Annual Cost Reduction',
      perYear:                '/year',
      roi3Year:               '3-Year ROI',
      paybackPeriod:          'Payback Period',
      months:                 'months',
      tcoSavings3Year:        '3-Year TCO Savings',
      vsOnPremises:           'vs. On-Premises',
      infrastructure:         'Infrastructure',
      serversToMigrate:       'Servers to migrate',
      annualOnPremises:       'Annual On-Premises',
      currentCost:            'Current cost',
      awsAnnual3ANURI:        'AWS Annual (3Y NURI)',
      optimizedCost:          'Optimized cost',
      inventoryTitle:         'Infrastructure Inventory',
      servers:                'Servers',
      databases:              'Databases',
      applications:           'Applications',
      totalStorageGB:         'Total Storage (GB)',
      osDistribution:         'OS Distribution',
      dependenciesTitle:      'Dependency Complexity',
      connections:            'Connections',
      mappedDBs:              'Mapped DBs',
      mappedApps:             'Mapped Apps',
      topServersByDeps:       'Top servers by dependencies',
      connectionsSuffix:      'connections',
      wavesPlanTitle:         'Migration Wave Plan',
      wavesDefined:           'Waves defined',
      serversPlanned:         'Servers planned',
      wavesCompleted:         'Waves completed',
      pricingComparisonTitle: 'AWS Pricing Comparison',
      savingsPerYear:         'Save {{amount}}/year',
      perMonth:               '/mo',
      perYearShort:           '/yr',
      riskTitle:              'Risk Indicators — EOL Operating Systems',
      serverEOL_one:          'server with EOL OS',
      serverEOL_other:        'servers with EOL OS',
      riskHigh:               '⚠️ High risk — requires immediate attention',
      riskMedium:             '⚠️ Medium risk — plan priority migration',
      riskLow:                'ℹ️ Low risk — include in migration plan',
      continueToMobilize:     'Continue to Mobilize',
      savingsApprox36:        '~36% savings',
      bestValue:              'BEST VALUE'
    }
  },
  'es-MX.json': {
    opportunitiesFilters: { priorityLabel: 'Prioridad' },
    assess: { tabs: { executiveSummary: 'Resumen Ejecutivo' } },
    phaseNavigator: {
      assess:     { label: 'EVALUAR',             subtitle: 'Crear un caso de cambio' },
      mobilize:   { label: 'MOVILIZAR',           subtitle: 'Construir preparación a través de experiencias' },
      migrate:    { label: 'MIGRAR Y MODERNIZAR', subtitle: 'Acelerar la transformación a escala' },
      techMemory: { label: 'MEMORIA TÉCNICA',subtitle: 'Documentación técnica AWS con normas APA' }
    },
    executiveSummary: {
      subtitle:               'Caso de Negocio de Migración a AWS',
      annualCostReduction:    'Reducción de Costo Anual',
      perYear:                '/año',
      roi3Year:               'ROI a 3 Años',
      paybackPeriod:          'Período de Recuperación',
      months:                 'meses',
      tcoSavings3Year:        'Ahorro TCO 3 Años',
      vsOnPremises:           'vs. On-Premises',
      infrastructure:         'Infraestructura',
      serversToMigrate:       'Servidores a migrar',
      annualOnPremises:       'Anual On-Premises',
      currentCost:            'Costo actual',
      awsAnnual3ANURI:        'AWS Anual (3A NURI)',
      optimizedCost:          'Costo optimizado',
      inventoryTitle:         'Inventario de Infraestructura',
      servers:                'Servidores',
      databases:              'Bases de Datos',
      applications:           'Aplicaciones',
      totalStorageGB:         'Storage Total (GB)',
      osDistribution:         'Distribución de SO',
      dependenciesTitle:      'Complejidad de Dependencias',
      connections:            'Conexiones',
      mappedDBs:              'BDs mapeadas',
      mappedApps:             'Apps mapeadas',
      topServersByDeps:       'Top servidores por dependencias',
      connectionsSuffix:      'conexiones',
      wavesPlanTitle:         'Plan de Olas de Migración',
      wavesDefined:           'Olas definidas',
      serversPlanned:         'Servidores planificados',
      wavesCompleted:         'Olas completadas',
      pricingComparisonTitle: 'Comparativa de Precios AWS',
      savingsPerYear:         'Ahorra {{amount}}/año',
      perMonth:               '/mo',
      perYearShort:           '/yr',
      riskTitle:              'Indicadores de Riesgo — SO Fuera de Soporte',
      serverEOL_one:          'servidor con SO fuera de soporte',
      serverEOL_other:        'servidores con SO fuera de soporte',
      riskHigh:               '⚠️ Riesgo alto — requiere atención inmediata',
      riskMedium:             '⚠️ Riesgo medio — planificar migración prioritaria',
      riskLow:                'ℹ️ Riesgo bajo — incluir en plan de migración',
      continueToMobilize:     'Continuar a Mobilize',
      savingsApprox36:        '~36% ahorro',
      bestValue:              'MEJOR VALOR'
    }
  },
  'pt-BR.json': {
    opportunitiesFilters: { priorityLabel: 'Prioridade' },
    assess: { tabs: { executiveSummary: 'Resumo Executivo' } },
    phaseNavigator: {
      assess:     { label: 'AVALIAR',             subtitle: 'Criar um caso de mudança' },
      mobilize:   { label: 'MOBILIZAR',           subtitle: 'Construir prontidão através de experiências' },
      migrate:    { label: 'MIGRAR E MODERNIZAR', subtitle: 'Acelerar a transformação em escala' },
      techMemory: { label: 'MEMÓRIA TÉCNICA', subtitle: 'Documentação técnica AWS com normas APA' }
    },
    executiveSummary: {
      subtitle:               'Caso de Negócio de Migração para AWS',
      annualCostReduction:    'Redução de Custo Anual',
      perYear:                '/ano',
      roi3Year:               'ROI em 3 Anos',
      paybackPeriod:          'Período de Retorno',
      months:                 'meses',
      tcoSavings3Year:        'Economia TCO 3 Anos',
      vsOnPremises:           'vs. On-Premises',
      infrastructure:         'Infraestrutura',
      serversToMigrate:       'Servidores a migrar',
      annualOnPremises:       'Anual On-Premises',
      currentCost:            'Custo atual',
      awsAnnual3ANURI:        'AWS Anual (3A NURI)',
      optimizedCost:          'Custo otimizado',
      inventoryTitle:         'Inventário de Infraestrutura',
      servers:                'Servidores',
      databases:              'Bancos de Dados',
      applications:           'Aplicações',
      totalStorageGB:         'Armazenamento Total (GB)',
      osDistribution:         'Distribuição de SO',
      dependenciesTitle:      'Complexidade de Dependências',
      connections:            'Conexões',
      mappedDBs:              'BDs mapeados',
      mappedApps:             'Apps mapeados',
      topServersByDeps:       'Top servidores por dependências',
      connectionsSuffix:      'conexões',
      wavesPlanTitle:         'Plano de Ondas de Migração',
      wavesDefined:           'Ondas definidas',
      serversPlanned:         'Servidores planejados',
      wavesCompleted:         'Ondas concluídas',
      pricingComparisonTitle: 'Comparativo de Preços AWS',
      savingsPerYear:         'Economize {{amount}}/ano',
      perMonth:               '/mês',
      perYearShort:           '/ano',
      riskTitle:              'Indicadores de Risco — SO Fora de Suporte',
      serverEOL_one:          'servidor com SO fora de suporte',
      serverEOL_other:        'servidores com SO fora de suporte',
      riskHigh:               '⚠️ Risco alto — requer atenção imediata',
      riskMedium:             '⚠️ Risco médio — planejar migração prioritária',
      riskLow:                'ℹ️ Risco baixo — incluir no plano de migração',
      continueToMobilize:     'Continuar para Mobilize',
      savingsApprox36:        '~36% economia',
      bestValue:              'MELHOR VALOR'
    }
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (typeof source[key] === 'object' && !Array.isArray(source[key]) && target[key] && typeof target[key] === 'object') {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

for (const [file, add] of Object.entries(additions)) {
  const locale = JSON.parse(fs.readFileSync(base + file, 'utf8'));
  deepMerge(locale, add);
  fs.writeFileSync(base + file, JSON.stringify(locale, null, 2) + '\n', 'utf8');
  console.log('Updated', file);
}
console.log('Done.');
