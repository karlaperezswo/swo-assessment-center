import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { AnonymizedData } from '../../../shared/types/opportunity.types';

export interface BedrockResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  modelId: string;
}

export class BedrockError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'BedrockError';
  }
}

export class BedrockService {
  private client: BedrockRuntimeClient;
  private readonly modelId: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    
    // Load configuration from environment variables
    console.log('[BEDROCK] Reading environment variables...');
    console.log('[BEDROCK] BEDROCK_MODEL_ID from env:', process.env.BEDROCK_MODEL_ID);
    console.log('[BEDROCK] BEDROCK_TIMEOUT_MS from env:', process.env.BEDROCK_TIMEOUT_MS);
    console.log('[BEDROCK] BEDROCK_MAX_RETRIES from env:', process.env.BEDROCK_MAX_RETRIES);
    
    this.modelId = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    this.maxRetries = parseInt(process.env.BEDROCK_MAX_RETRIES || '3', 10);
    this.timeoutMs = parseInt(process.env.BEDROCK_TIMEOUT_MS || '30000', 10);
    
    console.log(`[BEDROCK] Initialized with model: ${this.modelId}`);
    console.log(`[BEDROCK] Timeout configured: ${this.timeoutMs}ms`);
    console.log(`[BEDROCK] Max retries: ${this.maxRetries}`);
  }

  /**
   * Analyze assessment data and generate opportunities
   * @param anonymizedData - Anonymized MPA and MRA data
   * @returns Raw Bedrock response
   * @throws BedrockError if API call fails after retries
   */
  async analyzeOpportunities(anonymizedData: AnonymizedData): Promise<BedrockResponse> {
    const prompt = this.buildPrompt(anonymizedData);
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.invokeModel(prompt);
        
        // Log to CloudWatch (anonymized data only)
        this.logAnalysisRequest(anonymizedData, response);
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        // Check if error is retryable
        if (this.isRetryableError(error)) {
          const delay = this.getBackoffDelay(attempt);
          console.log(`Bedrock API call failed (attempt ${attempt + 1}/${this.maxRetries}), retrying in ${delay}ms...`);
          await this.sleep(delay);
        } else {
          // Non-retryable error, throw immediately
          throw new BedrockError(`Bedrock API call failed: ${(error as Error).message}`, error as Error);
        }
      }
    }
    
    // All retries exhausted
    throw new BedrockError(
      `Bedrock API call failed after ${this.maxRetries} attempts: ${lastError?.message}`,
      lastError
    );
  }

  /**
   * Build prompt for Bedrock analysis
   * @param data - Anonymized assessment data (includes optional questionnaire and knowledge base)
   * @returns Structured prompt
   */
  buildPrompt(data: AnonymizedData): string {
    const { mpaData, mraData, questionnaireData, knowledgeBase } = data;
    
    // Summarize MPA data
    const serverCount = mpaData.servers?.length || 0;
    const databaseCount = mpaData.databases?.length || 0;
    const applicationCount = mpaData.applications?.length || 0;
    
    // Extract technology stack
    const osTypes = [...new Set(mpaData.servers?.map((s: any) => s.osName) || [])];
    const dbEngines = [...new Set(mpaData.databases?.map((d: any) => d.engineType) || [])];
    
    // Calculate total resources
    const totalCpus = mpaData.servers?.reduce((sum: number, s: any) => sum + (s.numCpus || 0), 0) || 0;
    const totalRamGB = mpaData.servers?.reduce((sum: number, s: any) => sum + (s.totalRAM || 0), 0) / 1024 || 0;
    
    // Summarize MRA data
    const maturityLevel = mraData.maturityLevel || 0;
    const securityGaps = mraData.securityGaps?.slice(0, 5) || []; // Top 5 gaps
    const drStrategy = mraData.drStrategy || 'Not specified';
    const technicalDebt = mraData.technicalDebt?.slice(0, 5) || []; // Top 5 debt items
    
    // Build prompt sections
    let prompt = `================================================================================
TU ROL Y CONTEXTO
================================================================================

Eres un AWS Solutions Architect Senior con perfil comercial, especializado en identificar 
oportunidades de negocio para clientes enterprise. Tu objetivo es analizar la infraestructura 
actual del cliente y generar oportunidades de venta concretas, accionables y basadas en datos.

HABILIDADES CLAVE:
- Arquitectura de soluciones AWS (Well-Architected Framework)
- Análisis técnico-comercial de infraestructura
- Identificación de pain points y oportunidades de mejora
- Cálculo de ROI y business case
- Conocimiento profundo de servicios AWS
- Experiencia en migraciones y modernización
- Habilidades de consultoría y preventa

ENFOQUE DE ANÁLISIS:
1. Cruza información de MPA, MRA${questionnaireData ? ' y Cuestionario' : ''} para obtener una visión 360° del cliente
2. Identifica patrones, gaps y oportunidades ocultas
3. Prioriza según objetivos de negocio del cliente
4. Genera propuestas con impacto medible (costos, tiempo, riesgo)
5. Piensa como un consultor que debe justificar cada recomendación con datos

MENTALIDAD COMERCIAL:
- Cada oportunidad debe tener un business case claro
- Enfócate en quick wins y proyectos estratégicos
- Considera el timeline y presupuesto del cliente
- Alinea con prioridades del negocio
- Genera urgencia cuando sea apropiado (EOL, compliance, riesgos)

`;

    // Section 1: Knowledge Base (if provided)
    if (knowledgeBase && knowledgeBase.content) {
      prompt += `================================================================================
SECCIÓN 1: BASE DE CONOCIMIENTOS - OPTIMIZACIÓN DE COSTOS MICROSOFT
================================================================================

INSTRUCCIÓN CRÍTICA: Para oportunidades de "Optimización de Costos" relacionadas 
ESPECÍFICAMENTE con cargas de trabajo MICROSOFT (Windows, SQL Server, .NET, Active Directory),
debes usar EXCLUSIVAMENTE la información de esta sección.

Para optimización de costos de OTRAS tecnologías (Linux, Oracle, PostgreSQL, contenedores, etc.),
usa tu conocimiento general de AWS y mejores prácticas de Well-Architected Framework.

${knowledgeBase.content}

================================================================================
FIN DE LA BASE DE CONOCIMIENTOS
================================================================================

ALCANCE DE ESTE DOCUMENTO:
✅ Optimización de costos para: Windows Server, SQL Server, .NET, Active Directory, 
   cargas Microsoft en general
❌ Para otras tecnologías (Linux, Oracle, PostgreSQL, etc.): usa conocimiento general de AWS

`;
    }

    // Section 2: Questionnaire (if provided)
    if (questionnaireData) {
      prompt += `================================================================================
SECCIÓN 2: CUESTIONARIO DE INFRAESTRUCTURA DEL CLIENTE (ANONIMIZADO)
================================================================================

⚠️ DATOS SENSIBLES ANONIMIZADOS: IPs, hostnames, nombres de empresa, contactos y 
ubicaciones han sido reemplazados con tokens (COMPANY_X, LOCATION_X, IP_X, HOST_X, etc.)

Este cuestionario proporciona contexto crítico sobre la infraestructura, prioridades, 
restricciones y situación actual del cliente. CRUZA esta información con MPA y MRA 
para identificar oportunidades alineadas con los objetivos de negocio.

`;

      if (questionnaireData.clientName) {
        prompt += `Información del Cliente:
- Nombre: ${questionnaireData.clientName || 'No especificado'}
- Industria: ${questionnaireData.industry || 'No especificado'}
- Ubicación: ${questionnaireData.location || 'No especificado'}
- Tamaño: ${questionnaireData.companySize || 'No especificado'}
- Contacto ejecutivo: ${questionnaireData.executiveContact || 'No especificado'}
- Contacto técnico: ${questionnaireData.technicalContact || 'No especificado'}

`;
      }

      if (questionnaireData.primaryDatacenter) {
        prompt += `Infraestructura Actual:
- Datacenter principal: ${questionnaireData.primaryDatacenter || 'No especificado'}
- Datacenters secundarios: ${questionnaireData.secondaryDatacenters?.join(', ') || 'Ninguno'}
- Proveedores cloud: ${questionnaireData.cloudProviders?.join(', ') || 'Ninguno'}
- Conectividad: ${questionnaireData.connectivity || 'No especificado'}

`;
      }

      if (questionnaireData.criticalApplications) {
        prompt += `Cargas de Trabajo:
- Aplicaciones críticas: ${questionnaireData.criticalApplications?.join(', ') || 'No especificado'}
- Bases de datos: ${questionnaireData.databases?.join(', ') || 'No especificado'}
- Middleware: ${questionnaireData.middleware?.join(', ') || 'No especificado'}
- Sistemas operativos: ${questionnaireData.operatingSystems?.join(', ') || 'No especificado'}

`;
      }

      if (questionnaireData.priorities && questionnaireData.priorities.length > 0) {
        prompt += `Prioridades del Cliente (ordenadas por importancia):
${questionnaireData.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

`;
      }

      if (questionnaireData.complianceRequirements) {
        prompt += `Restricciones y Requisitos:
- Cumplimiento: ${questionnaireData.complianceRequirements?.join(', ') || 'No especificado'}
- Ventanas de mantenimiento: ${questionnaireData.maintenanceWindows?.join(', ') || 'No especificado'}
- Restricciones de migración: ${questionnaireData.migrationRestrictions?.join(', ') || 'Ninguna'}
- Presupuesto: ${questionnaireData.budget || 'No especificado'}
- Timeline: ${questionnaireData.timeline || 'No especificado'}

`;
      }

      if (questionnaireData.licenseContracts) {
        prompt += `Situación Actual:
- Contratos de licencias: ${questionnaireData.licenseContracts?.join(', ') || 'No especificado'}
- Fin de soporte: ${questionnaireData.endOfSupport?.join(', ') || 'Ninguno'}
- Problemas actuales: ${questionnaireData.currentProblems?.join(', ') || 'Ninguno'}
- Proyectos en curso: ${questionnaireData.ongoingProjects?.join(', ') || 'Ninguno'}

`;
      }

      if (questionnaireData.teamSize) {
        prompt += `Equipo y Capacidades:
- Tamaño del equipo IT: ${questionnaireData.teamSize || 'No especificado'}
- Experiencia con AWS: ${questionnaireData.awsExperience || 'No especificado'}
- Certificaciones: ${questionnaireData.certifications?.join(', ') || 'Ninguna'}
- Soporte actual: ${questionnaireData.currentSupport?.join(', ') || 'No especificado'}

`;
      }

      if (questionnaireData.expectedGrowth) {
        prompt += `Objetivos de Negocio:
- Crecimiento esperado: ${questionnaireData.expectedGrowth || 'No especificado'}
- Nuevos mercados: ${questionnaireData.newMarkets?.join(', ') || 'Ninguno'}
- Iniciativas digitales: ${questionnaireData.digitalInitiatives?.join(', ') || 'Ninguna'}
- KPIs principales: ${questionnaireData.kpis?.join(', ') || 'No especificado'}
- Drivers de decisión: ${questionnaireData.decisionDrivers?.join(', ') || 'No especificado'}

`;
      }

      prompt += `ANÁLISIS CRUZADO REQUERIDO:
Debes cruzar este cuestionario con los datos de MPA y MRA para:
1. Validar consistencia (ej: prioridades vs gaps identificados)
2. Identificar discrepancias (ej: cliente dice tener DR pero MRA muestra que no)
3. Encontrar oportunidades ocultas (ej: crecimiento planeado + infraestructura actual)
4. Priorizar según objetivos reales del negocio
5. Generar urgencia basada en timelines y restricciones

`;
    }

    // Section 3: MPA Data
    prompt += `================================================================================
SECCIÓN ${questionnaireData ? '3' : '2'}: DATOS DE ASSESSMENT (MPA) - ANONIMIZADOS
================================================================================

MPA Data Summary:
- Total Servers: ${serverCount}
- Total Databases: ${databaseCount}
- Total Applications: ${applicationCount}
- Operating Systems: ${osTypes.join(', ') || 'None'}
- Database Engines: ${dbEngines.join(', ') || 'None'}
- Total CPUs: ${totalCpus}
- Total RAM: ${totalRamGB.toFixed(2)} GB

`;

    // Section 4: MRA Data
    prompt += `================================================================================
SECCIÓN ${questionnaireData ? '4' : '3'}: DATOS DE ASSESSMENT (MRA) - ANONIMIZADOS
================================================================================

MRA Data Summary:
- Maturity Level: ${maturityLevel}/5
- Security Gaps: ${securityGaps.length > 0 ? '\n  - ' + securityGaps.join('\n  - ') : 'None identified'}
- DR Strategy: ${drStrategy}
- Technical Debt: ${technicalDebt.length > 0 ? '\n  - ' + technicalDebt.join('\n  - ') : 'None identified'}

================================================================================
SECCIÓN ${questionnaireData ? '5' : '4'}: CONTEXTO AWS WELL-ARCHITECTED FRAMEWORK
================================================================================

Analyze opportunities through the lens of the 6 pillars:
1. Operational Excellence - Monitoring, automation, CI/CD, IaC
2. Security - Identity management, data protection, compliance
3. Reliability - Disaster recovery, backup, high availability
4. Performance Efficiency - Right-sizing, caching, CDN
5. Cost Optimization - Reserved instances, Savings Plans, rightsizing
6. Sustainability - Carbon footprint reduction, efficient resource usage

================================================================================
SECCIÓN ${questionnaireData ? '6' : '5'}: OPORTUNIDADES DE WORKSHOPS
================================================================================

You MUST identify at least 2-5 workshop opportunities. Consider:
- Well-Architected Framework Review (WAFR) workshops
- Migration Readiness Assessment workshops
- Security best practices workshops
- Cost optimization workshops
- Modernization and containerization workshops
- Data analytics and ML/AI workshops
- Specific service deep-dive workshops (e.g., EKS, Lambda, RDS)

================================================================================
SECCIÓN ${questionnaireData ? '7' : '6'}: INSTRUCCIONES DE GENERACIÓN
================================================================================

CRITICAL REQUIREMENTS:
1. You MUST generate opportunities in TWO categories:
   A) WELL-ARCHITECTED OPPORTUNITIES: 8-12 opportunities covering ALL 6 pillars
   B) WORKSHOP OPPORTUNITIES: 2-5 workshop opportunities (with "Workshop" in the title)

2. MANDATORY PILLAR COVERAGE - You MUST include AT LEAST ONE opportunity from EACH of these 6 pillars:
   ✅ Seguridad (Security) - Identity, encryption, compliance, access control
   ✅ Optimización de Costos (Cost Optimization) - Rightsizing, Reserved Instances, Savings Plans
   ✅ Confiabilidad (Reliability) - Backup, DR, high availability, fault tolerance
   ✅ Excelencia Operacional (Operational Excellence) - Monitoring, automation, CI/CD, IaC
   ✅ Eficiencia de Rendimiento (Performance Efficiency) - Caching, CDN, compute optimization
   ✅ Sostenibilidad (Sustainability) - Carbon footprint, efficient resource usage, green computing
   
   IMPORTANT: If you cannot find a HIGH priority opportunity for a pillar, generate a MEDIUM or LOW priority one.
   The goal is COVERAGE of all 6 pillars, not just high-priority items.

3. Total opportunities: 10-17 (minimum 10, maximum 17)
   - 8-12 Well-Architected opportunities (covering all 6 pillars)
   - 2-5 Workshop opportunities

4. Workshop titles MUST include the word "Workshop", examples:
   - "Workshop de Well-Architected Framework Review"
   - "Workshop de Migration Readiness Assessment"
   - "Workshop de Seguridad en AWS"
   - "Workshop de Optimización de Costos"

5. Priority distribution guidance:
   - High: Critical issues, urgent needs, EOL software, security gaps, compliance requirements
   - Medium: Important improvements, optimization opportunities, modernization paths
   - Low: Nice-to-have enhancements, future considerations, exploratory initiatives
   
   DO NOT only generate High priority opportunities. Include Medium and Low to ensure all 6 pillars are covered.

6. If you generate fewer than 10 total opportunities, fewer than 2 workshops, or miss ANY of the 6 pillars, your response will be rejected

${knowledgeBase ? `
6. For "Optimización de Costos" opportunities:
   A) If it's a MICROSOFT workload (Windows, SQL Server, .NET, AD):
      ⚠️ USE EXCLUSIVELY Section 1 (Knowledge Base)
      - Cite specific strategies from the document
      - Use savings percentages from the document
      - Reference specific sections or chapters
      - Example evidence: "Según la Guía MACO, la estrategia de License Mobility puede generar ahorros del 40-50%"
   
   B) If it's another technology (Linux, Oracle, PostgreSQL, containers, etc.):
      ✅ USE your general AWS Well-Architected Framework knowledge
      - Apply cost optimization best practices
      - Use appropriate AWS services (Compute Optimizer, Cost Explorer, etc.)
      - Base recommendations on MPA data (CPU usage, RAM, etc.)
