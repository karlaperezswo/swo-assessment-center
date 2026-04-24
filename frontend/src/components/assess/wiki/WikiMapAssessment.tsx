import { useState } from 'react';
import { Info, CheckCircle, ChevronRight, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type MapPage =
  | 'overview'
  | 'kickoff-interno'
  | 'kickoff-externo'
  | 'seleccion-herramienta'
  | 'instalacion-agentes'
  | 'recoleccion-datos'
  | 'validacion-analisis'
  | 'business-case'
  | 'plan-migracion'
  | 'presentacion';

const subPages: { value: MapPage; label: string }[] = [
  { value: 'overview', label: 'Visión General' },
  { value: 'kickoff-interno', label: 'Kickoff Interno' },
  { value: 'kickoff-externo', label: 'Kickoff Externo' },
  { value: 'seleccion-herramienta', label: 'Selección de Herramienta' },
  { value: 'instalacion-agentes', label: 'Instalación de Agentes' },
  { value: 'recoleccion-datos', label: 'Recolección de Datos' },
  { value: 'validacion-analisis', label: 'Validación y Análisis' },
  { value: 'business-case', label: 'Business Case' },
  { value: 'plan-migracion', label: 'Plan de Migración' },
  { value: 'presentacion', label: 'Presentación Ejecutiva' },
];

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function TipAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
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

function StepHeader({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
        {number}
      </span>
      <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Introducción a la Fase</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            La fase de Assessment es el punto de partida fundamental del programa MAP. Durante esta etapa, se realiza un
            análisis exhaustivo del entorno actual del cliente para comprender su infraestructura, aplicaciones,
            dependencias y costos operativos.
          </p>
          <InfoAlert>
            <strong>Objetivo Principal:</strong> Proporcionar una visión clara y detallada del estado actual de la
            infraestructura y desarrollar un plan de migración estratégico basado en datos reales.
          </InfoAlert>
          <p className="text-sm text-gray-700">Los entregables clave de esta fase incluyen:</p>
          <ul className="space-y-1.5">
            <CheckItem>Inventario completo de la infraestructura</CheckItem>
            <CheckItem>Análisis de dependencias entre aplicaciones</CheckItem>
            <CheckItem>Business case con proyección de costos</CheckItem>
            <CheckItem>Plan de migración priorizado</CheckItem>
            <CheckItem>Identificación de riesgos y estrategias de mitigación</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <img
            src="/proceso-assessment.png"
            alt="Proceso de Assessment"
            className="w-full rounded-xl border border-gray-200 shadow-sm"
          />
          <h3 className="font-semibold text-gray-800">Proceso de Assessment</h3>
          <p className="text-sm text-gray-600">El proceso de Assessment se ejecuta siguiendo estos pasos estructurados:</p>

          <div className="space-y-4">
            <div><StepHeader number="1" title="Preparación Inicial" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Revisión de objetivos del cliente</CheckItem>
                <CheckItem>Identificación de stakeholders clave</CheckItem>
                <CheckItem>Definición del alcance del assessment</CheckItem>
                <CheckItem>Planificación de recursos y timeline</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="2" title="Descubrimiento de Infraestructura" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Selección de herramienta de colecta (Cloudamize, Concierto o Matilda)</CheckItem>
                <CheckItem>Instalación y configuración de agentes</CheckItem>
                <CheckItem>Recolección de datos durante el período definido (mínimo 2 semanas)</CheckItem>
                <CheckItem>Validación de datos recolectados</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="3" title="Análisis y Evaluación" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Análisis de patrones de uso y performance</CheckItem>
                <CheckItem>Mapeo de dependencias</CheckItem>
                <CheckItem>Evaluación de estrategias de migración (7Rs)</CheckItem>
                <CheckItem>Cálculo de TCO (Total Cost of Ownership)</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="4" title="Desarrollo del Business Case" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Análisis comparativo de costos on-premises vs. AWS</CheckItem>
                <CheckItem>Identificación de beneficios tangibles e intangibles</CheckItem>
                <CheckItem>Proyección de ROI</CheckItem>
                <CheckItem>Análisis de riesgos</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="5" title="Plan de Migración" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Agrupación de aplicaciones en waves</CheckItem>
                <CheckItem>Priorización basada en complejidad y valor de negocio</CheckItem>
                <CheckItem>Definición de timeline y recursos necesarios</CheckItem>
                <CheckItem>Identificación de quick wins</CheckItem>
              </ul>
            </div>
          </div>

          <TipAlert>
            <strong>Duración Típica:</strong> Un MAP Assessment completo suele tomar entre 4 a 8 semanas,
            dependiendo del tamaño y complejidad del entorno.
          </TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist de Seguimiento (MAP Assessments)</h3>
          <p className="text-sm text-gray-600">
            Te recomendamos utilizar el siguiente checklist para asegurar que todos los componentes del assessment
            se completen correctamente:
          </p>
          <ul className="space-y-1.5">
            <CheckItem>Kickoff interno realizado con el equipo</CheckItem>
            <CheckItem>Kickoff con cliente completado</CheckItem>
            <CheckItem>Herramienta de colecta seleccionada</CheckItem>
            <CheckItem>Agentes instalados y recolectando datos</CheckItem>
            <CheckItem>Cuestionario de infraestructura completado</CheckItem>
            <CheckItem>Período de recolección completado (mínimo 2 semanas)</CheckItem>
            <CheckItem>Datos validados y analizados</CheckItem>
            <CheckItem>Diagrama de infraestructura creado</CheckItem>
            <CheckItem>Business case desarrollado</CheckItem>
            <CheckItem>Plan de migración documentado</CheckItem>
            <CheckItem>Presentación ejecutiva preparada</CheckItem>
            <CheckItem>Revisión final con stakeholders completada</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Kickoff Interno y Externo</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El kickoff interno es una reunión crucial que debe realizarse antes de iniciar el engagement con el cliente.
            Su propósito es alinear al equipo de consultores sobre los objetivos, alcance y metodología del assessment.
          </p>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Agenda del Kickoff Interno</h4>
            <div className="space-y-3">
              {[
                { n: '1', t: 'Revisión del Cliente', time: '15 min', items: ['Información general del cliente', 'Industria y contexto de negocio', 'Objetivos de la migración'] },
                { n: '2', t: 'Alcance del Assessment', time: '20 min', items: ['Entornos a evaluar', 'Exclusiones y limitaciones', 'Timeline y milestones'] },
                { n: '3', t: 'Asignación de Roles', time: '15 min', items: ['Lead consultant', 'Technical consultants', 'Especialistas por área'] },
                { n: '4', t: 'Herramientas y Metodología', time: '20 min', items: ['Selección de herramienta de colecta', 'Proceso de recolección de datos', 'Templates y documentación a utilizar'] },
                { n: '5', t: 'Próximos Pasos', time: '10 min', items: ['Preparación para kickoff con cliente', 'Materiales a preparar', 'Fecha del kickoff con cliente'] },
              ].map((item) => (
                <div key={item.n} className="flex gap-3">
                  <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-800">{item.t}</p>
                      <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span>
                    </div>
                    <ul className="space-y-0.5">
                      {item.items.map((i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <span className="text-fuchsia-400 mt-0.5">•</span>{i}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <TipAlert>
            Documenta todas las decisiones tomadas durante el kickoff interno y compártelas con el equipo para
            referencia futura.
          </TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

function KickoffInternoPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Kickoff Interno</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El kickoff interno es una reunión crucial que debe realizarse antes de iniciar el engagement con el cliente.
            Su propósito es alinear al equipo de consultores sobre los objetivos, alcance y metodología del assessment.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Asegurar que todo el equipo esté alineado y preparado antes de iniciar el proyecto
            con el cliente.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Agenda del Kickoff Interno</h3>

          {[
            {
              n: '1', t: 'Revisión del Cliente', time: '15 min',
              items: ['Industria y contexto de negocio', 'Objetivos de la migración', 'Stakeholders clave identificados'],
            },
            {
              n: '2', t: 'Alcance del Assessment', time: '20 min',
              items: [
                'Entornos a evaluar (producción, desarrollo, QA)',
                'Número estimado de servidores y aplicaciones',
                'Exclusiones y limitaciones',
                'Timeline y milestones clave',
                'Presupuesto y recursos asignados',
              ],
            },
            {
              n: '3', t: 'Asignación de Roles', time: '15 min',
              items: [
                'Lead Consultant: Responsable general del proyecto',
                'Technical Consultants: Ejecución técnica del assessment',
                'Especialista en herramientas de colecta',
                'Especialista en análisis de datos y business case',
                'Especialista en arquitectura AWS',
              ],
            },
            {
              n: '4', t: 'Herramientas y Metodología', time: '20 min',
              items: [
                'Selección preliminar de herramienta de colecta',
                'Proceso de recolección de datos',
                'Templates y documentación a utilizar',
                'Herramientas de colaboración (SharePoint, Teams, etc.)',
                'Frecuencia de reuniones de seguimiento',
              ],
            },
            {
              n: '5', t: 'Próximos Pasos', time: '10 min',
              items: [
                'Preparación para kickoff con cliente',
                'Materiales a preparar',
                'Fecha del kickoff con cliente',
                'Asignación de tareas inmediatas',
                'Puntos de contacto con el cliente',
              ],
            },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-gray-800">{item.t}</p>
                  <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span>
                </div>
                <ul className="space-y-1">
                  {item.items.map((i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="text-fuchsia-400 mt-0.5">•</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist de Preparación</h3>
          <ul className="space-y-1.5">
            <CheckItem>Información del cliente recopilada y revisada</CheckItem>
            <CheckItem>Equipo completo asignado y disponible</CheckItem>
            <CheckItem>Roles y responsabilidades claramente definidos</CheckItem>
            <CheckItem>Herramientas y accesos configurados</CheckItem>
            <CheckItem>Templates y documentación preparados</CheckItem>
            <CheckItem>Agenda de kickoff con cliente preparada</CheckItem>
            <CheckItem>Presentación de kickoff revisada</CheckItem>
          </ul>
          <TipAlert>
            Documenta todas las decisiones tomadas durante el kickoff interno y compártelas con el equipo para
            referencia futura.
          </TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas y Recursos</h3>
          <ul className="space-y-2">
            {[
              '📄 Agenda de Kickoff Interno (Template)',
              '📄 Matriz RACI del Proyecto',
              '📄 Checklist de Preparación',
              '📄 Template de Acta de Reunión',
            ].map((item) => (
              <li key={item} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function KickoffExternoPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Kickoff Externo (con Cliente)</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El kickoff externo es la reunión oficial de inicio del proyecto con el cliente. Es el momento de establecer
            expectativas claras, alinear objetivos y construir una relación de confianza con todos los stakeholders.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Alinear expectativas, establecer canales de comunicación y obtener el compromiso
            del cliente para el éxito del proyecto.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Participantes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1.5">Del lado del Cliente</p>
              <ul className="space-y-1 text-xs text-gray-700">
                {['Executive Sponsor: Patrocinador ejecutivo', 'IT Leadership: CIO, Director de IT', 'Technical Team: Arquitectos, admins, DBAs', 'Security & Compliance', 'Business Stakeholders: Dueños de apps críticas'].map((i) => (
                  <li key={i} className="flex items-start gap-1"><span className="text-blue-400 mt-0.5">•</span>{i}</li>
                ))}
              </ul>
            </div>
            <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-lg">
              <p className="text-xs font-semibold text-fuchsia-800 mb-1.5">Del lado de SoftwareONE/AWS</p>
              <ul className="space-y-1 text-xs text-gray-700">
                {['Lead Consultant: Líder del proyecto', 'Technical Consultants: Equipo técnico', 'AWS Representative (opcional)', 'Account Manager: Gerente de cuenta'].map((i) => (
                  <li key={i} className="flex items-start gap-1"><span className="text-fuchsia-400 mt-0.5">•</span>{i}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Agenda del Kickoff Externo</h3>
          {[
            { n: '1', t: 'Bienvenida e Introducciones', time: '10 min', items: ['Presentación de todos los participantes', 'Roles y responsabilidades de cada uno', 'Establecimiento del tono colaborativo'] },
            { n: '2', t: 'Objetivos del Proyecto', time: '15 min', items: ['Revisión de los objetivos de negocio del cliente', 'Beneficios esperados de la migración a AWS', 'Métricas de éxito del proyecto', 'Alineación de expectativas'] },
            { n: '3', t: 'Alcance del Assessment', time: '20 min', items: ['Entornos a evaluar (producción, desarrollo, DR)', 'Aplicaciones y sistemas incluidos', 'Exclusiones explícitas', 'Limitaciones y supuestos'] },
            { n: '4', t: 'Metodología y Proceso', time: '20 min', items: ['Herramientas de colecta a utilizar', 'Proceso de instalación de agentes', 'Período de recolección de datos', 'Entregables esperados'] },
            { n: '5', t: 'Timeline y Milestones', time: '15 min', items: ['Cronograma detallado del proyecto', 'Hitos clave y fechas importantes', 'Dependencias críticas', 'Puntos de revisión con el cliente'] },
            { n: '6', t: 'Requerimientos del Cliente', time: '20 min', items: ['Accesos necesarios (credenciales, VPN, etc.)', 'Información a proporcionar', 'Recursos del cliente requeridos', 'Aprobaciones de seguridad necesarias', 'Ventanas de mantenimiento disponibles'] },
            { n: '7', t: 'Comunicación y Gobernanza', time: '15 min', items: ['Canales de comunicación (email, Teams, Slack)', 'Frecuencia de reuniones de seguimiento', 'Proceso de escalamiento', 'Gestión de cambios'] },
            { n: '8', t: 'Riesgos y Mitigación', time: '10 min', items: ['Riesgos identificados', 'Estrategias de mitigación'] },
            { n: '9', t: 'Q&A y Próximos Pasos', time: '15 min', items: [] },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-800">{item.t}</p>
                  <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span>
                </div>
                {item.items.length > 0 && (
                  <ul className="space-y-0.5">
                    {item.items.map((i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-fuchsia-400 mt-0.5">•</span>{i}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Materiales a Preparar</h3>
          <ul className="space-y-1.5">
            <CheckItem>Presentación de kickoff (PowerPoint)</CheckItem>
            <CheckItem>Agenda detallada de la reunión</CheckItem>
            <CheckItem>Cronograma del proyecto (Gantt o timeline)</CheckItem>
            <CheckItem>Matriz RACI del proyecto</CheckItem>
            <CheckItem>Lista de requerimientos del cliente</CheckItem>
            <CheckItem>Formulario de solicitud de accesos</CheckItem>
            <CheckItem>Documentación de herramientas de colecta</CheckItem>
            <CheckItem>Acta de reunión (template)</CheckItem>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function SeleccionHerramientaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Selección de Herramienta de Colecta</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            La selección de la herramienta adecuada es crucial para el éxito del assessment. Esta decisión debe basarse
            en las características del entorno del cliente, sus restricciones y los objetivos del proyecto.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Seleccionar la herramienta más apropiada que permita recolectar datos precisos y
            completos del entorno del cliente.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Herramientas Disponibles</h3>
          <div className="space-y-3">
            {[
              {
                name: 'Cloudamize', color: 'border-blue-300 bg-blue-50',
                best: 'Entornos medianos a grandes con infraestructura moderna',
                items: ['Agente ligero y fácil de instalar', 'Análisis automático de rightsizing', 'Recomendaciones precisas de instancias AWS', 'Análisis de dependencias avanzado', 'Soporte para Windows, Linux y VMware'],
              },
              {
                name: 'Concierto', color: 'border-purple-300 bg-purple-50',
                best: 'Entornos complejos, multi-cloud o con restricciones de agentes',
                items: ['Modo agentless disponible', 'Soporte multi-cloud (AWS, Azure, GCP)', 'Análisis con machine learning', 'Mapeo de dependencias muy detallado', 'Ideal para entornos grandes y complejos'],
              },
              {
                name: 'Matilda', color: 'border-fuchsia-300 bg-fuchsia-50',
                best: 'Sistemas legacy y mainframes',
                items: ['Especializada en sistemas legacy', 'Soporte para AIX, AS/400, mainframes', 'Análisis de código legacy', 'Evaluación de modernización'],
              },
            ].map((tool) => (
              <div key={tool.name} className={`p-3 rounded-lg border ${tool.color}`}>
                <p className="font-semibold text-gray-800 text-sm">{tool.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">Mejor para: {tool.best}</p>
                <ul className="space-y-0.5">
                  {tool.items.map((i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <span className="text-fuchsia-400 mt-0.5">•</span>{i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Criterios de Selección</h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">1. Tamaño del Entorno</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Tamaño</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Número de Servidores</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Herramienta Recomendada</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white"><td className="border border-gray-200 px-3 py-2 text-gray-700">Pequeño</td><td className="border border-gray-200 px-3 py-2 text-gray-700">&lt; 100</td><td className="border border-gray-200 px-3 py-2 text-gray-700">Cualquiera</td></tr>
                  <tr className="bg-gray-50"><td className="border border-gray-200 px-3 py-2 text-gray-700">Mediano</td><td className="border border-gray-200 px-3 py-2 text-gray-700">100 – 500</td><td className="border border-gray-200 px-3 py-2 text-gray-700">Cloudamize o Concierto</td></tr>
                  <tr className="bg-white"><td className="border border-gray-200 px-3 py-2 text-gray-700">Grande</td><td className="border border-gray-200 px-3 py-2 text-gray-700">&gt; 500</td><td className="border border-gray-200 px-3 py-2 text-gray-700">Concierto</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">2. Restricciones del Cliente</h4>
            <ul className="space-y-1.5">
              <CheckItem><strong>No permite instalación de agentes:</strong> Concierto (agentless)</CheckItem>
              <CheckItem><strong>Restricciones de seguridad estrictas:</strong> Evaluar caso por caso</CheckItem>
              <CheckItem><strong>Sin conectividad a internet:</strong> Modo offline disponible</CheckItem>
              <CheckItem><strong>Entornos regulados:</strong> Verificar compliance de la herramienta</CheckItem>
              <CheckItem><strong>Sistemas legacy / mainframes:</strong> Matilda</CheckItem>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">3. Proceso de Selección</h4>
            {[
              { n: '1', t: 'Recopilar Información', items: ['Número total de servidores', 'Sistemas operativos utilizados', 'Plataformas de virtualización', 'Presencia de sistemas legacy', 'Restricciones de seguridad', 'Conectividad disponible'] },
              { n: '2', t: 'Evaluar Opciones', items: ['Comparar características de cada herramienta', 'Considerar experiencia previa del equipo', 'Evaluar costos y licenciamiento', 'Verificar disponibilidad de soporte'] },
              { n: '3', t: 'Validar con el Cliente', items: ['Presentar opciones al equipo de IT', 'Obtener aprobación de seguridad', 'Confirmar disponibilidad de recursos', 'Documentar decisión y justificación'] },
            ].map((step) => (
              <div key={step.n} className="flex gap-3 mb-3">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{step.t}</p>
                  <ul className="space-y-0.5">
                    {step.items.map((i) => <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><span className="text-fuchsia-400 mt-0.5">•</span>{i}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InstalacionAgentesPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Instalación de Agentes</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            La instalación de agentes es un paso crítico que debe ejecutarse con cuidado para asegurar la recolección
            exitosa de datos sin impactar las operaciones del cliente.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Instalar y configurar los agentes de colecta en todos los servidores objetivo
            de manera eficiente y segura.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Requisitos Previos</h3>
          <ul className="space-y-1.5">
            <CheckItem>Lista completa de servidores validada</CheckItem>
            <CheckItem>Credenciales de acceso verificadas</CheckItem>
            <CheckItem>Aprobaciones de seguridad obtenidas</CheckItem>
            <CheckItem>Ventana de mantenimiento coordinada</CheckItem>
            <CheckItem>Conectividad de red validada</CheckItem>
            <CheckItem>Reglas de firewall configuradas</CheckItem>
            <CheckItem>Instaladores descargados y verificados</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Métodos de Instalación</h3>
          <div className="space-y-3">
            {[
              { n: '1', t: 'Instalación Manual', when: 'Entornos pequeños (&lt;20 servidores) o servidores críticos', items: ['Conexión directa a cada servidor', 'Instalación paso a paso', 'Verificación inmediata', 'Mayor control del proceso'] },
              { n: '2', t: 'Instalación Masiva (Scripted)', when: 'Entornos medianos a grandes (&gt;20 servidores)', items: ['Scripts de PowerShell (Windows)', 'Scripts de Bash (Linux)', 'Ansible playbooks', 'Herramientas de gestión de configuración'] },
              { n: '3', t: 'Instalación Remota', when: 'Cuando no hay acceso directo a los servidores', items: ['PSExec para Windows', 'SSH para Linux', 'Herramientas de administración remota'] },
            ].map((m) => (
              <div key={m.n} className="p-3 rounded-lg bg-gray-50 border">
                <p className="font-semibold text-gray-800 text-sm">{m.n}. {m.t}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-2" dangerouslySetInnerHTML={{ __html: `Cuándo usar: ${m.when}` }} />
                <ul className="space-y-0.5">
                  {m.items.map((i) => <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><span className="text-fuchsia-400 mt-0.5">•</span>{i}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Proceso de Instalación</h3>
          {[
            { n: '1', t: 'Instalación Piloto', items: ['Seleccionar 2–3 servidores de prueba', 'Instalar agentes manualmente', 'Verificar conectividad y recolección', 'Validar impacto en performance', 'Documentar lecciones aprendidas'] },
            { n: '2', t: 'Instalación por Fases', items: ['Fase 1: Servidores no críticos (10–20%)', 'Fase 2: Servidores de desarrollo/QA (30–40%)', 'Fase 3: Servidores de producción no críticos (20–30%)', 'Fase 4: Servidores críticos de producción (10–20%)'] },
            { n: '3', t: 'Verificación Post-Instalación', items: ['Agente instalado correctamente', 'Servicio ejecutándose', 'Conectividad con el servidor de colecta', 'Datos comenzando a recolectarse', 'Sin impacto en performance', 'Logs sin errores'] },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">{step.t}</p>
                <ul className="space-y-1">
                  {step.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RecoleccionDatosPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Recolección de Datos</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El período de recolección de datos es fundamental para obtener información precisa y representativa del
            entorno del cliente.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Recolectar datos completos y precisos durante un período suficiente para capturar
            patrones de uso representativos.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Duración del Período de Recolección</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Escenario</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Mínima</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Recomendada</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2 text-gray-700">Entorno estándar</td><td className="p-2 text-gray-700">2 semanas</td><td className="p-2 text-gray-700">3–4 semanas</td></tr>
                <tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Cargas variables</td><td className="p-2 text-gray-700">3 semanas</td><td className="p-2 text-gray-700">4–6 semanas</td></tr>
                <tr className="border-t"><td className="p-2 text-gray-700">Patrones mensuales</td><td className="p-2 text-gray-700">4 semanas</td><td className="p-2 text-gray-700">6–8 semanas</td></tr>
                <tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Entorno complejo</td><td className="p-2 text-gray-700">4 semanas</td><td className="p-2 text-gray-700">8–12 semanas</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Datos Recolectados</h3>
          <div className="space-y-3">
            {[
              { title: 'Métricas de Infraestructura', items: ['CPU: Utilización, cores, velocidad', 'Memoria: Uso, capacidad, disponible', 'Disco: IOPS, throughput, capacidad, uso', 'Red: Ancho de banda, latencia, conexiones', 'Sistema Operativo: Versión, patches, configuración'] },
              { title: 'Información de Aplicaciones', items: ['Procesos en ejecución', 'Servicios instalados', 'Puertos en uso', 'Conexiones de red', 'Dependencias entre aplicaciones'] },
              { title: 'Datos de Performance', items: ['Patrones de uso por hora/día/semana', 'Picos de carga', 'Períodos de baja utilización', 'Tendencias de crecimiento'] },
            ].map((group) => (
              <div key={group.title} className="bg-gray-50 rounded-lg p-3 border">
                <p className="font-semibold text-gray-800 text-xs mb-2">{group.title}</p>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <span className="text-fuchsia-400 mt-0.5">•</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Monitoreo Durante la Recolección</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Actividades Diarias</p>
              <ul className="space-y-1.5">
                <CheckItem>Verificar que todos los agentes estén activos</CheckItem>
                <CheckItem>Revisar logs de errores</CheckItem>
                <CheckItem>Validar que los datos se estén recolectando</CheckItem>
                <CheckItem>Monitorear impacto en performance</CheckItem>
                <CheckItem>Documentar incidencias</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Actividades Semanales</p>
              <ul className="space-y-1.5">
                <CheckItem>Reunión de status con el cliente</CheckItem>
                <CheckItem>Revisión de calidad de datos</CheckItem>
                <CheckItem>Identificar servidores con datos incompletos</CheckItem>
                <CheckItem>Actualizar dashboard de progreso</CheckItem>
                <CheckItem>Reportar al equipo interno</CheckItem>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ValidacionAnalisisPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Validación y Análisis de Datos</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Una vez completado el período de recolección, es crucial validar la calidad de los datos y realizar un
            análisis exhaustivo para generar recomendaciones precisas.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Validar la integridad de los datos y analizar la información para generar
            recomendaciones de migración precisas.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Validación de Datos</h3>
          {[
            {
              n: '1', title: 'Validación de Completitud',
              items: ['Todos los servidores objetivo tienen datos', 'Período de recolección completo', 'Métricas clave capturadas (CPU, RAM, disco, red)', 'Información de aplicaciones disponible', 'Dependencias identificadas'],
            },
            {
              n: '2', title: 'Validación de Calidad',
              items: ['Consistencia: Datos coherentes sin anomalías inexplicables', 'Precisión: Métricas alineadas con expectativas del cliente', 'Representatividad: Datos capturan patrones de uso reales', 'Actualidad: Información refleja el estado actual'],
            },
            {
              n: '3', title: 'Validación con el Cliente',
              items: ['Revisar inventario de servidores', 'Confirmar aplicaciones identificadas', 'Validar dependencias críticas', 'Verificar patrones de uso', 'Identificar servidores faltantes o incorrectos'],
            },
          ].map((v) => (
            <div key={v.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{v.n}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1.5">{v.title}</p>
                <ul className="space-y-1.5">
                  {v.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Análisis de Datos</h3>
          {[
            { n: '1', title: 'Análisis de Utilización', items: ['CPU: Utilización promedio, picos, tendencias', 'Memoria: Uso promedio, máximo, disponible', 'Disco: Capacidad, IOPS, throughput', 'Red: Ancho de banda, latencia, conexiones'] },
            { n: '2', title: 'Análisis de Patrones', items: ['Patrones diarios (horarios pico)', 'Patrones semanales (días de mayor carga)', 'Patrones mensuales (ciclos de negocio)', 'Estacionalidad', 'Tendencias de crecimiento'] },
            { n: '3', title: 'Análisis de Dependencias', items: ['Mapeo de comunicación entre servidores', 'Identificación de aplicaciones monolíticas', 'Detección de servicios compartidos', 'Análisis de bases de datos y sus clientes', 'Identificación de puntos únicos de fallo'] },
            { n: '4', title: 'Rightsizing y Recomendaciones', items: ['Recomendaciones de instancias EC2', 'Opciones de almacenamiento (EBS, S3, EFS)', 'Configuraciones de red', 'Opciones de base de datos (RDS, Aurora, DynamoDB)', 'Oportunidades de optimización'] },
          ].map((a) => (
            <div key={a.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{a.n}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1.5">{a.title}</p>
                <ul className="space-y-1.5">
                  {a.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estrategias de Migración (7Rs)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Estrategia</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Descripción</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Cuándo Usar</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: 'Retire', d: 'Desactivar', w: 'Aplicaciones obsoletas o no utilizadas' },
                  { s: 'Retain', d: 'Mantener on-premises', w: 'Restricciones técnicas o de negocio' },
                  { s: 'Rehost', d: 'Lift & Shift', w: 'Migración rápida sin cambios' },
                  { s: 'Relocate', d: 'Mover a VMware en AWS', w: 'Entornos VMware existentes' },
                  { s: 'Repurchase', d: 'Cambiar a SaaS', w: 'Aplicaciones con equivalente SaaS' },
                  { s: 'Replatform', d: 'Lift, Tinker & Shift', w: 'Optimizaciones menores en la nube' },
                  { s: 'Refactor', d: 'Re-arquitecturar', w: 'Aprovechar capacidades nativas de nube' },
                ].map((row, i) => (
                  <tr key={row.s} className={`border-t ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="p-2 font-medium text-fuchsia-700">{row.s}</td>
                    <td className="p-2 text-gray-700">{row.d}</td>
                    <td className="p-2 text-gray-700">{row.w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessCasePage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Desarrollo del Business Case</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El Business Case es el documento fundamental que justifica la migración a AWS desde una perspectiva
            financiera y estratégica.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Crear un caso de negocio convincente que demuestre el valor de la migración a AWS
            y obtenga la aprobación de los stakeholders.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estructura del Business Case</h3>
          <div className="space-y-2">
            {[
              { n: '1', t: 'Resumen Ejecutivo', desc: 'Propuesta, beneficios clave, inversión requerida, ROI esperado y recomendación' },
              { n: '2', t: 'Análisis de Costos (TCO)', desc: 'Comparación costos on-premises vs AWS con proyección a 3–5 años' },
              { n: '3', t: 'Análisis de Beneficios', desc: 'Financieros, operacionales y estratégicos' },
              { n: '4', t: 'Plan de Migración', desc: 'Estrategia, fases, timeline y recursos requeridos' },
              { n: '5', t: 'Análisis de Riesgos', desc: 'Identificación de riesgos y estrategias de mitigación' },
            ].map((item) => (
              <div key={item.n} className="flex gap-3 p-2 bg-gray-50 rounded-lg border">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{item.n}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{item.t}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Costos On-Premises (Baseline)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Categoría</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Componentes</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Consideraciones</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Hardware', comp: 'Servidores, storage, red', con: 'Incluir depreciación y reemplazo' },
                  { cat: 'Software', comp: 'Licencias, soporte, actualizaciones', con: 'Costos anuales recurrentes' },
                  { cat: 'Datacenter', comp: 'Espacio, energía, refrigeración', con: 'Costos por rack o m²' },
                  { cat: 'Personal', comp: 'Salarios, beneficios, capacitación', con: 'FTEs dedicados a infraestructura' },
                  { cat: 'Mantenimiento', comp: 'Reparaciones, actualizaciones', con: 'Contratos de soporte' },
                  { cat: 'Seguridad', comp: 'Herramientas, auditorías', con: 'Compliance y certificaciones' },
                ].map((row, i) => (
                  <tr key={row.cat} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{row.cat}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.comp}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.con}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Costos en AWS (Proyección)</h3>
          <ul className="space-y-1.5">
            <CheckItem>Compute: EC2 (On-Demand, Reserved Instances, Savings Plans)</CheckItem>
            <CheckItem>Storage: EBS, S3, EFS, Glacier</CheckItem>
            <CheckItem>Database: RDS, Aurora, DynamoDB</CheckItem>
            <CheckItem>Networking: VPC, Direct Connect, transferencia de datos</CheckItem>
            <CheckItem>Servicios adicionales: Load Balancers, CloudWatch, Backup</CheckItem>
            <CheckItem>Soporte AWS: Business o Enterprise Support</CheckItem>
          </ul>
          <TipAlert>
            Utiliza AWS Pricing Calculator para generar estimaciones precisas basadas en las recomendaciones de rightsizing.
          </TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Análisis de Beneficios</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">Beneficios Financieros</p>
              <ul className="space-y-1.5">
                <CheckItem>Reducción de CapEx: Eliminación de inversiones en hardware</CheckItem>
                <CheckItem>Optimización de OpEx: Pago por uso real</CheckItem>
                <CheckItem>Rightsizing: Ajuste preciso de recursos</CheckItem>
                <CheckItem>Elasticidad: Escalado automático según demanda</CheckItem>
                <CheckItem>Reducción de personal: Menos FTEs en tareas operativas</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">Beneficios Operacionales</p>
              <ul className="space-y-1.5">
                <CheckItem>Agilidad: Provisión de recursos en minutos</CheckItem>
                <CheckItem>Disponibilidad: SLAs de 99.99% o superior</CheckItem>
                <CheckItem>Escalabilidad: Crecimiento sin límites físicos</CheckItem>
                <CheckItem>Automatización: Reducción de tareas manuales</CheckItem>
                <CheckItem>Innovación: Acceso a servicios avanzados (ML, IoT, Analytics)</CheckItem>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlanMigracionPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plan de Migración de Alto Nivel</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El Plan de Migración define cómo se ejecutará la migración a AWS, estableciendo prioridades, cronogramas,
            recursos y responsabilidades.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Crear un roadmap claro y ejecutable para la migración, minimizando riesgos y
            maximizando el valor del negocio.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Clasificación de Aplicaciones por Estrategia</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Aplicación</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Estrategia</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Prioridad</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Complejidad</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración Est.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { app: 'App Web Corporativa', strat: 'Rehost', pri: 'Alta', comp: 'Media', dur: '2–3 semanas', priColor: 'bg-green-100 text-green-700' },
                  { app: 'Base de Datos Legacy', strat: 'Replatform', pri: 'Alta', comp: 'Alta', dur: '4–6 semanas', priColor: 'bg-green-100 text-green-700' },
                  { app: 'Sistema de Reportes', strat: 'Retire', pri: 'Baja', comp: 'Baja', dur: '1 semana', priColor: 'bg-gray-100 text-gray-600' },
                  { app: 'ERP Crítico', strat: 'Retain', pri: 'N/A', comp: 'N/A', dur: 'Fase 2', priColor: 'bg-amber-100 text-amber-700' },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800 font-medium">{row.app}</td>
                    <td className="border border-gray-200 px-3 py-2 text-fuchsia-700 font-medium">{row.strat}</td>
                    <td className="border border-gray-200 px-3 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${row.priColor}`}>{row.pri}</span></td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.comp}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Priorización de Cargas de Trabajo</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Criterios de Priorización</p>
          <ul className="space-y-1.5">
            <CheckItem><strong>Valor de negocio:</strong> Impacto en objetivos estratégicos</CheckItem>
            <CheckItem><strong>Complejidad técnica:</strong> Facilidad de migración</CheckItem>
            <CheckItem><strong>Dependencias:</strong> Relaciones con otras aplicaciones</CheckItem>
            <CheckItem><strong>Riesgo:</strong> Criticidad y tolerancia a fallos</CheckItem>
            <CheckItem><strong>Quick wins:</strong> Oportunidades de éxito temprano</CheckItem>
            <CheckItem><strong>Costos:</strong> Potencial de ahorro inmediato</CheckItem>
          </ul>

          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Olas de Migración</p>
          <div className="space-y-2">
            {[
              { ola: 'Ola 1 (Piloto)', desc: 'Aplicaciones no críticas, baja complejidad', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { ola: 'Ola 2', desc: 'Aplicaciones de producción, complejidad media', color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800' },
              { ola: 'Ola 3', desc: 'Aplicaciones críticas, alta complejidad', color: 'bg-purple-50 border-purple-200 text-purple-800' },
              { ola: 'Ola 4+', desc: 'Modernización y optimización', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            ].map((o) => (
              <div key={o.ola} className={`flex gap-2 p-2 rounded-lg border ${o.color}`}>
                <span className="font-semibold text-xs">{o.ola}:</span>
                <span className="text-xs">{o.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Diseño de Landing Zone</h3>
          <ul className="space-y-1.5">
            <CheckItem>Estructura de cuentas AWS (multi-account strategy)</CheckItem>
            <CheckItem>Diseño de VPC y subnets</CheckItem>
            <CheckItem>Conectividad híbrida (Direct Connect, VPN)</CheckItem>
            <CheckItem>Seguridad y compliance (Security Groups, NACLs, WAF)</CheckItem>
            <CheckItem>Identidad y acceso (IAM, SSO)</CheckItem>
            <CheckItem>Monitoreo y logging (CloudWatch, CloudTrail)</CheckItem>
            <CheckItem>Backup y disaster recovery</CheckItem>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function PresentacionPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Presentación Ejecutiva Final</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            La Presentación Ejecutiva es el momento culminante del MAP Assessment, donde se presentan los hallazgos,
            recomendaciones y el plan de acción a los stakeholders clave y la dirección ejecutiva.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Comunicar de manera clara los resultados del assessment, obtener aprobación para
            proceder con la migración y alinear expectativas.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Audiencia Objetivo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['C-Level: CEO, CTO, CFO, CIO', 'Directores: IT, Operaciones, Finanzas, Seguridad', 'Gerentes: Infraestructura, Aplicaciones, Proyectos', 'Sponsors: Patrocinadores del proyecto', 'Partners: AWS, SoftwareONE'].map((item) => (
              <div key={item} className="p-2 bg-fuchsia-50 border border-fuchsia-100 rounded text-xs text-fuchsia-800">{item}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Preparación de la Presentación</h3>
          <ul className="space-y-1.5">
            <CheckItem>Validar hallazgos con stakeholders técnicos</CheckItem>
            <CheckItem>Revisar números financieros con CFO</CheckItem>
            <CheckItem>Preparar respuestas a preguntas anticipadas</CheckItem>
            <CheckItem>Ensayar la presentación (dry run)</CheckItem>
            <CheckItem>Preparar material de respaldo (anexos)</CheckItem>
            <CheckItem>Coordinar logística (sala, equipos, horarios)</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estructura de la Presentación</h3>
          <div className="space-y-3">
            {[
              { n: '1', t: 'Portada y Agenda', slides: '1 slide', items: ['Título del proyecto', 'Fecha y audiencia', 'Logos (SoftwareONE, AWS, Cliente)', 'Agenda de la sesión'] },
              { n: '2', t: 'Resumen Ejecutivo', slides: '2–3 slides', items: ['Contexto: Por qué se realizó el assessment', 'Alcance: Qué se evaluó', 'Hallazgos clave: Top 3–5 insights', 'Recomendación: Proceder con la migración', 'Valor esperado: ROI, ahorros, beneficios'] },
              { n: '3', t: 'Situación Actual', slides: '2–3 slides', items: ['Inventario de infraestructura', 'Utilización de recursos (CPU, RAM, disco)', 'Desafíos identificados', 'Oportunidades de mejora'] },
              { n: '4', t: 'Análisis de Costos', slides: '3–4 slides', items: ['TCO On-Premises: Desglose de costos actuales', 'TCO AWS: Proyección de costos en cloud', 'Comparación: Gráfico comparativo 3–5 años', 'Ahorros: % de reducción y valor absoluto', 'ROI: Período de recuperación y NPV'] },
              { n: '5', t: 'Estrategia de Migración', slides: '2–3 slides', items: ['Distribución 7Rs: Gráfico con % por estrategia', 'Priorización: Aplicaciones por ola de migración', 'Quick wins: Oportunidades de éxito temprano', 'Arquitectura objetivo: Diagrama de alto nivel'] },
              { n: '6', t: 'Plan de Migración', slides: '2–3 slides', items: ['Cronograma: Timeline con hitos clave', 'Fases: Preparación, Piloto, Olas 1–3, Optimización', 'Recursos: Equipo requerido y dedicación', 'Duración total: Tiempo estimado del proyecto'] },
              { n: '7', t: 'Beneficios Esperados', slides: '2 slides', items: ['Financieros: Ahorros, optimización de CapEx/OpEx', 'Operacionales: Agilidad, escalabilidad, disponibilidad', 'Estratégicos: Innovación, competitividad'] },
              { n: '8', t: 'Riesgos y Mitigación', slides: '1–2 slides', items: [] },
            ].map((item) => (
              <div key={item.n} className="flex gap-3">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{item.t}</p>
                    <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.slides}</span>
                  </div>
                  {item.items.length > 0 && (
                    <ul className="space-y-0.5">
                      {item.items.map((i) => <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><span className="text-fuchsia-400 mt-0.5">•</span>{i}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
          <TipAlert>
            Usa gráficos visuales (barras, líneas, tortas) para facilitar la comprensión de los números. Evita
            tablas con muchos datos en slides ejecutivos.
          </TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

export function WikiMapAssessment() {
  const [activePage, setActivePage] = useState<MapPage>('overview');

  const content: Record<MapPage, React.ReactNode> = {
    'overview': <OverviewPage />,
    'kickoff-interno': <KickoffInternoPage />,
    'kickoff-externo': <KickoffExternoPage />,
    'seleccion-herramienta': <SeleccionHerramientaPage />,
    'instalacion-agentes': <InstalacionAgentesPage />,
    'recoleccion-datos': <RecoleccionDatosPage />,
    'validacion-analisis': <ValidacionAnalisisPage />,
    'business-case': <BusinessCasePage />,
    'plan-migracion': <PlanMigracionPage />,
    'presentacion': <PresentacionPage />,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {subPages.map((p) => (
          <button
            key={p.value}
            onClick={() => setActivePage(p.value)}
            className={cn(
              'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              activePage === p.value
                ? 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300'
                : 'text-gray-600 border-transparent hover:bg-gray-100'
            )}
          >
            {activePage === p.value && <ChevronRight className="h-3 w-3" />}
            {p.label}
          </button>
        ))}
      </div>
      <div className="animate-fadeIn">{content[activePage]}</div>
    </div>
  );
}
