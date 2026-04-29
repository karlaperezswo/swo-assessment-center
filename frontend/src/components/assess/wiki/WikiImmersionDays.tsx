import { CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <CheckCircle className="h-4 w-4 text-fuchsia-500 flex-shrink-0 mt-0.5" />
      <span>{children}</span>
    </li>
  );
}

const immersionTypes = [
  {
    n: '1',
    title: 'Immersion Day Foundational',
    duration: '1 día (8 horas)',
    audience: 'Equipos nuevos en AWS',
    color: 'border-blue-200',
    headerColor: 'bg-blue-50 text-blue-800',
    items: [
      'Introducción a AWS y servicios core',
      'Conceptos de VPC y networking',
      'Compute con EC2',
      'Almacenamiento con S3 y EBS',
      'Bases de datos con RDS',
      'Seguridad básica (IAM, Security Groups)',
    ],
  },
  {
    n: '2',
    title: 'Immersion Day de Migración',
    duration: '1–2 días',
    audience: 'Equipos técnicos involucrados en la migración',
    color: 'border-fuchsia-200',
    headerColor: 'bg-fuchsia-50 text-fuchsia-800',
    items: [
      'Estrategias de migración (7Rs)',
      'AWS Application Migration Service (MGN)',
      'AWS Database Migration Service (DMS)',
      'Herramientas de migración (CloudEndure, Server Migration Service)',
      'Migración de bases de datos',
      'Testing y validación post-migración',
    ],
  },
  {
    n: '3',
    title: 'Immersion Day de Seguridad',
    duration: '1 día',
    audience: 'Equipos de seguridad y compliance',
    color: 'border-purple-200',
    headerColor: 'bg-purple-50 text-purple-800',
    items: [
      'AWS Shared Responsibility Model',
      'IAM avanzado y políticas',
      'Cifrado de datos (KMS, CloudHSM)',
      'Network security (WAF, Shield, GuardDuty)',
      'Compliance y auditoría (CloudTrail, Config)',
      'Security best practices',
    ],
  },
  {
    n: '4',
    title: 'Immersion Day de Modernización',
    duration: '1–2 días',
    audience: 'Desarrolladores y arquitectos',
    color: 'border-green-200',
    headerColor: 'bg-green-50 text-green-800',
    items: [
      'Arquitecturas serverless (Lambda, API Gateway)',
      'Contenedores (ECS, EKS)',
      'Microservicios y desacoplamiento',
      'CI/CD en AWS (CodePipeline, CodeBuild)',
      'Bases de datos modernas (DynamoDB, Aurora Serverless)',
    ],
  },
  {
    n: '5',
    title: 'Immersion Day Específico por Industria',
    duration: '1 día',
    audience: 'Equipos de industrias específicas',
    color: 'border-amber-200',
    headerColor: 'bg-amber-50 text-amber-800',
    items: [
      'Financial Services',
      'Healthcare & Life Sciences',
      'Retail & E-commerce',
      'Manufacturing',
      'Media & Entertainment',
    ],
  },
];

const agendaRows = [
  { time: '9:00 – 9:30', activity: 'Bienvenida y Objetivos del Día', duration: '30 min' },
  { time: '9:30 – 10:30', activity: 'Módulo 1: Fundamentos de AWS', duration: '60 min' },
  { time: '10:30 – 10:45', activity: 'Break', duration: '15 min' },
  { time: '10:45 – 12:00', activity: 'Lab 1: Hands-on Práctica', duration: '75 min' },
  { time: '12:00 – 13:00', activity: 'Almuerzo', duration: '60 min' },
  { time: '13:00 – 14:00', activity: 'Módulo 2: Tema Específico', duration: '60 min' },
  { time: '14:00 – 15:30', activity: 'Lab 2: Hands-on Avanzado', duration: '90 min' },
  { time: '15:30 – 15:45', activity: 'Break', duration: '15 min' },
  { time: '15:45 – 16:45', activity: 'Módulo 3: Best Practices', duration: '60 min' },
  { time: '16:45 – 17:30', activity: 'Q&A y Próximos Pasos', duration: '45 min' },
];