` : ''}

${questionnaireData ? `
7. CROSS-ANALYSIS (VERY IMPORTANT):
   You must actively cross-reference information from:
   - MPA (technical data): What do they have?
   - MRA (maturity and gaps): What are they missing?
   - Questionnaire (priorities and context): What do they want?
   
   Examples of cross-analysis:
   ✅ Questionnaire says "priority: costs" + MPA shows "CPU 35%" → Rightsizing opportunity
   ✅ Questionnaire says "50% growth" + MRA shows "no auto-scaling" → Elasticity opportunity
   ✅ Questionnaire says "PCI-DSS compliance" + MRA shows "no encryption" → URGENT security opportunity
   ✅ Questionnaire says "SQL Server EOL 2024" + MPA shows "SQL 2012" → Migration to RDS opportunity

8. INTELLIGENT PRIORITIZATION:
   - Use priorities from the questionnaire (Section 2)
   - If client prioritizes costs → more cost opportunities (High priority)
   - If prioritizes security → more security opportunities (High priority)
   - If there are deadlines (EOL, compliance) → generate urgency
   - Align with business objectives and client KPIs
   - Consider constraints (budget, timeline, maintenance windows)
` : ''}

${questionnaireData ? '9' : '6'}. EVIDENCE DATA-BACKED:
   - Each opportunity must have 2-4 evidence points
   - Evidence must be specific with numbers from MPA/MRA${questionnaireData ? '/Questionnaire' : ''}
   ${questionnaireData ? '- CROSS-REFERENCE information between sources to validate' : ''}
   ${knowledgeBase ? '- For Microsoft costs: cite the document from Section 1' : ''}
   - For others: use concrete data from the assessment
   
   Examples of GOOD evidence:
   ✅ "45 servers identified in MPA with average CPU usage of 35%, indicating over-provisioning"
   ${knowledgeBase ? '✅ "According to AWS Prescriptive Guidance for Microsoft workloads, License Mobility can save 40-50%"' : ''}
   ${questionnaireData ? '✅ "Client prioritizes cost reduction (#1) per questionnaire, with $2M budget for 2024"' : ''}
   ✅ "SQL Server 2012 out of support (EOL 2022) identified on 6 servers in MPA"
   ${questionnaireData ? '✅ "MRA shows maturity level 2/5 + Questionnaire indicates 50% growth = scalability need"' : ''}
   
   Examples of BAD evidence:
   ❌ "There is an opportunity to optimize" (too generic, no data)
   ❌ "The client needs to improve" (no specific evidence)
   ❌ "AWS can help" (doesn't say how or why)

Generate 10-17 sales opportunities in JSON format. Each opportunity must include:
- title (in Spanish)
- category (exactly one of: "Workshop", "Seguridad", "Optimización de Costos", "Confiabilidad", "Excelencia Operacional", "Eficiencia de Rendimiento", "Sostenibilidad", "Migración", "Modernización", "Otro")
- priority (exactly one of: "High", "Medium", "Low")
- estimatedARR (number, estimated annual recurring revenue in USD)
- reasoning (in Spanish, 2-3 sentences explaining why this is an opportunity based on Well-Architected pillars${questionnaireData ? ' and cross-analysis' : ''})
- evidence (array of 2-4 strings in Spanish, DATA-BACKED evidence from the assessment showing specific numbers, gaps, or findings that justify this opportunity)
- talkingPoints (array of 3-5 strings in Spanish, specific points to discuss with customer, referencing Well-Architected pillars when relevant)
- nextSteps (array of 2-4 strings in Spanish, actionable next steps - MUST include workshops when applicable)
- relatedServices (array of AWS service names, e.g., ["Amazon EC2", "AWS Lambda"])

IMPORTANT:
- Respond ONLY with a valid JSON array, no additional text before or after
- All text fields (title, reasoning, evidence, talkingPoints, nextSteps) must be in Spanish
- category must be exactly one of the specified categories
- Priority must be exactly "High", "Medium", or "Low"
- estimatedARR must be a positive number
- evidence MUST include specific data points from the assessment (server counts, maturity level, security gaps, etc.)
- Base opportunities on the actual data provided (maturity level, gaps, infrastructure size)
- YOU MUST INCLUDE AT LEAST ONE OPPORTUNITY FROM EACH OF THE 6 WELL-ARCHITECTED PILLARS
- Generate AT LEAST 10 opportunities total (8-12 Well-Architected + 2-5 Workshops)
- Reference specific Well-Architected pillars in your reasoning and talking points
- For workshop opportunities, include specific workshop names in nextSteps and title
${questionnaireData ? '- CROSS-REFERENCE MPA, MRA, and Questionnaire data in your evidence and reasoning' : ''}
${knowledgeBase ? '- For Microsoft cost optimization: cite specific strategies from Section 1' : ''}

Example format:
  {
    "title": "Workshop de Well-Architected Framework Review",
    "category": "Workshop",
    "priority": "High",
    "estimatedARR": 50000,
    "reasoning": "Con nivel de madurez ${maturityLevel} y ${securityGaps.length} brechas de seguridad identificadas, un WAFR workshop ayudará a evaluar la arquitectura actual contra los 6 pilares del Well-Architected Framework. Esto permitirá identificar riesgos y oportunidades de mejora en seguridad, confiabilidad y optimización de costos.",
    "evidence": [
      "Nivel de madurez actual: ${maturityLevel}/5, indicando oportunidades de mejora",
      "${securityGaps.length} brechas de seguridad identificadas en el MRA",
      "${serverCount} servidores y ${databaseCount} bases de datos requieren evaluación arquitectónica",
      "Estrategia de DR actual: ${drStrategy}, necesita validación contra mejores prácticas"
    ],
    "talkingPoints": [
      "Evaluación completa de arquitectura contra los 6 pilares del Well-Architected Framework",
      "Identificación de riesgos de seguridad y confiabilidad con plan de remediación",
      "Recomendaciones específicas para optimización de costos y rendimiento",
      "Roadmap de mejoras priorizadas con impacto en el negocio"
    ],
    "nextSteps": [
      "Agendar Workshop de Well-Architected Framework Review (2-3 días)",
      "Preparar documentación de arquitectura actual",
      "Identificar stakeholders técnicos y de negocio para el workshop"
    ],
    "relatedServices": ["AWS Well-Architected Tool", "AWS Trusted Advisor", "AWS Config"]
  },
  {
    "title": "Implementación de Estrategia de Sostenibilidad en AWS",
    "category": "Sostenibilidad",
    "priority": "Medium",
    "estimatedARR": 30000,
    "reasoning": "Aplicando el pilar de Sostenibilidad del Well-Architected Framework, se puede reducir la huella de carbono mediante optimización de recursos y uso de instancias Graviton. Esto alinea con objetivos ESG corporativos y reduce costos operativos.",
    "evidence": [
      "${serverCount} servidores con oportunidad de migración a instancias Graviton (20% más eficientes energéticamente)",
      "Uso de recursos 24/7 sin Instance Scheduler implementado",
      "Potencial de reducción de huella de carbono del 15-20% según AWS Sustainability Pillar",
      "Alineación con tendencias de ESG y responsabilidad corporativa"
    ],
    "talkingPoints": [
      "Sostenibilidad: Reducción de huella de carbono mediante AWS Graviton y optimización de recursos",
      "Beneficio dual: Mejora ambiental + reducción de costos del 20%",
      "Alineación con objetivos ESG corporativos y reportes de sostenibilidad",
      "Diferenciación competitiva mediante prácticas de TI verde"
    ],
    "nextSteps": [
      "Evaluar cargas de trabajo compatibles con AWS Graviton",
      "Implementar AWS Instance Scheduler para apagar recursos fuera de horario",
      "Configurar AWS Customer Carbon Footprint Tool para medición"
    ],
    "relatedServices": ["AWS Graviton", "AWS Instance Scheduler", "AWS Customer Carbon Footprint Tool"]
  },
  {
    "title": "Migración a AWS con Estrategia Lift-and-Shift",
    "category": "Migración",
    "priority": "High",
    "estimatedARR": 250000,
    "reasoning": "Con ${serverCount} servidores, existe una oportunidad significativa para migración. Aplicando los pilares de Confiabilidad y Optimización de Costos del Well-Architected Framework, se puede lograr mayor disponibilidad y reducción de costos del 30-40%.",
    "evidence": [
      "${serverCount} servidores on-premise identificados en el MPA",
      "${totalCpus} CPUs totales y ${totalRamGB.toFixed(2)} GB RAM que pueden optimizarse en AWS",
      "Sistemas operativos: ${osTypes.join(', ')}, compatibles con migración directa",
      "Nivel de madurez ${maturityLevel}/5 indica preparación para migración inicial"
    ],
    "talkingPoints": [
      "Mejora en Confiabilidad: SLA del 99.99% con arquitectura multi-AZ",
      "Optimización de Costos: Reducción del 30-40% mediante rightsizing y Reserved Instances",
      "Excelencia Operacional: Automatización de backups y monitoreo con CloudWatch"
    ],
    "nextSteps": [
      "Realizar Workshop de Migration Readiness Assessment",
      "Crear plan de migración por fases priorizando cargas críticas"
    ],
    "relatedServices": ["AWS Migration Hub", "Amazon EC2", "AWS Application Migration Service"]
  }
]`;

    return prompt;
  }

  /**
   * Sanitize a string value to be JSON-safe
   * @param str - String to sanitize
   * @returns Sanitized string
   */
  private sanitizeJsonString(str: string): string {
    return str
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Escape backslashes first (must be done before other escapes)
      .replace(/\\/g, '\\\\')
      // Escape double quotes
      .replace(/"/g, '\\"')
      // Escape newlines
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      // Escape tabs
      .replace(/\t/g, '\\t');
  }

  /**
   * Complete truncated JSON by closing open brackets and braces
   * Also removes incomplete objects that don't have all required fields
   * @param jsonString - Potentially incomplete JSON string
   * @returns Completed JSON string
   */
  private completeJson(jsonString: string): string {
    let completed = jsonString.trim();
    
    // Count open and close brackets/braces
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;
    let inString = false;
    let escaped = false;
    
    for (let i = 0; i < completed.length; i++) {
      const char = completed[i];
      
      // Track if we're inside a string
      if (char === '"' && !escaped) {
        inString = !inString;
      }
      
      // Only count brackets/braces outside of strings
      if (!inString) {
        if (char === '{') openBraces++;
        else if (char === '}') closeBraces++;
        else if (char === '[') openBrackets++;
        else if (char === ']') closeBrackets++;
      }
      
      // Track escape sequences
      escaped = (char === '\\' && !escaped);
    }
    
    // Check if JSON is incomplete
    const missingBraces = openBraces - closeBraces;
    const missingBrackets = openBrackets - closeBrackets;
    
    if (missingBraces > 0 || missingBrackets > 0) {
      console.log('[BEDROCK] Detected incomplete JSON:');
      console.log(`[BEDROCK] - Missing closing braces: ${missingBraces}`);
      console.log(`[BEDROCK] - Missing closing brackets: ${missingBrackets}`);
      
      // Check if we're in the middle of a string value
      if (inString) {
        console.log('[BEDROCK] - Incomplete string detected, closing it');
        completed += '"';
      }
      
      // If we have an incomplete object (missing braces), we should remove it
      // to avoid validation errors. Look for the last complete object.
      if (missingBraces > 0) {
        console.log('[BEDROCK] - Incomplete object detected, attempting to remove it');
        
        // Strategy 1: Find the last complete object by looking for the pattern },
        // This indicates the end of a complete object in an array
        const lastCompleteObjectMatch = completed.lastIndexOf('},');
        
        // Strategy 2: Also check for }] pattern (last object in array)
        const lastObjectInArrayMatch = completed.lastIndexOf('}]');
        
        // Use whichever is later in the string
        const truncateAt = Math.max(lastCompleteObjectMatch, lastObjectInArrayMatch);
        
        if (truncateAt > 0) {
          // Truncate after the last complete object
          if (lastCompleteObjectMatch > lastObjectInArrayMatch) {
            completed = completed.substring(0, lastCompleteObjectMatch + 1);
            console.log('[BEDROCK] - Removed incomplete object (found },), new length:', completed.length);
            // Close the array
            completed += '\n]';
          } else {
            completed = completed.substring(0, lastObjectInArrayMatch + 2);
            console.log('[BEDROCK] - Removed incomplete object (found }]), new length:', completed.length);
          }
          console.log('[BEDROCK] - Closed array after removing incomplete object');
          return completed;
        } else {
          // Fallback: close the incomplete object
          console.log('[BEDROCK] - Could not find last complete object, closing incomplete one');
          for (let i = 0; i < missingBraces; i++) {
            completed += '\n}';
          }
        }
      }
      
      // Close any remaining open brackets
      for (let i = 0; i < missingBrackets; i++) {
        completed += '\n]';
      }
      
      console.log('[BEDROCK] JSON completion applied');
    }
    
    return completed;
  }

  /**
   * Repair common JSON syntax errors with robust character encoding handling
   * @param jsonString - Potentially malformed JSON string
   * @returns Repaired JSON string
   */
  private repairJson(jsonString: string): string {
    let repaired = jsonString;

    console.log('[BEDROCK] Starting JSON repair...');
    console.log('[BEDROCK] Original length:', repaired.length);

    // Step 1: Complete truncated JSON (close open brackets/braces)
    repaired = this.completeJson(repaired);
    console.log('[BEDROCK] After JSON completion:', repaired.length);

    // Step 2: Remove control characters (except those we'll handle explicitly)
    repaired = repaired.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    console.log('[BEDROCK] After control char removal:', repaired.length);

    // Step 3: Fix common encoding issues with Spanish characters
    // Ensure UTF-8 characters are preserved correctly
    try {
      // Normalize Unicode characters
      repaired = repaired.normalize('NFC');
      console.log('[BEDROCK] Unicode normalized');
    } catch (error) {
      console.log('[BEDROCK] Could not normalize Unicode');
    }

    // Step 4: Remove trailing commas before closing brackets/braces
    repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
    console.log('[BEDROCK] Trailing commas removed');

    // Step 4.5: Fix missing commas between array elements
    // Pattern: "]" followed by whitespace and then "[" or "{" without a comma
    repaired = repaired.replace(/\](\s*)(\[|\{)/g, '],$1$2');
    // Pattern: "}" followed by whitespace and then "[" or "{" without a comma
    repaired = repaired.replace(/\}(\s*)(\[|\{)/g, '},$1$2');
    // Pattern: string followed by whitespace and then "[" or "{" without a comma
    repaired = repaired.replace(/"(\s*)(\[|\{)/g, '",$1$2');
    console.log('[BEDROCK] Missing commas between array/object elements added');

    // Step 5: Fix unescaped newlines in string values
    // Match string values and escape literal newlines
    try {
      let inString = false;
      let escaped = false;
      let result = '';
      
      for (let i = 0; i < repaired.length; i++) {
        const char = repaired[i];
        const prevChar = i > 0 ? repaired[i - 1] : '';
        
        // Track if we're inside a string
        if (char === '"' && !escaped) {
          inString = !inString;
          result += char;
        } else if (inString && (char === '\n' || char === '\r')) {
          // Replace literal newlines with escaped version
          if (char === '\n') {
            result += '\\n';
          } else if (char === '\r' && repaired[i + 1] !== '\n') {
            result += '\\r';
          }
          // Skip \r if followed by \n (will be handled as \n)
        } else {
          result += char;
        }
        
        // Track escape sequences
        escaped = (char === '\\' && !escaped);
      }
      
      repaired = result;
      console.log('[BEDROCK] Newlines escaped in strings');
    } catch (error) {
      console.log('[BEDROCK] Could not escape newlines:', error);
    }

    // Step 6: Fix unescaped quotes - more conservative approach
    // Only fix obvious cases where quotes appear in the middle of values
    try {
      // Pattern: "key": "value with unescaped " quote"
      // We need to be very careful here to not break already-valid JSON
      const lines = repaired.split('\n');
      const fixedLines = lines.map(line => {
        // Only process lines that look like JSON key-value pairs
        if (line.includes('":') && line.includes('"')) {
          // Find the colon that separates key from value
          const colonIndex = line.indexOf('":');
          if (colonIndex === -1) return line;
          
          // Get the value part (after the colon)
          const beforeColon = line.substring(0, colonIndex + 2);
          let afterColon = line.substring(colonIndex + 2).trim();
          
          // If value starts with a quote, process it
          if (afterColon.startsWith('"')) {
            // Find the closing quote (accounting for escaped quotes)
            let valueEnd = -1;
            let escaped = false;
            
            for (let i = 1; i < afterColon.length; i++) {
              if (afterColon[i] === '\\' && !escaped) {
                escaped = true;
              } else if (afterColon[i] === '"' && !escaped) {
                // Check if this is followed by comma or closing bracket (valid end)
                const nextChar = afterColon[i + 1];
                if (!nextChar || nextChar === ',' || nextChar === '}' || nextChar === ']' || /\s/.test(nextChar)) {
                  valueEnd = i;
                  break;
                }
              } else {
                escaped = false;
              }
            }
            
            // If we found a proper end, extract and fix the value
            if (valueEnd > 0) {
              const value = afterColon.substring(1, valueEnd);
              const rest = afterColon.substring(valueEnd + 1);
              
              // Escape any unescaped quotes in the value
              let fixedValue = '';
              let valueEscaped = false;
              for (let i = 0; i < value.length; i++) {
                const char = value[i];
                if (char === '\\' && !valueEscaped) {
                  fixedValue += char;
                  valueEscaped = true;
                } else if (char === '"' && !valueEscaped) {
                  fixedValue += '\\"'; // Escape unescaped quote
                } else {
                  fixedValue += char;
                  valueEscaped = false;
                }
              }
              
              return beforeColon + '"' + fixedValue + '"' + rest;
            }
          }
        }
        return line;
      });
      
      repaired = fixedLines.join('\n');
      console.log('[BEDROCK] Unescaped quotes fixed');
    } catch (error) {
      console.log('[BEDROCK] Could not fix unescaped quotes:', error);
    }

    console.log('[BEDROCK] JSON repair complete, final length:', repaired.length);
    return repaired;
  }

  /**
   * Extract JSON from content that may contain markdown or explanatory text
   * @param content - Raw content from Bedrock response
   * @returns Extracted JSON string
   */
  private extractJsonFromContent(content: string): string {
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\]|\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
      console.log('[BEDROCK] Extracted JSON from markdown code block');
      return codeBlockMatch[1].trim();
    }

    // Try to find JSON array or object in the content
    const jsonArrayMatch = content.match(/(\[[\s\S]*\])/);
    if (jsonArrayMatch) {
      console.log('[BEDROCK] Extracted JSON array from content');
      return jsonArrayMatch[1].trim();
    }

    const jsonObjectMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonObjectMatch) {
      console.log('[BEDROCK] Extracted JSON object from content');
      return jsonObjectMatch[1].trim();
    }

    // Return as-is if no pattern found (assume it's pure JSON)
    console.log('[BEDROCK] No extraction pattern found, using content as-is');
    return content.trim();
  }

  /**
   * Invoke Bedrock model with timeout
   */
  private async invokeModel(prompt: string): Promise<BedrockResponse> {
    console.log('[BEDROCK] Preparing request...');
    console.log('[BEDROCK] Model ID:', this.modelId);
    console.log('[BEDROCK] Prompt size:', prompt.length, 'characters');
    console.log('[BEDROCK] Timeout:', this.timeoutMs, 'ms');
    console.log('[BEDROCK] Region:', process.env.AWS_REGION || 'us-east-1');
    
    const input: InvokeModelCommandInput = {
      modelId: this.modelId,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    };

    const command = new InvokeModelCommand(input);
    
    console.log('[BEDROCK] Sending request to Bedrock...');
    const startTime = Date.now();
    
    // Implement timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        const elapsed = Date.now() - startTime;
        console.error(`[BEDROCK] TIMEOUT after ${elapsed}ms`);
        reject(new Error('Bedrock API call timed out'));
      }, this.timeoutMs);
    });
    
    try {
      const response = await Promise.race([
        this.client.send(command),
        timeoutPromise,
      ]);
      
      const elapsed = Date.now() - startTime;
      console.log(`[BEDROCK] Response received in ${elapsed}ms`);

      // Parse response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      
      console.log('[BEDROCK] Response parsed successfully');
      console.log('[BEDROCK] Input tokens:', responseBody.usage?.input_tokens || 0);
      console.log('[BEDROCK] Output tokens:', responseBody.usage?.output_tokens || 0);
      
      // Extract content from Claude response format
      const rawContent = responseBody.content[0].text;
      
      console.log('[BEDROCK] Raw content length:', rawContent.length);
      console.log('[BEDROCK] Raw content preview:', rawContent.substring(0, 200));
      
      // Extract JSON from content (handles markdown, mixed text, or pure JSON)
      let content = this.extractJsonFromContent(rawContent);
      
      console.log('[BEDROCK] Extracted content length:', content.length);
      
      // Validate response is valid JSON
      let parsedContent;
      try {
        parsedContent = JSON.parse(content);
        console.log('[BEDROCK] Content is valid JSON');
      } catch (error) {
        const parseError = error as SyntaxError;
        console.error('[BEDROCK] First parse attempt failed, trying JSON repair...');
        console.error('[BEDROCK] Parse error:', parseError.message);
        
        // Extract position from error message if available
        const positionMatch = parseError.message.match(/position (\d+)/);
        const errorPosition = positionMatch ? parseInt(positionMatch[1]) : -1;
        
        if (errorPosition > 0) {
          console.error('[BEDROCK] Error at position:', errorPosition);
          console.error('[BEDROCK] Context around error:');
          console.error('='.repeat(80));
          console.error(content.substring(Math.max(0, errorPosition - 100), Math.min(content.length, errorPosition + 100)));
          console.error('='.repeat(80));
        }
        
        // Try to repair the JSON
        const repairedContent = this.repairJson(content);
        
        try {
          parsedContent = JSON.parse(repairedContent);
          console.log('[BEDROCK] ✅ JSON repair successful!');
          content = repairedContent; // Use repaired version
        } catch (repairError) {
          const finalError = repairError as SyntaxError;
          console.error('[BEDROCK] ❌ JSON repair failed');
          console.error('[BEDROCK] Final parse error:', finalError.message);
          console.error('[BEDROCK] Content is NOT valid JSON after repair');
          console.error('[BEDROCK] EXTRACTED CONTENT LENGTH:', content.length);
          console.error('[BEDROCK] REPAIRED CONTENT LENGTH:', repairedContent.length);
          
          // Show first 1000 chars of repaired content
          console.error('[BEDROCK] REPAIRED CONTENT (first 1000 chars):');
          console.error('='.repeat(80));
          console.error(repairedContent.substring(0, 1000));
          console.error('='.repeat(80));
          
          // Extract position from final error
          const finalPositionMatch = finalError.message.match(/position (\d+)/);
          const finalErrorPosition = finalPositionMatch ? parseInt(finalPositionMatch[1]) : -1;
          
          if (finalErrorPosition > 0) {
            console.error('[BEDROCK] Final error at position:', finalErrorPosition);
            console.error('[BEDROCK] Context around final error:');
            console.error('='.repeat(80));
            console.error(repairedContent.substring(
              Math.max(0, finalErrorPosition - 200), 
              Math.min(repairedContent.length, finalErrorPosition + 200)
            ));
            console.error('='.repeat(80));
          }
          
          // Save failed content to file for debugging
          try {
            const fs = require('fs');
            const path = require('path');
            const debugDir = path.join(__dirname, '../../debug');
            if (!fs.existsSync(debugDir)) {
              fs.mkdirSync(debugDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const debugFile = path.join(debugDir, `bedrock-failed-${timestamp}.json`);
            fs.writeFileSync(debugFile, repairedContent, 'utf8');
            console.error('[BEDROCK] Failed content saved to:', debugFile);
          } catch (saveError) {
            console.error('[BEDROCK] Could not save debug file:', saveError);
          }
          
          throw new BedrockError('Bedrock response is not valid JSON', finalError);
        }
      }

      return {
        content,
        usage: {
          inputTokens: responseBody.usage?.input_tokens || 0,
          outputTokens: responseBody.usage?.output_tokens || 0,
        },
        modelId: this.modelId,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`[BEDROCK] Error after ${elapsed}ms:`, error);
      console.error('[BEDROCK] Error name:', (error as any)?.name);
      console.error('[BEDROCK] Error code:', (error as any)?.code);
      console.error('[BEDROCK] Error message:', (error as any)?.message);
      console.error('[BEDROCK] Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // Retry on throttling, timeouts, and 5xx errors
    const retryableErrors = [
      'ThrottlingException',
      'ServiceUnavailableException',
      'InternalServerException',
      'TimeoutError',
      'NetworkingError',
    ];
    
    const errorName = error?.name || '';
    const errorMessage = error?.message || '';
    
    return (
      retryableErrors.some(e => errorName.includes(e)) ||
      errorMessage.includes('timed out') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('ETIMEDOUT')
    );
  }

  /**
   * Get exponential backoff delay
   */
  private getBackoffDelay(attempt: number): number {
    // 1s, 2s, 4s
    return Math.pow(2, attempt) * 1000;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log analysis request to CloudWatch (anonymized data only)
   */
  private logAnalysisRequest(anonymizedData: AnonymizedData, response: BedrockResponse): void {
    // Log summary without sensitive data
    const logEntry = {
      timestamp: new Date().toISOString(),
      modelId: response.modelId,
      serverCount: anonymizedData.mpaData.servers?.length || 0,
      databaseCount: anonymizedData.mpaData.databases?.length || 0,
      maturityLevel: anonymizedData.mraData.maturityLevel,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      // Sample of anonymized data (first server hostname token)
      sampleAnonymizedData: {
        firstServerHostname: anonymizedData.mpaData.servers?.[0]?.hostname || 'N/A',
      },
    };
    
    console.log('Bedrock analysis request:', JSON.stringify(logEntry));
  }
}
