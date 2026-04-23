import { useState } from 'react';
import { Search } from 'lucide-react';

const terms: { term: string; def: string }[] = [
  { term: 'Agentless', def: 'Método de recolección de datos que no requiere instalación de software en los servidores objetivo. Utiliza conexiones remotas (SSH, WMI) para obtener información.' },
  { term: 'ALB (Application Load Balancer)', def: 'Balanceador de carga de AWS que opera en la capa 7 (aplicación) del modelo OSI, ideal para tráfico HTTP/HTTPS.' },
  { term: 'AMI (Amazon Machine Image)', def: 'Plantilla que contiene la configuración de software necesaria para lanzar una instancia EC2.' },
  { term: 'As-Is', def: 'Estado actual de la infraestructura antes de la migración.' },
  { term: 'Assessment', def: 'Fase inicial del programa MAP donde se evalúa el entorno actual del cliente y se desarrolla el plan de migración.' },
  { term: 'Auto Scaling', def: 'Capacidad de AWS para ajustar automáticamente la cantidad de recursos computacionales según la demanda.' },
  { term: 'Availability Zone (AZ)', def: 'Ubicación física aislada dentro de una región de AWS, diseñada para proporcionar alta disponibilidad.' },
  { term: 'Backup', def: 'Copia de seguridad de datos que permite la recuperación en caso de pérdida o corrupción.' },
  { term: 'Business Case', def: 'Documento que justifica la inversión en la migración, incluyendo análisis de costos, beneficios y ROI.' },
  { term: 'CapEx (Capital Expenditure)', def: 'Gastos de capital en activos físicos como servidores y equipamiento de datacenter.' },
  { term: 'CloudFormation', def: 'Servicio de AWS para crear y gestionar recursos mediante plantillas de infraestructura como código.' },
  { term: 'CloudTrail', def: 'Servicio de AWS que registra todas las llamadas a la API para auditoría y compliance.' },
  { term: 'CloudWatch', def: 'Servicio de monitoreo y observabilidad de AWS que recopila métricas, logs y eventos.' },
  { term: 'Compliance', def: 'Cumplimiento de regulaciones, estándares y políticas de seguridad aplicables.' },
  { term: 'DMS (Database Migration Service)', def: 'Servicio de AWS para migrar bases de datos hacia AWS de manera segura y eficiente.' },
  { term: 'DR (Disaster Recovery)', def: 'Conjunto de políticas, herramientas y procedimientos para recuperar la tecnología de la información después de un desastre.' },
  { term: 'EC2 (Elastic Compute Cloud)', def: 'Servicio de cómputo en la nube de AWS que proporciona capacidad de procesamiento escalable.' },
  { term: 'IAM (Identity and Access Management)', def: 'Servicio de AWS que permite gestionar el acceso a los recursos de AWS de forma segura.' },
  { term: 'Landing Zone', def: 'Entorno multi-cuenta de AWS preconfigurado y seguro que sirve como base para la migración.' },
  { term: 'Lift & Shift (Rehost)', def: 'Estrategia de migración que mueve aplicaciones a la nube sin cambios significativos.' },
  { term: 'MAP (Migration Acceleration Program)', def: 'Programa de AWS que proporciona metodología, herramientas y financiamiento para acelerar migraciones.' },
  { term: 'MGN (Application Migration Service)', def: 'Servicio de AWS que simplifica y agiliza la migración de servidores físicos, virtuales y en la nube.' },
  { term: 'MRA (Migration Readiness Assessment)', def: 'Evaluación que mide la preparación de una organización para migrar a AWS en seis perspectivas.' },
  { term: 'OpEx (Operational Expenditure)', def: 'Gastos operativos recurrentes, como servicios en la nube donde se paga por uso.' },
  { term: 'Rehost', def: 'Estrategia de migración tipo Lift & Shift: mover aplicaciones sin cambios.' },
  { term: 'Replatform', def: 'Estrategia de migración que realiza optimizaciones menores para aprovechar capacidades de la nube.' },
  { term: 'Refactor/Re-architect', def: 'Estrategia de migración que rediseña la aplicación para aprovechar capacidades nativas de la nube.' },
  { term: 'Repurchase', def: 'Estrategia de migración que reemplaza la aplicación existente por una solución SaaS.' },
  { term: 'Retire', def: 'Estrategia de migración que consiste en desactivar aplicaciones obsoletas o no utilizadas.' },
  { term: 'Retain', def: 'Estrategia de migración que mantiene aplicaciones on-premises por restricciones técnicas o de negocio.' },
  { term: 'Rightsizing', def: 'Proceso de seleccionar el tipo y tamaño óptimo de instancia EC2 basado en patrones de uso reales.' },
  { term: 'RVTools', def: 'Herramienta gratuita para exportar inventarios de entornos VMware vSphere.' },
  { term: 'S3 (Simple Storage Service)', def: 'Servicio de almacenamiento de objetos de AWS con alta durabilidad y disponibilidad.' },
  { term: 'SCT (Schema Conversion Tool)', def: 'Herramienta de AWS para convertir esquemas de bases de datos al migrar entre motores de BD.' },
  { term: 'TCO (Total Cost of Ownership)', def: 'Costo total de poseer y operar un sistema durante su vida útil, incluyendo hardware, software, personal y operaciones.' },
  { term: 'VPC (Virtual Private Cloud)', def: 'Red virtual privada en AWS que proporciona aislamiento y control sobre los recursos de red.' },
  { term: '7Rs', def: 'Las 7 estrategias de migración: Retire, Retain, Rehost, Relocate, Repurchase, Replatform, Refactor.' },
];

export function WikiGlosario() {
  const [search, setSearch] = useState('');

  const filtered = terms.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.def.toLowerCase().includes(search.toLowerCase())
  );

  const letters = [...new Set(filtered.map((t) => t.term[0].toUpperCase()))].sort();

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar término..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-300"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No se encontraron términos para "{search}"</p>
      ) : (
        letters.map((letter) => {
          const group = filtered.filter((t) => t.term[0].toUpperCase() === letter);
          return (
            <div key={letter}>
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-fuchsia-100 text-fuchsia-800 font-bold w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0">
                  {letter}
                </span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="space-y-2 ml-2">
                {group.map((item) => (
                  <div key={item.term} className="p-3 bg-white border border-gray-100 rounded-xl hover:border-fuchsia-200 transition-colors">
                    <p className="text-sm font-semibold text-fuchsia-800">{item.term}</p>
                    <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{item.def}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