export function WikiImmersionDays() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Immersion Days</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Los AWS Immersion Days son sesiones de capacitación práctica diseñadas para acelerar el conocimiento del
            equipo del cliente sobre servicios y mejores prácticas de AWS. Son un componente valioso del MAP Assessment
            que prepara al equipo para la migración.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Proporcionar experiencia práctica con servicios de AWS relevantes para la
            migración del cliente, reduciendo la curva de aprendizaje y aumentando la confianza del equipo.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">¿Qué son los Immersion Days?</h3>
          <p className="text-sm text-gray-700">
            Los Immersion Days son talleres técnicos de 1 a 2 días de duración donde los participantes:
          </p>
          <ul className="space-y-1.5">
            <CheckItem>Aprenden conceptos fundamentales de AWS</CheckItem>
            <CheckItem>Realizan ejercicios prácticos hands-on</CheckItem>
            <CheckItem>Construyen arquitecturas reales en AWS</CheckItem>
            <CheckItem>Reciben guía de expertos certificados</CheckItem>
            <CheckItem>Exploran casos de uso específicos de su industria</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Tipos de Immersion Days Disponibles</h3>
          {immersionTypes.map((type) => (
            <div key={type.n} className={`border ${type.color} rounded-lg overflow-hidden`}>
              <div className={`px-4 py-3 ${type.headerColor}`}>
                <p className="font-semibold text-sm">{type.n}. {type.title}</p>
                <div className="flex gap-4 mt-1 text-xs opacity-80">
                  <span>⏱ {type.duration}</span>
                  <span>👥 {type.audience}</span>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Contenido:</p>
                <ul className="space-y-1.5">
                  {type.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Materiales de Apoyo</h3>
          <p className="text-sm text-gray-600">Recursos disponibles para preparar y ejecutar Immersion Days:</p>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Guías de Facilitador</h4>
              <ul className="space-y-1.5">
                {['Foundational', 'de Migración', 'de Seguridad', 'de Modernización'].map((type) => (
                  <li key={type} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-1.5">
                    📘 Guía del Facilitador – Immersion Day {type}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Manuales del Participante</h4>
              <ul className="space-y-1.5">
                {['Foundational', 'Migración', 'Seguridad', 'Modernización'].map((type) => (
                  <li key={type} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-1.5">
                    📗 Manual del Participante – {type} (PDF)
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Laboratorios Hands-On</h4>
              <ul className="space-y-1.5">
                {[
                  'Lab 1: Creación de VPC y Subnets',
                  'Lab 2: Despliegue de Aplicación en EC2',
                  'Lab 3: Configuración de RDS Multi-AZ',
                  'Lab 4: Migración con AWS MGN',
                  'Lab 5: Implementación de WAF y Shield',
                  'Lab 6: Despliegue Serverless con Lambda',
                ].map((lab) => (
                  <li key={lab} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
                    🔬 {lab}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Presentaciones</h4>
              <ul className="space-y-1.5">
                {[
                  'Introducción a AWS (PowerPoint)',
                  'Estrategias de Migración',
                  'Well-Architected Framework',
                  'Seguridad en AWS',
                  'Optimización de Costos',
                ].map((pres) => (
                  <li key={pres} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">
                    📊 Presentación: {pres}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plantillas y Scripts</h4>
              <ul className="space-y-1.5">
                {[
                  '📄 CloudFormation Templates para Labs',
                  '📄 Scripts de Automatización',
                  '📄 Checklist de Preparación de Immersion Day',
                  '📄 Encuesta de Evaluación Post-Evento',
                ].map((item) => (
                  <li key={item} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-1.5">{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Videos de Capacitaciones</h3>
          <p className="text-sm text-gray-600">Biblioteca de videos para preparación y seguimiento:</p>

          {[
            {
              title: 'Videos Introductorios',
              items: [
                'Bienvenida a AWS – Conceptos Básicos (15 min)',
                'Navegando la Consola de AWS (20 min)',
                'Introducción al Well-Architected Framework (25 min)',
              ],
            },
            {
              title: 'Videos de Servicios Core',
              items: [
                'Amazon EC2 – Fundamentos y Mejores Prácticas (30 min)',
                'Amazon VPC – Diseño de Redes en AWS (35 min)',
                'Amazon S3 – Almacenamiento de Objetos (25 min)',
                'Amazon RDS – Bases de Datos Relacionales (30 min)',
                'AWS IAM – Gestión de Identidades y Accesos (40 min)',
              ],
            },
            {
              title: 'Videos de Migración',
              items: [
                'Estrategias de Migración – Las 7Rs (20 min)',
                'AWS Application Migration Service (MGN) – Tutorial Completo (45 min)',
                'AWS Database Migration Service (DMS) – Paso a Paso (40 min)',
                'Migración de Aplicaciones Windows a AWS (35 min)',
                'Migración de Bases de Datos Oracle a Aurora (50 min)',
              ],
            },
            {
              title: 'Videos de Seguridad',
              items: [
                'Modelo de Responsabilidad Compartida (15 min)',
                'AWS Security Best Practices (30 min)',
                'Implementación de AWS WAF (25 min)',
                'Cifrado de Datos con AWS KMS (30 min)',
                'Auditoría y Compliance con CloudTrail y Config (35 min)',
              ],
            },
            {
              title: 'Videos de Modernización',
              items: [
                'Introducción a AWS Lambda y Serverless (30 min)',
                'Contenedores en AWS – ECS vs EKS (40 min)',
                'Arquitecturas de Microservicios en AWS (45 min)',
                'CI/CD con AWS CodePipeline (35 min)',
              ],
            },
            {
              title: 'Grabaciones de Immersion Days Anteriores',
              items: [
                'Immersion Day Completo – Foundational (6 horas)',
                'Immersion Day Completo – Migración (8 horas)',
                'Immersion Day Completo – Seguridad (6 horas)',
              ],
            },
          ].map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{group.title}</h4>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item} className="text-sm text-gray-700 px-3 py-1 bg-gray-50 border border-gray-100 rounded">
                    🎥 {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Planificación de un Immersion Day</h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Checklist de Preparación</h4>
            <ul className="space-y-1.5">
              {[
                'Identificar audiencia y nivel de conocimiento',
                'Seleccionar tipo de Immersion Day apropiado',
                'Coordinar fecha y ubicación (presencial o virtual)',
                'Confirmar facilitadores y expertos técnicos',
                'Preparar cuentas de AWS para laboratorios',
                'Configurar entorno de laboratorio (CloudFormation)',
                'Enviar materiales pre-lectura a participantes',
                'Preparar equipos y conectividad',
                'Imprimir manuales del participante',
                'Preparar encuesta de evaluación',
              ].map((item) => <CheckItem key={item}>{item}</CheckItem>)}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Agenda Típica (1 día)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Hora</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Actividad</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración</th>
                  </tr>
                </thead>
                <tbody>
                  {agendaRows.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 whitespace-nowrap">{row.time}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.activity}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-600 whitespace-nowrap">{row.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <InfoAlert>
            <strong>Recomendación:</strong> Programa el Immersion Day durante la fase de Assessment o al inicio de la fase de Mobilize para maximizar el valor y preparar al equipo para la migración.
          </InfoAlert>
        </CardContent>
      </Card>
    </div>
  );
}
