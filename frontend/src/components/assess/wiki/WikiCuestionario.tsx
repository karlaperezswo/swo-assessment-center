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

const sections = [
  {
    n: '1', title: 'Información General',
    items: [
      'Nombre de la organización y unidad de negocio',
      'Contactos clave (IT, Seguridad, Operaciones)',
      'Objetivos de negocio para la migración',
      'Timeline esperado y restricciones',
      'Presupuesto estimado',
    ],
  },
  {
    n: '2', title: 'Infraestructura Actual',
    items: [
      'Número total de servidores físicos y virtuales',
      'Plataformas de virtualización utilizadas',
      'Centros de datos (ubicaciones, características)',
      'Proveedores de hosting actuales',
      'Capacidad de almacenamiento y tipos',
      'Infraestructura de red (switches, routers, firewalls)',
    ],
  },
  {
    n: '3', title: 'Aplicaciones',
    items: [
      'Inventario de aplicaciones críticas',
      'Tecnologías y lenguajes utilizados',
      'Bases de datos (tipos, versiones, tamaños)',
      'Aplicaciones comerciales vs desarrolladas internamente',
      'Integraciones entre aplicaciones',
      'Aplicaciones con requisitos especiales de compliance',
    ],
  },
  {
    n: '4', title: 'Seguridad y Compliance',
    items: [
      'Frameworks de seguridad implementados (ISO 27001, SOC 2, etc.)',
      'Requisitos regulatorios (GDPR, HIPAA, PCI-DSS, etc.)',
      'Políticas de cifrado de datos',
      'Gestión de identidades y accesos',
      'Procedimientos de backup y disaster recovery',
      'Auditorías de seguridad recientes',
    ],
  },
  {
    n: '5', title: 'Operaciones',
    items: [
      'Estructura del equipo de IT (tamaño, roles)',
      'Herramientas de monitoreo utilizadas',
      'Procesos de gestión de cambios',
      'SLAs y métricas de disponibilidad',
      'Ventanas de mantenimiento disponibles',
      'Procedimientos de incident management',
    ],
  },
  {
    n: '6', title: 'Red y Conectividad',
    items: [
      'Topología de red actual',
      'Ancho de banda disponible (internet, WAN)',
      'Conexiones dedicadas o VPN',
      'Requisitos de latencia',
      'Segmentación de red y VLANs',
      'Políticas de firewall',
    ],
  },
  {
    n: '7', title: 'Licenciamiento',
    items: [
      'Licencias de sistemas operativos',
      'Licencias de bases de datos',
      'Licencias de aplicaciones comerciales',
      'Contratos de soporte vigentes',
      'Restricciones de licenciamiento para cloud',
    ],
  },
  {
    n: '8', title: 'Experiencia Cloud',
    items: [
      'Experiencia previa con cloud (AWS, Azure, GCP)',
      'Cuentas de AWS existentes',
      'Cargas de trabajo ya en cloud',
      'Skills del equipo en tecnologías cloud',
      'Capacitaciones realizadas',
    ],
  },
];

export function WikiCuestionario() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Cuestionario de Infraestructura</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El cuestionario de infraestructura es un componente esencial del MAP Assessment que complementa los datos
            recolectados por las herramientas automatizadas. Permite capturar información cualitativa y contextual
            que no puede ser obtenida mediante agentes.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Obtener una visión completa del entorno del cliente, incluyendo aspectos
            organizacionales, operacionales y estratégicos que influirán en la migración.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Proceso</h3>
          <p className="text-sm text-gray-600">El cuestionario debe ser completado en colaboración con los stakeholders clave del cliente:</p>
          {[
            {
              n: '1', title: 'Preparación',
              items: [
                'Identificar a los participantes clave (IT, Seguridad, Operaciones, Negocio)',
                'Programar sesiones de trabajo (2–3 sesiones de 2 horas cada una)',
                'Enviar el cuestionario con anticipación para revisión',
                'Preparar contexto y objetivos de cada sección',
              ],
            },
            {
              n: '2', title: 'Ejecución',
              items: [
                'Conducir sesiones estructuradas por área temática',
                'Documentar respuestas detalladas y ejemplos específicos',
                'Solicitar evidencia documental cuando sea relevante',
                'Identificar áreas que requieren profundización',
              ],
            },
            {
              n: '3', title: 'Validación',
              items: [
                'Revisar respuestas con el equipo técnico del cliente',
                'Contrastar información con datos de herramientas de colecta',
                'Resolver inconsistencias o ambigüedades',
                'Obtener aprobación final del cuestionario completado',
              ],
            },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-1.5">{step.title}</p>
                <ul className="space-y-1.5">
                  {step.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Plantilla del Cuestionario</h3>
          <p className="text-sm text-gray-600">El cuestionario está organizado en las siguientes secciones principales:</p>
          {sections.map((sec) => (
            <div key={sec.n} className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-fuchsia-800 mb-2">Sección {sec.n}: {sec.title}</h4>
              <ul className="space-y-1.5">
                {sec.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Guía de Aplicación</h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Mejores Prácticas</h4>
            <ul className="space-y-1.5">
              <CheckItem><strong>Preparación:</strong> Envía el cuestionario con 1 semana de anticipación</CheckItem>
              <CheckItem><strong>Contexto:</strong> Explica el propósito de cada pregunta y cómo se usará la información</CheckItem>
              <CheckItem><strong>Ejemplos:</strong> Solicita ejemplos concretos, no solo respuestas genéricas</CheckItem>
              <CheckItem><strong>Documentación:</strong> Pide evidencia documental (diagramas, políticas, reportes)</CheckItem>
              <CheckItem><strong>Validación cruzada:</strong> Contrasta respuestas con datos de herramientas</CheckItem>
              <CheckItem><strong>Seguimiento:</strong> Programa sesiones de clarificación si es necesario</CheckItem>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Áreas Críticas a Profundizar</h4>
            <ul className="space-y-1.5">
              <CheckItem>Aplicaciones con dependencias complejas</CheckItem>
              <CheckItem>Requisitos de compliance específicos</CheckItem>
              <CheckItem>Restricciones de licenciamiento</CheckItem>
              <CheckItem>Limitaciones de ancho de banda</CheckItem>
              <CheckItem>Ventanas de mantenimiento muy restrictivas</CheckItem>
              <CheckItem>Aplicaciones sin documentación</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas Descargables</h3>
          <ul className="space-y-2">
            {[
              '📄 Cuestionario de Infraestructura Completo (Word)',
              '📄 Cuestionario de Infraestructura (Excel)',
              '📄 Guía de Entrevista para Stakeholders',
              '📄 Template de Consolidación de Respuestas',
            ].map((item) => (
              <li key={item} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{item}</li>
            ))}
          </ul>
          <InfoAlert>
            <strong>Tip:</strong> El cuestionario debe completarse en paralelo con la recolección de datos de las herramientas, no después. Esto permite identificar gaps tempranamente y ajustar el alcance si es necesario.
          </InfoAlert>
        </CardContent>
      </Card>
    </div>
  );
}
