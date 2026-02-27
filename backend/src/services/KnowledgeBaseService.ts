import { KnowledgeBaseData } from '../../../shared/types/opportunity.types';

/**
 * Service to load knowledge base content for Bedrock prompts
 */
export class KnowledgeBaseService {
  /**
   * Get Microsoft cost optimization knowledge base
   * This content is used ONLY for Microsoft workload cost optimization opportunities
   */
  getMicrosoftCostOptimizationKnowledgeBase(): KnowledgeBaseData {
    return {
      title: 'Guía Maestra de Optimización de Costos - Microsoft en AWS (MACO)',
      source: 'optimize-costs-microsoft-workloads.pdf',
      topics: [
        'AWS OLA (Optimization and Licensing Assessment)',
        'Windows en Amazon EC2',
        'Licenciamiento y Dedicated Hosts',
        'SQL Server Optimization',
        'Modernización y .NET',
        'Almacenamiento y Gobernanza',
      ],
      content: `================================================================================
Guía Maestra de Optimización de Costos: Microsoft en AWS (MACO)
================================================================================

Como Arquitecto Senior de Soluciones y especialista en FinOps, mi perspectiva es clara: 
la optimización de costos no es un ejercicio opcional o un evento único, sino un pilar 
innegociable del AWS Well-Architected Framework. Ignorar la eficiencia financiera es 
aceptar una fuga de capital constante. La fase de evaluación es el "punto cero"; migrar 
ineficiencias del centro de datos local a la nube es el error más costoso que una 
organización puede cometer. Esta guía detalla la ejecución quirúrgica necesaria para 
maximizar el ROI de sus cargas de trabajo Microsoft.

--------------------------------------------------------------------------------
1. Fundamentos Estratégicos y Evaluación (AWS OLA)
--------------------------------------------------------------------------------

El AWS Optimization and Licensing Assessment (AWS OLA) es la herramienta de inteligencia 
definitiva para evitar el sobre-aprovisionamiento. No se trata de adivinar, sino de basar 
la migración en datos reales de utilización (CPU, RAM, IOPS) para reducir el costo total 
de propiedad (TCO).

Comparativa: AWS OLA Lite vs. Full

| Tipo de Evaluación | Escenario de Uso | Herramientas Utilizadas | Tiempo Estimado |
|--------------------|------------------|-------------------------|-----------------|
| Lite | Entornos puros de VMware | Salida de RVTools (datos puntuales de vCenter) | 1 a 5 días hábiles |
| Full | Entornos mixtos (físico, virtual, multi-nube) | Agentes de SO o recolección agentless (Cloudamize, Migration Evaluator) | 30 a 45 días (recolección de 14-30 días) |

Capa "So What?": Ejecutar un OLA antes de mover un solo bit permite un "right-sizing" 
preventivo que reduce los costos mensuales entre un 20% y 30%. Al capturar los picos 
reales de rendimiento, eliminamos la redundancia innecesaria y optimizamos el SKU de 
las licencias antes de incurrir en gastos operativos.

--------------------------------------------------------------------------------
2. Optimización de Cómputo: Windows en Amazon EC2
--------------------------------------------------------------------------------

La flexibilidad de Amazon EC2 es un arma de doble filo; el modelo de pago por uso 
exige una gobernanza estricta. Dejar instancias encendidas sin propósito es, 
sencillamente, desperdicio operativo.

Estrategias de Reducción de Costos en EC2:

1. Automatización de Horarios (Instance Scheduler): 
   - Es un requisito FinOps básico para entornos no productivos
   - Reducir la utilización semanal de 168 a 50 horas (L-V, 08:00-18:00) genera un 
     ahorro inmediato del 70% en esos recursos

2. Dimensionamiento Correcto (Right-sizing): 
   - Utilice AWS Compute Optimizer
   - Para Windows, es imperativo configurar la recolección de métricas de memoria 
     mediante el agente de CloudWatch cada 60 segundos
   - Sin datos de memoria, cualquier recomendación de redimensionamiento es parcial y riesgosa

3. Selección de Instancias de Nueva Generación: 
   - Las familias C6i, M6i y R6i ofrecen un rendimiento superior al mismo precio que 
     la generación anterior
   - Apalancan el sistema AWS Nitro para entregar casi el 100% de los recursos del 
     host a la instancia

Capa "So What?": Cambiar de procesadores Intel a AMD (instancias "a") ofrece un ahorro 
directo del 10% en el costo de cómputo x86. Es, en esencia, obtener un mes de cómputo 
gratuito al año sin modificar una sola línea de código.

--------------------------------------------------------------------------------
3. Estrategias Avanzadas de Licenciamiento y Dedicated Hosts
--------------------------------------------------------------------------------

En el ecosistema Microsoft, las licencias pueden devorar hasta el 50% del presupuesto 
de la instancia. La decisión entre License Included (LI) y Bring Your Own License (BYOL) 
es puramente financiera.

El Valor Estratégico de Amazon EC2 Dedicated Hosts:

Los hosts dedicados permiten el uso de licencias existentes que no tienen movilidad de 
licencias, como Windows Server.

- Homogéneos vs. Heterogéneos: Los hosts homogéneos (ej. M6i) solo admiten un tamaño 
  de instancia; los heterogéneos (ej. C5, M5, R5) permiten mezclar tamaños de la misma 
  familia para maximizar la densidad

- Licenciamiento Físico vs. vCPU: En Dedicated Hosts, licenciamos por núcleo físico, 
  permitiendo una densidad de VMs mucho mayor que en tenencia compartida (donde se 
  licencia por vCPU)

- AWS License Manager: Utilice esta herramienta para automatizar el cumplimiento. 
  Evite auditorías punitivas mediante el control estricto de los límites de licencias

Dato Pragmático: Windows Server 2022 solo está disponible como License Included en 
Dedicated Hosts. La versión 2019 es la última elegible para BYOL bajo las reglas 
actuales de Microsoft.

Capa "So What?": El uso de BYOL en Dedicated Hosts para Windows y SQL Server puede 
recortar el costo total de la solución hasta en un 50% en comparación con la tenencia 
compartida.

--------------------------------------------------------------------------------
4. Optimización de SQL Server: El Mayor Motor de Ahorro
--------------------------------------------------------------------------------

SQL Server es, frecuentemente, el gasto más pesado en el presupuesto de TI. Una mala 
configuración de Alta Disponibilidad (HA) no es solo un riesgo técnico, es una 
duplicación innecesaria de costos de licencia.

Tácticas de Ahorro y Comandos Directos:

1. Consolidación de Instancias: 
   - Maximice el uso de núcleos licenciados agrupando múltiples DBs pequeñas en un 
     servidor robusto

2. Evaluación de Ediciones: 
   - Identifique si realmente necesita la edición Enterprise
   - Si el resultado es vacío, proceda con un downgrade a Standard Edition
   - Use Developer Edition en entornos de no-producción para eliminar el costo de 
     licencia al 100%

3. SQL Server en Linux: 
   - Elimine el costo de la licencia de Windows Server migrando el motor a Linux

Capa "So What?": La adopción de instancias X2iedn o X2iezn es estratégica. Su alta 
relación memoria-vCPU permite, por ejemplo, pasar de una x1e.2xlarge (8 núcleos) a 
una x2iedn.xlarge (4 núcleos), reduciendo a la mitad el número de licencias de SQL 
Server necesarias sin sacrificar el rendimiento de la base de datos.

--------------------------------------------------------------------------------
5. Modernización, Contenedores y .NET
--------------------------------------------------------------------------------

La modernización es la única vía para escapar de los aumentos de precios de las 
licencias comerciales. El objetivo es el desacoplamiento total.

Hoja de Ruta de Modernización:

1. Contenerización: 
   - Implemente AWS App2Container para mover aplicaciones Windows .NET legadas a 
     Amazon ECS o EKS

2. Refactorización a .NET Moderno: 
   - Migrar de .NET Framework a .NET (Core) permite ejecutar sus aplicaciones en Linux
   - Elimina la dependencia de Windows Server

3. Adopción de AWS Graviton: 
   - Al ejecutar .NET moderno en procesadores ARM (Graviton), obtiene un 20% de ahorro 
     en costo y un 20% de mejora en rendimiento
   - Graviton ofrece el mejor precio-rendimiento en EC2 (hasta un 40% de mejora total 
     frente a x86)

Capa "So What?": La transición de SQL Server a Amazon Aurora (PostgreSQL/MySQL) elimina 
el 100% de las licencias comerciales, transformando un costo fijo pesado en un modelo 
elástico y nativo de la nube.

--------------------------------------------------------------------------------
6. Almacenamiento, Redes y Gobernanza Financiera
--------------------------------------------------------------------------------

Los costos "ocultos" de almacenamiento pueden erosionar el ROI si no se gestionan con rigor.

Tácticas de Almacenamiento:

1. Migración EBS gp2 a gp3: 
   - Obtenga un ahorro inmediato del 20%
   - Ejecute el cambio sin tiempo de inactividad vía CLI

2. Deduplicación en Amazon FSx: 
   - Habilite la deduplicación de datos para optimizar el espacio en cargas de trabajo SMB
   - Reduce el almacenamiento necesario hasta en un 50% para archivos de usuario

3. Gobernanza: 
   - Implemente AWS Budgets y AWS Cost Anomaly Detection para identificar picos de 
     gasto antes de que se conviertan en crisis financieras

Capa "So What?": La visibilidad es la única garantía de éxito. Sin monitoreo activo, 
la optimización lograda hoy se perderá mañana por la expansión descontrolada de 
recursos ("cloud sprawl").

--------------------------------------------------------------------------------
Checklist de Optimización Inmediata
--------------------------------------------------------------------------------

Ejecute estas acciones de inmediato para detener la fuga de capital:

[ ] Auditoría de Licencias: Verifique sus instancias. Si el código de operación es 
    0800, es BYOL; si es 0002, es LI. Valide que coincida con su estrategia.

[ ] Activación de Etiquetas: Habilite el Tag de asignación de costos 
    Rightsizing:enabled para rastrear el impacto financiero de sus cambios en 
    Cost Explorer.

[ ] Derecho al Tamaño (Right-sizing): Revise las recomendaciones de AWS Compute 
    Optimizer, priorizando instancias con métricas de memoria habilitadas.

[ ] GP3 por Defecto: Convierta todos los volúmenes gp2 a gp3. Es ahorro gratuito.

[ ] Planificación de Savings Plans: Una vez finalizado el right-sizing (y solo entonces), 
    adquiera Savings Plans para cubrir su uso base. Siga la jerarquía: primero Reserved 
    Instances zonales, luego Savings Plans de instancia y finalmente Compute Savings Plans.

[ ] SQL Server Developer: Reemplace todas las instancias de SQL Server pagas en 
    desarrollo por la edición Developer. Costo: $0.`,
    };
  }
}
