import { useState } from 'react';
import { Info, CheckCircle, ChevronRight, Lightbulb, AlertTriangle } from 'lucide-react';
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

function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
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

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-0.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
          <span className="text-fuchsia-400 mt-0.5">•</span>{i}
        </li>
      ))}
    </ul>
  );
}

// ─── OVERVIEW ────────────────────────────────────────────────────────────────
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
          <img src="/proceso-assessment.png" alt="Proceso de Assessment"
            className="w-full rounded-xl border border-gray-200 shadow-sm" />
          <h3 className="font-semibold text-gray-800">Proceso de Assessment</h3>
          <p className="text-sm text-gray-600">El proceso de Assessment se ejecuta siguiendo estos pasos estructurados:</p>
          <div className="space-y-4">
            {[
              { n: '1', t: 'Preparación Inicial', items: ['Revisión de objetivos del cliente', 'Identificación de stakeholders clave', 'Definición del alcance del assessment', 'Planificación de recursos y timeline'] },
              { n: '2', t: 'Descubrimiento de Infraestructura', items: ['Selección de herramienta de colecta (Cloudamize, Concierto o Matilda)', 'Instalación y configuración de agentes', 'Recolección de datos durante el período definido (mínimo 2 semanas)', 'Validación de datos recolectados'] },
              { n: '3', t: 'Análisis y Evaluación', items: ['Análisis de patrones de uso y performance', 'Mapeo de dependencias', 'Evaluación de estrategias de migración (7Rs)', 'Cálculo de TCO (Total Cost of Ownership)'] },
              { n: '4', t: 'Desarrollo del Business Case', items: ['Análisis comparativo de costos on-premises vs. AWS', 'Identificación de beneficios tangibles e intangibles', 'Proyección de ROI', 'Análisis de riesgos'] },
              { n: '5', t: 'Plan de Migración', items: ['Agrupación de aplicaciones en waves', 'Priorización basada en complejidad y valor de negocio', 'Definición de timeline y recursos necesarios', 'Identificación de quick wins'] },
            ].map((step) => (
              <div key={step.n}><StepHeader number={step.n} title={step.t} />
                <ul className="space-y-1.5 ml-8">{step.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul>
              </div>
            ))}
          </div>
          <TipAlert><strong>Duración Típica:</strong> Un MAP Assessment completo suele tomar entre 4 a 8 semanas, dependiendo del tamaño y complejidad del entorno.</TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist de Seguimiento (MAP Assessments)</h3>
          <p className="text-sm text-gray-600">Te recomendamos utilizar el siguiente checklist para asegurar que todos los componentes del assessment se completen correctamente:</p>
          <ul className="space-y-1.5">
            {['Kickoff interno realizado con el equipo', 'Kickoff con cliente completado', 'Herramienta de colecta seleccionada', 'Agentes instalados y recolectando datos', 'Cuestionario de infraestructura completado', 'Período de recolección completado (mínimo 2 semanas)', 'Datos validados y analizados', 'Diagrama de infraestructura creado', 'Business case desarrollado', 'Plan de migración documentado', 'Presentación ejecutiva preparada', 'Revisión final con stakeholders completada'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Kickoff Interno y Externo</h3>
          <p className="text-sm text-gray-700">El kickoff interno es una reunión crucial que debe realizarse antes de iniciar el engagement con el cliente. Su propósito es alinear al equipo de consultores sobre los objetivos, alcance y metodología del assessment.</p>
          <h4 className="text-sm font-semibold text-gray-700">Agenda del Kickoff Interno</h4>
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
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800">{item.t}</p><span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span></div>
                <BulletList items={item.items} />
              </div>
            </div>
          ))}
          <TipAlert>Documenta todas las decisiones tomadas durante el kickoff interno y compártelas con el equipo para referencia futura.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KICKOFF INTERNO ─────────────────────────────────────────────────────────
function KickoffInternoPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Kickoff Interno</h3>
          <p className="text-sm text-gray-700 leading-relaxed">El kickoff interno es una reunión crucial que debe realizarse antes de iniciar el engagement con el cliente. Su propósito es alinear al equipo de consultores sobre los objetivos, alcance y metodología del assessment.</p>
          <InfoAlert><strong>Objetivo:</strong> Asegurar que todo el equipo esté alineado y preparado antes de iniciar el proyecto con el cliente.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Agenda del Kickoff Interno</h3>
          {[
            { n: '1', t: 'Revisión del Cliente', time: '15 min', items: ['Información general del cliente', 'Industria y contexto de negocio', 'Objetivos de la migración', 'Stakeholders clave identificados'] },
            { n: '2', t: 'Alcance del Assessment', time: '20 min', items: ['Entornos a evaluar (producción, desarrollo, QA)', 'Número estimado de servidores y aplicaciones', 'Exclusiones y limitaciones', 'Timeline y milestones clave', 'Presupuesto y recursos asignados'] },
            { n: '3', t: 'Asignación de Roles', time: '15 min', items: ['Lead Consultant: Responsable general del proyecto', 'Technical Consultants: Ejecución técnica del assessment', 'Especialista en herramientas de colecta', 'Especialista en análisis de datos', 'Especialista en business case', 'Especialista en arquitectura AWS'] },
            { n: '4', t: 'Herramientas y Metodología', time: '20 min', items: ['Selección preliminar de herramienta de colecta', 'Proceso de recolección de datos', 'Templates y documentación a utilizar', 'Herramientas de colaboración (SharePoint, Teams, etc.)', 'Frecuencia de reuniones de seguimiento'] },
            { n: '5', t: 'Próximos Pasos', time: '10 min', items: ['Preparación para kickoff con cliente', 'Materiales a preparar', 'Fecha del kickoff con cliente', 'Asignación de tareas inmediatas', 'Puntos de contacto con el cliente'] },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800">{item.t}</p><span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span></div>
                <BulletList items={item.items} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist de Preparación</h3>
          <ul className="space-y-1.5">
            {['Información del cliente recopilada y revisada', 'Equipo completo asignado y disponible', 'Roles y responsabilidades claramente definidos', 'Herramientas y accesos configurados', 'Templates y documentación preparados', 'Agenda de kickoff con cliente preparada', 'Presentación de kickoff revisada'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <TipAlert>Documenta todas las decisiones tomadas durante el kickoff interno y compártelas con el equipo para referencia futura.</TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas y Recursos</h3>
          <ul className="space-y-2">
            {['📄 Agenda de Kickoff Interno (Template)', '📄 Matriz RACI del Proyecto', '📄 Checklist de Preparación', '📄 Template de Acta de Reunión'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── KICKOFF EXTERNO ─────────────────────────────────────────────────────────
function KickoffExternoPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Kickoff Externo (con Cliente)</h3>
          <p className="text-sm text-gray-700 leading-relaxed">El kickoff externo es la reunión oficial de inicio del proyecto con el cliente. Es el momento de establecer expectativas claras, alinear objetivos y construir una relación de confianza con todos los stakeholders.</p>
          <InfoAlert><strong>Objetivo:</strong> Alinear expectativas, establecer canales de comunicación y obtener el compromiso del cliente para el éxito del proyecto.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Participantes Clave</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
              <p className="text-xs font-semibold text-blue-800 mb-1.5">Del lado del Cliente</p>
              <BulletList items={['Executive Sponsor: Patrocinador ejecutivo del proyecto', 'IT Leadership: CIO, Director de IT, Gerente de Infraestructura', 'Technical Team: Arquitectos, administradores de sistemas, DBAs', 'Security & Compliance: Responsables de seguridad y cumplimiento', 'Business Stakeholders: Dueños de aplicaciones críticas']} />
            </div>
            <div className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-lg">
              <p className="text-xs font-semibold text-fuchsia-800 mb-1.5">Del lado de SoftwareONE/AWS</p>
              <BulletList items={['Lead Consultant: Líder del proyecto', 'Technical Consultants: Equipo técnico', 'AWS Representative: Representante de AWS (opcional)', 'Account Manager: Gerente de cuenta']} />
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
            { n: '7', t: 'Comunicación y Gobernanza', time: '15 min', items: ['Canales de comunicación (email, Teams, Slack)', 'Frecuencia de reuniones de seguimiento', 'Proceso de escalamiento', 'Puntos de contacto principales', 'Gestión de cambios'] },
            { n: '8', t: 'Riesgos y Mitigación', time: '10 min', items: ['Riesgos identificados', 'Estrategias de mitigación', 'Plan de contingencia'] },
            { n: '9', t: 'Q&A y Próximos Pasos', time: '15 min', items: ['Preguntas y respuestas', 'Aclaraciones necesarias', 'Acciones inmediatas', 'Fecha de próxima reunión'] },
          ].map((item) => (
            <div key={item.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800">{item.t}</p><span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span></div>
                <BulletList items={item.items} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Materiales a Preparar</h3>
          <ul className="space-y-1.5">
            {['Presentación de kickoff (PowerPoint)', 'Agenda detallada de la reunión', 'Cronograma del proyecto (Gantt o timeline)', 'Matriz RACI del proyecto', 'Lista de requerimientos del cliente', 'Formulario de solicitud de accesos', 'Documentación de herramientas de colecta', 'Acta de reunión (template)'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Llegar preparado:</strong> Conoce al cliente, su industria y sus desafíos</CheckItem>
            <CheckItem><strong>Escuchar activamente:</strong> Presta atención a las preocupaciones del cliente</CheckItem>
            <CheckItem><strong>Ser transparente:</strong> Comunica claramente qué se puede y qué no se puede hacer</CheckItem>
            <CheckItem><strong>Establecer confianza:</strong> Demuestra experiencia y profesionalismo</CheckItem>
            <CheckItem><strong>Documentar todo:</strong> Toma notas detalladas y comparte el acta de reunión</CheckItem>
            <CheckItem><strong>Confirmar compromisos:</strong> Asegúrate de que todos entiendan sus responsabilidades</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist Post-Kickoff</h3>
          <ul className="space-y-1.5">
            {['Acta de reunión enviada a todos los participantes', 'Acciones asignadas con responsables y fechas', 'Solicitudes de acceso enviadas', 'Próxima reunión agendada', 'Canales de comunicación establecidos', 'Documentación compartida con el cliente'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas y Recursos</h3>
          <ul className="space-y-2">
            {['📊 Presentación de Kickoff Externo (PowerPoint)', '📄 Agenda de Kickoff (Template)', '📄 Acta de Reunión (Template)', '📄 Formulario de Solicitud de Accesos', '📄 Checklist de Requerimientos del Cliente'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
          <WarnAlert><strong>Importante:</strong> El kickoff externo marca el tono de toda la relación con el cliente. Una buena primera impresión es crucial para el éxito del proyecto.</WarnAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── SELECCIÓN DE HERRAMIENTA ─────────────────────────────────────────────────
function SeleccionHerramientaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Selección de Herramienta de Colecta</h3>
          <p className="text-sm text-gray-700 leading-relaxed">La selección de la herramienta adecuada es crucial para el éxito del assessment. Esta decisión debe basarse en las características del entorno del cliente, sus restricciones y los objetivos del proyecto.</p>
          <InfoAlert><strong>Objetivo:</strong> Seleccionar la herramienta más apropiada que permita recolectar datos precisos y completos del entorno del cliente.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Herramientas Disponibles</h3>
          {[
            { n: '1', name: 'Cloudamize', best: 'Entornos medianos a grandes con infraestructura moderna', color: 'border-blue-200 bg-blue-50 text-blue-800', items: ['Agente ligero y fácil de instalar', 'Análisis automático de rightsizing', 'Recomendaciones precisas de instancias AWS', 'Análisis de dependencias avanzado', 'Soporte para Windows, Linux y VMware'] },
            { n: '2', name: 'Concierto', best: 'Entornos complejos, multi-cloud o con restricciones de agentes', color: 'border-purple-200 bg-purple-50 text-purple-800', items: ['Modo agentless disponible', 'Soporte multi-cloud (AWS, Azure, GCP)', 'Análisis con machine learning', 'Mapeo de dependencias muy detallado', 'Ideal para entornos grandes y complejos'] },
            { n: '3', name: 'Matilda', best: 'Sistemas legacy y mainframes', color: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800', items: ['Especializada en sistemas legacy', 'Soporte para AIX, AS/400, mainframes', 'Análisis de código legacy', 'Evaluación de modernización'] },
          ].map((t) => (
            <div key={t.n} className={`p-3 rounded-lg border ${t.color}`}>
              <p className="font-semibold text-sm">{t.n}. {t.name}</p>
              <p className="text-xs opacity-75 mt-0.5 mb-2">Mejor para: {t.best}</p>
              <BulletList items={t.items} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Criterios de Selección</h3>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">1. Tamaño del Entorno</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Tamaño</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Número de Servidores</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Herramienta Recomendada</th>
                </tr></thead>
                <tbody>
                  {[['Pequeño', '< 100', 'Cualquiera'], ['Mediano', '100 - 500', 'Cloudamize o Concierto'], ['Grande', '> 500', 'Concierto']].map(([t, n, h], i) => (
                    <tr key={t} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-3 py-2 text-gray-800">{t}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{n}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">2. Tipo de Infraestructura</p>
            <ul className="space-y-1.5">
              <CheckItem><strong>Infraestructura moderna (VMware, Hyper-V):</strong> Cloudamize</CheckItem>
              <CheckItem><strong>Multi-cloud o híbrida:</strong> Concierto</CheckItem>
              <CheckItem><strong>Sistemas legacy (AS/400, mainframes):</strong> Matilda</CheckItem>
              <CheckItem><strong>Mixta:</strong> Combinación de herramientas</CheckItem>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">3. Restricciones del Cliente</p>
            <ul className="space-y-1.5">
              <CheckItem><strong>No permite instalación de agentes:</strong> Concierto (agentless)</CheckItem>
              <CheckItem><strong>Restricciones de seguridad estrictas:</strong> Evaluar caso por caso</CheckItem>
              <CheckItem><strong>Sin conectividad a internet:</strong> Modo offline disponible</CheckItem>
              <CheckItem><strong>Entornos regulados:</strong> Verificar compliance de la herramienta</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Proceso de Selección</h3>
          {[
            { n: '1', t: 'Recopilar Información', items: ['Número total de servidores', 'Sistemas operativos utilizados', 'Plataformas de virtualización', 'Presencia de sistemas legacy', 'Restricciones de seguridad', 'Conectividad disponible'] },
            { n: '2', t: 'Evaluar Opciones', items: ['Comparar características de cada herramienta', 'Considerar experiencia previa del equipo', 'Evaluar costos y licenciamiento', 'Verificar disponibilidad de soporte'] },
            { n: '3', t: 'Validar con el Cliente', items: ['Presentar la herramienta recomendada', 'Explicar el proceso de instalación', 'Abordar preocupaciones de seguridad', 'Obtener aprobación formal'] },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
              <div><p className="text-sm font-semibold text-gray-800 mb-1">{step.t}</p><BulletList items={step.items} /></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Documentación Requerida</h3>
          <ul className="space-y-2">
            {['📄 Matriz de Comparación de Herramientas', '📄 Documento de Justificación de Selección', '📄 Análisis de Seguridad de la Herramienta', '📄 Plan de Instalación'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
          <WarnAlert><strong>Importante:</strong> La selección de herramienta debe documentarse y aprobarse por el cliente antes de proceder con la instalación.</WarnAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── INSTALACIÓN DE AGENTES ───────────────────────────────────────────────────
function InstalacionAgentesPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Instalación de Agentes</h3>
          <p className="text-sm text-gray-700 leading-relaxed">La instalación de agentes es un paso crítico que debe ejecutarse con cuidado para asegurar la recolección exitosa de datos sin impactar las operaciones del cliente.</p>
          <InfoAlert><strong>Objetivo:</strong> Instalar y configurar los agentes de colecta en todos los servidores objetivo de manera eficiente y segura.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Preparación Pre-Instalación</h3>
          <p className="text-sm font-semibold text-gray-700">Requisitos Previos</p>
          <ul className="space-y-1.5">
            {['Lista completa de servidores validada', 'Credenciales de acceso verificadas', 'Aprobaciones de seguridad obtenidas', 'Ventana de mantenimiento coordinada', 'Conectividad de red validada', 'Reglas de firewall configuradas', 'Instaladores descargados y verificados'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Métodos de Instalación</h3>
          {[
            { n: '1', t: 'Instalación Manual', when: 'Entornos pequeños (<20 servidores) o servidores críticos', items: ['Conexión directa a cada servidor', 'Instalación paso a paso', 'Verificación inmediata', 'Mayor control del proceso'] },
            { n: '2', t: 'Instalación Masiva (Scripted)', when: 'Entornos medianos a grandes (>20 servidores)', items: ['Scripts de PowerShell (Windows)', 'Scripts de Bash (Linux)', 'Ansible playbooks', 'Herramientas de gestión de configuración'] },
            { n: '3', t: 'Instalación Remota', when: 'Cuando no hay acceso directo a los servidores', items: ['PSExec para Windows', 'SSH para Linux', 'Herramientas de administración remota'] },
          ].map((m) => (
            <div key={m.n} className="p-3 rounded-lg bg-gray-50 border">
              <p className="font-semibold text-gray-800 text-sm">{m.n}. {m.t}</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-2">Cuándo usar: {m.when}</p>
              <BulletList items={m.items} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Proceso de Instalación</h3>
          {[
            { n: '1', t: 'Instalación Piloto', items: ['Seleccionar 2-3 servidores de prueba', 'Instalar agentes manualmente', 'Verificar conectividad y recolección', 'Validar impacto en performance', 'Documentar lecciones aprendidas'] },
            { n: '2', t: 'Instalación por Fases', items: ['Fase 1: Servidores no críticos (10-20%)', 'Fase 2: Servidores de desarrollo/QA (30-40%)', 'Fase 3: Servidores de producción no críticos (20-30%)', 'Fase 4: Servidores críticos de producción (10-20%)'] },
            { n: '3', t: 'Verificación Post-Instalación', items: ['Agente instalado correctamente', 'Servicio ejecutándose', 'Conectividad con el servidor de colecta', 'Datos comenzando a recolectarse', 'Sin impacto en performance', 'Logs sin errores'] },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{step.n}</span>
              <div><p className="text-sm font-semibold text-gray-800 mb-1">{step.t}</p><ul className="space-y-1.5">{step.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Troubleshooting Común</h3>
          {[
            { prob: 'Agente no se conecta', sols: ['Verificar reglas de firewall', 'Validar configuración de proxy', 'Revisar conectividad de red', 'Verificar URLs permitidas'] },
            { prob: 'Fallo en la instalación', sols: ['Verificar permisos de usuario', 'Validar espacio en disco', 'Revisar dependencias del sistema', 'Consultar logs de instalación'] },
            { prob: 'Alto consumo de recursos', sols: ['Ajustar frecuencia de recolección', 'Verificar configuración del agente', 'Revisar si hay múltiples instancias', 'Contactar soporte técnico'] },
          ].map((item) => (
            <div key={item.prob} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 mb-1">Problema: {item.prob}</p>
              <p className="text-xs text-gray-500 mb-1">Soluciones:</p>
              <BulletList items={item.sols} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Comunicación:</strong> Mantener al cliente informado del progreso</CheckItem>
            <CheckItem><strong>Documentación:</strong> Registrar cada instalación y su estado</CheckItem>
            <CheckItem><strong>Monitoreo:</strong> Verificar agentes diariamente</CheckItem>
            <CheckItem><strong>Backup:</strong> Tener plan de rollback si es necesario</CheckItem>
            <CheckItem><strong>Coordinación:</strong> Trabajar con el equipo del cliente</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas y Scripts</h3>
          <ul className="space-y-2">
            {['💻 Script de Instalación Masiva Windows', '💻 Script de Instalación Masiva Linux', '📄 Checklist de Instalación', '📄 Log de Instalaciones', '📄 Guía de Troubleshooting'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
          <TipAlert>Mantén un dashboard actualizado del estado de instalación de todos los agentes para facilitar el seguimiento.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── RECOLECCIÓN DE DATOS ─────────────────────────────────────────────────────
function RecoleccionDatosPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Recolección de Datos</h3>
          <p className="text-sm text-gray-700 leading-relaxed">El período de recolección de datos es fundamental para obtener información precisa y representativa del entorno del cliente. Durante esta fase, los agentes recopilan métricas de uso, performance y dependencias.</p>
          <InfoAlert><strong>Objetivo:</strong> Recolectar datos completos y precisos durante un período suficiente para capturar patrones de uso representativos.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Duración del Período de Recolección</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Escenario</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración Mínima</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración Recomendada</th>
              </tr></thead>
              <tbody>
                {[['Entorno estándar', '2 semanas', '3-4 semanas'], ['Cargas variables', '3 semanas', '4-6 semanas'], ['Patrones mensuales', '4 semanas', '6-8 semanas'], ['Entorno complejo', '4 semanas', '8-12 semanas']].map(([e, m, r], i) => (
                  <tr key={e} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800">{e}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{m}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Datos Recolectados</h3>
          {[
            { t: 'Métricas de Infraestructura', items: ['CPU: Utilización, cores, velocidad', 'Memoria: Uso, capacidad, disponible', 'Disco: IOPS, throughput, capacidad, uso', 'Red: Ancho de banda, latencia, conexiones', 'Sistema Operativo: Versión, patches, configuración'] },
            { t: 'Información de Aplicaciones', items: ['Procesos en ejecución', 'Servicios instalados', 'Puertos en uso', 'Conexiones de red', 'Dependencias entre aplicaciones'] },
            { t: 'Datos de Performance', items: ['Patrones de uso por hora/día/semana', 'Picos de carga', 'Períodos de baja utilización', 'Tendencias de crecimiento'] },
          ].map((group) => (
            <div key={group.t} className="bg-gray-50 rounded-lg p-3 border">
              <p className="font-semibold text-gray-800 text-xs mb-2">{group.t}</p>
              <BulletList items={group.items} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Monitoreo Durante la Recolección</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Actividades Diarias</p>
          <ul className="space-y-1.5">
            {['Verificar que todos los agentes estén activos', 'Revisar logs de errores', 'Validar que los datos se estén recolectando', 'Monitorear impacto en performance', 'Documentar incidencias'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <p className="text-sm font-semibold text-gray-700 mt-2 mb-1">Actividades Semanales</p>
          <ul className="space-y-1.5">
            {['Reunión de status con el cliente', 'Revisión de calidad de datos', 'Identificar servidores con datos incompletos', 'Actualizar dashboard de progreso', 'Reportar al equipo interno'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Problemas Comunes y Soluciones</h3>
          {[
            { prob: 'Agentes Desconectados', causas: ['Servidor reiniciado', 'Problemas de red', 'Servicio detenido', 'Cambios en firewall'], sol: 'Reiniciar agente, verificar conectividad, revisar logs' },
            { prob: 'Datos Incompletos', causas: ['Período de recolección insuficiente', 'Servidores apagados', 'Permisos insuficientes', 'Configuración incorrecta'], sol: 'Extender período, verificar permisos, ajustar configuración' },
            { prob: 'Datos Inconsistentes', causas: ['Mantenimientos durante recolección', 'Cambios en la infraestructura', 'Eventos excepcionales'], sol: 'Documentar eventos, considerar extender período' },
          ].map((item) => (
            <div key={item.prob} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-semibold text-red-700 mb-1">{item.prob}</p>
              <p className="text-xs text-gray-500 mb-1">Causas:</p>
              <BulletList items={item.causas} />
              <p className="text-xs text-green-700 mt-2"><strong>Solución:</strong> {item.sol}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Finalización del Período</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Criterios de Completitud</p>
          <ul className="space-y-1.5">
            {['Período mínimo cumplido (2+ semanas)', '95%+ de servidores con datos completos', 'Patrones de uso capturados', 'Dependencias identificadas', 'Datos validados por el cliente'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas y Herramientas</h3>
          <ul className="space-y-2">
            {['📊 Dashboard de Monitoreo de Recolección', '📄 Reporte Semanal de Status', '📄 Log de Incidencias', '📄 Checklist de Completitud'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
          <TipAlert>Un período de recolección más largo proporciona datos más precisos y reduce el riesgo de subestimar los requisitos de recursos.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── VALIDACIÓN Y ANÁLISIS ────────────────────────────────────────────────────
function ValidacionAnalisisPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Validación y Análisis de Datos</h3>
          <p className="text-sm text-gray-700 leading-relaxed">Una vez completado el período de recolección, es crucial validar la calidad de los datos y realizar un análisis exhaustivo para generar recomendaciones precisas.</p>
          <InfoAlert><strong>Objetivo:</strong> Validar la integridad de los datos recolectados y analizar la información para generar recomendaciones de migración precisas.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Validación de Datos</h3>
          {[
            { n: '1', t: 'Validación de Completitud', items: ['Todos los servidores objetivo tienen datos', 'Período de recolección completo', 'Métricas clave capturadas (CPU, RAM, disco, red)', 'Información de aplicaciones disponible', 'Dependencias identificadas'] },
            { n: '2', t: 'Validación de Calidad', items: ['Consistencia: Datos coherentes sin anomalías inexplicables', 'Precisión: Métricas alineadas con expectativas del cliente', 'Representatividad: Datos capturan patrones de uso reales', 'Actualidad: Información refleja el estado actual'] },
            { n: '3', t: 'Validación con el Cliente', items: ['Revisar inventario de servidores', 'Confirmar aplicaciones identificadas', 'Validar dependencias críticas', 'Verificar patrones de uso', 'Identificar servidores faltantes o incorrectos'] },
          ].map((v) => (
            <div key={v.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{v.n}</span>
              <div><p className="text-sm font-semibold text-gray-800 mb-1.5">{v.t}</p><ul className="space-y-1.5">{v.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Análisis de Datos</h3>
          {[
            { n: '1', t: 'Análisis de Utilización', items: ['CPU: Utilización promedio, picos, tendencias', 'Memoria: Uso promedio, máximo, disponible', 'Disco: Capacidad, IOPS, throughput', 'Red: Ancho de banda, latencia, conexiones'] },
            { n: '2', t: 'Análisis de Patrones', items: ['Patrones diarios (horarios pico)', 'Patrones semanales (días de mayor carga)', 'Patrones mensuales (ciclos de negocio)', 'Estacionalidad', 'Tendencias de crecimiento'] },
            { n: '3', t: 'Análisis de Dependencias', items: ['Mapeo de comunicación entre servidores', 'Identificación de aplicaciones monolíticas', 'Detección de servicios compartidos', 'Análisis de bases de datos y sus clientes', 'Identificación de puntos únicos de fallo'] },
            { n: '4', t: 'Rightsizing y Recomendaciones', items: ['Recomendaciones de instancias EC2', 'Opciones de almacenamiento (EBS, S3, EFS)', 'Configuraciones de red', 'Opciones de base de datos (RDS, Aurora, DynamoDB)', 'Oportunidades de optimización'] },
          ].map((a) => (
            <div key={a.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{a.n}</span>
              <div><p className="text-sm font-semibold text-gray-800 mb-1.5">{a.t}</p><ul className="space-y-1.5">{a.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estrategias de Migración (7Rs)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Estrategia</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Descripción</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Cuándo Usar</th>
              </tr></thead>
              <tbody>
                {[
                  ['Retire', 'Desactivar', 'Aplicaciones obsoletas o no utilizadas'],
                  ['Retain', 'Mantener on-premises', 'No listas para migrar o restricciones'],
                  ['Rehost', 'Lift & Shift', 'Migración rápida sin cambios'],
                  ['Relocate', 'Mover VMs', 'VMware Cloud on AWS'],
                  ['Repurchase', 'Cambiar a SaaS', 'Alternativas SaaS disponibles'],
                  ['Replatform', 'Optimizar ligeramente', 'Beneficios cloud con cambios mínimos'],
                  ['Refactor', 'Rediseñar', 'Modernización completa'],
                ].map(([s, d, w], i) => (
                  <tr key={s} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-fuchsia-700">{s}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{d}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{w}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Análisis de TCO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">Costos On-Premises</p>
              <BulletList items={['Hardware (servidores, storage, red)', 'Software (licencias, soporte)', 'Datacenter (espacio, energía, refrigeración)', 'Personal (salarios, capacitación)', 'Mantenimiento y actualizaciones']} />
            </div>
            <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-fuchsia-800 mb-2">Costos en AWS</p>
              <BulletList items={['Instancias EC2 (On-Demand, Reserved, Spot)', 'Almacenamiento (EBS, S3, EFS)', 'Transferencia de datos', 'Servicios adicionales (RDS, Load Balancers, etc.)', 'Soporte AWS']} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Identificación de Riesgos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-800 mb-2">Riesgos Técnicos</p>
              <BulletList items={['Aplicaciones con dependencias complejas', 'Sistemas legacy sin documentación', 'Licencias no compatibles con cloud', 'Requisitos de latencia estrictos', 'Integraciones con sistemas on-premises']} />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 mb-2">Riesgos de Negocio</p>
              <BulletList items={['Aplicaciones críticas sin redundancia', 'Ventanas de mantenimiento limitadas', 'Resistencia al cambio organizacional', 'Falta de skills en el equipo', 'Presupuesto insuficiente']} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Entregables de esta Fase</h3>
          <ul className="space-y-1.5">
            {['Reporte de validación de datos', 'Análisis de utilización de recursos', 'Mapa de dependencias', 'Recomendaciones de rightsizing', 'Clasificación por estrategia (7Rs)', 'Análisis de TCO preliminar', 'Identificación de riesgos'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <TipAlert>Involucra al cliente en la validación de datos para asegurar que las recomendaciones estén alineadas con su realidad operativa.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── BUSINESS CASE ────────────────────────────────────────────────────────────
function BusinessCasePage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Desarrollo del Business Case</h3>
          <p className="text-sm text-gray-700 leading-relaxed">El Business Case es el documento fundamental que justifica la migración a AWS desde una perspectiva financiera y estratégica. Debe presentar un análisis claro del retorno de inversión y los beneficios esperados.</p>
          <InfoAlert><strong>Objetivo:</strong> Crear un caso de negocio convincente que demuestre el valor de la migración a AWS y obtenga la aprobación de los stakeholders.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">1. Resumen Ejecutivo</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Situación actual:</strong> Estado de la infraestructura on-premises</CheckItem>
            <CheckItem><strong>Propuesta:</strong> Migración a AWS y alcance</CheckItem>
            <CheckItem><strong>Beneficios clave:</strong> Ahorros, agilidad, innovación</CheckItem>
            <CheckItem><strong>Inversión requerida:</strong> Costos de migración y operación</CheckItem>
            <CheckItem><strong>ROI esperado:</strong> Período de recuperación y beneficios a largo plazo</CheckItem>
            <CheckItem><strong>Recomendación:</strong> Próximos pasos</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">2. Análisis de Costos (TCO)</h3>
          <p className="text-sm font-semibold text-gray-700 mb-2">Costos On-Premises (Baseline)</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Categoría</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Componentes</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Consideraciones</th>
              </tr></thead>
              <tbody>
                {[
                  ['Hardware', 'Servidores, storage, red', 'Incluir depreciación y reemplazo'],
                  ['Software', 'Licencias, soporte, actualizaciones', 'Costos anuales recurrentes'],
                  ['Datacenter', 'Espacio, energía, refrigeración', 'Costos por rack o m²'],
                  ['Personal', 'Salarios, beneficios, capacitación', 'FTEs dedicados a infraestructura'],
                  ['Mantenimiento', 'Reparaciones, actualizaciones', 'Contratos de soporte'],
                  ['Seguridad', 'Herramientas, auditorías', 'Compliance y certificaciones'],
                ].map(([c, comp, con], i) => (
                  <tr key={c} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{c}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{comp}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{con}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Costos en AWS (Proyección)</p>
          <ul className="space-y-1.5">
            {['Compute: EC2 (On-Demand, Reserved Instances, Savings Plans)', 'Storage: EBS, S3, EFS, Glacier', 'Database: RDS, Aurora, DynamoDB', 'Networking: VPC, Direct Connect, transferencia de datos', 'Servicios adicionales: Load Balancers, CloudWatch, Backup', 'Soporte AWS: Business o Enterprise Support'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <TipAlert>Utiliza AWS Pricing Calculator para generar estimaciones precisas basadas en las recomendaciones de rightsizing.</TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">3. Análisis de Beneficios</h3>
          {[
            { t: 'Beneficios Financieros', items: ['Reducción de CapEx: Eliminación de inversiones en hardware', 'Optimización de OpEx: Pago por uso real', 'Rightsizing: Ajuste preciso de recursos', 'Elasticidad: Escalado automático según demanda', 'Reducción de personal: Menos FTEs en tareas operativas'] },
            { t: 'Beneficios Operacionales', items: ['Agilidad: Provisión de recursos en minutos', 'Disponibilidad: SLAs de 99.99% o superior', 'Escalabilidad: Crecimiento sin límites físicos', 'Automatización: Reducción de tareas manuales', 'Innovación: Acceso a servicios avanzados (ML, IoT, Analytics)'] },
            { t: 'Beneficios Estratégicos', items: ['Time-to-market: Lanzamiento más rápido de productos', 'Alcance global: Presencia en múltiples regiones', 'Seguridad: Infraestructura certificada y compliance', 'Sostenibilidad: Reducción de huella de carbono', 'Competitividad: Adopción de tecnologías modernas'] },
          ].map((group) => (
            <div key={group.t}><p className="text-sm font-semibold text-gray-700 mb-1.5">{group.t}</p><ul className="space-y-1.5 mb-3">{group.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul></div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">4. Análisis Financiero</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Métricas Clave</p>
          <ul className="space-y-1.5">
            <CheckItem><strong>ROI (Return on Investment):</strong> % de retorno sobre la inversión</CheckItem>
            <CheckItem><strong>Payback Period:</strong> Tiempo para recuperar la inversión</CheckItem>
            <CheckItem><strong>NPV (Net Present Value):</strong> Valor presente neto</CheckItem>
            <CheckItem><strong>TCO Savings:</strong> Ahorro total en 3-5 años</CheckItem>
            <CheckItem><strong>Break-even Point:</strong> Punto de equilibrio</CheckItem>
          </ul>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Proyección a 3-5 Años</p>
          <ul className="space-y-1.5">
            <CheckItem><strong>Año 1:</strong> Costos de migración y estabilización</CheckItem>
            <CheckItem><strong>Año 2:</strong> Optimización y reducción de costos</CheckItem>
            <CheckItem><strong>Año 3-5:</strong> Ahorros sostenidos y modernización</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">5. Análisis de Riesgos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Riesgo</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Impacto</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Probabilidad</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Mitigación</th>
              </tr></thead>
              <tbody>
                {[
                  ['Sobrecostos de migración', 'Alto', 'Media', 'Planning detallado, contingencia 15-20%'],
                  ['Downtime no planificado', 'Alto', 'Baja', 'Migración por fases, rollback plan'],
                  ['Resistencia al cambio', 'Medio', 'Alta', 'Change management, capacitación'],
                  ['Falta de skills', 'Medio', 'Media', 'Training, soporte de partners'],
                  ['Problemas de compliance', 'Alto', 'Baja', 'Auditoría previa, servicios certificados'],
                ].map(([r, imp, prob, mit], i) => (
                  <tr key={r} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800">{r}</td>
                    <td className="border border-gray-200 px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${imp === 'Alto' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{imp}</span></td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{prob}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{mit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">6. Opciones de Financiamiento</h3>
          <div className="space-y-3">
            <div className="bg-fuchsia-50 border border-fuchsia-100 rounded-lg p-3">
              <p className="text-sm font-semibold text-fuchsia-800 mb-1.5">MAP Funding</p>
              <BulletList items={['Assess Phase: Financiamiento para la evaluación', 'Mobilize Phase: Créditos para preparación', 'Migrate Phase: Créditos basados en consumo comprometido']} />
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
              <p className="text-sm font-semibold text-blue-800 mb-1.5">Modelos de Pago AWS</p>
              <BulletList items={['On-Demand: Pago por hora sin compromiso', 'Reserved Instances: Descuentos hasta 72% con compromiso 1-3 años', 'Savings Plans: Flexibilidad con descuentos hasta 72%', 'Spot Instances: Hasta 90% descuento para cargas tolerantes']} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estructura del Documento</h3>
          <ul className="space-y-1.5">
            {['Portada y tabla de contenidos', 'Resumen ejecutivo (1-2 páginas)', 'Situación actual y desafíos', 'Propuesta de migración y alcance', 'Análisis de costos (TCO)', 'Análisis de beneficios', 'Análisis financiero (ROI, NPV, Payback)', 'Análisis de riesgos y mitigación', 'Opciones de financiamiento', 'Recomendaciones y próximos pasos', 'Anexos (metodología, supuestos, detalles técnicos)'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Claridad:</strong> Lenguaje ejecutivo, evitar jerga técnica excesiva</CheckItem>
            <CheckItem><strong>Visualización:</strong> Gráficos y tablas para facilitar comprensión</CheckItem>
            <CheckItem><strong>Realismo:</strong> Supuestos conservadores y transparentes</CheckItem>
            <CheckItem><strong>Comparación:</strong> Escenarios múltiples (conservador, moderado, optimista)</CheckItem>
            <CheckItem><strong>Validación:</strong> Revisión con stakeholders financieros</CheckItem>
            <CheckItem><strong>Alineación:</strong> Conectar con objetivos estratégicos del negocio</CheckItem>
          </ul>
          <WarnAlert><strong>Importante:</strong> El Business Case debe ser revisado y aprobado por el CFO o responsable financiero antes de presentarlo a la dirección ejecutiva.</WarnAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Herramientas Recomendadas</h3>
          <ul className="space-y-2">
            {['AWS Pricing Calculator: Estimación de costos AWS', 'AWS TCO Calculator: Comparación on-premises vs AWS', 'Cloudamize / Concierto / Matilda: Datos de utilización y recomendaciones', 'Excel / Google Sheets: Modelos financieros personalizados', 'PowerPoint / Google Slides: Presentación ejecutiva'].map((i) => (
              <li key={i} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PLAN DE MIGRACIÓN ────────────────────────────────────────────────────────
function PlanMigracionPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plan de Migración de Alto Nivel</h3>
          <p className="text-sm text-gray-700 leading-relaxed">El Plan de Migración es un documento estratégico que define cómo se ejecutará la migración a AWS, estableciendo prioridades, cronogramas, recursos y responsabilidades.</p>
          <InfoAlert><strong>Objetivo:</strong> Crear un roadmap claro y ejecutable para la migración de cargas de trabajo a AWS, minimizando riesgos y maximizando el valor del negocio.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">1. Estrategia de Migración por Aplicación</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Aplicación</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Estrategia</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Prioridad</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Complejidad</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración Est.</th>
              </tr></thead>
              <tbody>
                {[
                  ['App Web Corporativa', 'Rehost', 'Alta', 'Media', '2-3 semanas', 'bg-green-100 text-green-700'],
                  ['Base de Datos Legacy', 'Replatform', 'Alta', 'Alta', '4-6 semanas', 'bg-green-100 text-green-700'],
                  ['Sistema de Reportes', 'Retire', 'Baja', 'Baja', '1 semana', 'bg-gray-100 text-gray-600'],
                  ['ERP Crítico', 'Retain', 'N/A', 'N/A', 'Fase 2', 'bg-amber-100 text-amber-700'],
                ].map(([app, strat, pri, comp, dur, priColor], i) => (
                  <tr key={app as string} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{app}</td>
                    <td className="border border-gray-200 px-3 py-2 text-fuchsia-700 font-medium">{strat}</td>
                    <td className="border border-gray-200 px-3 py-2"><span className={`px-1.5 py-0.5 rounded text-xs font-medium ${priColor}`}>{pri}</span></td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{comp}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{dur}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">2. Priorización de Cargas de Trabajo</h3>
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
          {[
            { ola: 'Ola 1 (Piloto)', desc: 'Aplicaciones no críticas, baja complejidad', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { ola: 'Ola 2', desc: 'Aplicaciones de producción, complejidad media', color: 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800' },
            { ola: 'Ola 3', desc: 'Aplicaciones críticas, alta complejidad', color: 'bg-purple-50 border-purple-200 text-purple-800' },
            { ola: 'Ola 4+', desc: 'Modernización y optimización', color: 'bg-amber-50 border-amber-200 text-amber-800' },
          ].map((o) => (
            <div key={o.ola} className={`flex gap-2 p-2 rounded-lg border text-xs ${o.color}`}>
              <span className="font-semibold">{o.ola}:</span><span>{o.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">3. Arquitectura Objetivo en AWS</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Diseño de Landing Zone</p>
          <ul className="space-y-1.5">
            {['Estructura de cuentas AWS (multi-account strategy)', 'Diseño de VPC y subnets', 'Conectividad híbrida (Direct Connect, VPN)', 'Seguridad y compliance (Security Groups, NACLs, WAF)', 'Identidad y acceso (IAM, SSO)', 'Monitoreo y logging (CloudWatch, CloudTrail)', 'Backup y disaster recovery'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Servicios AWS por Capa</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              ['Compute', 'EC2, ECS, EKS, Lambda'],
              ['Storage', 'EBS, S3, EFS, FSx'],
              ['Database', 'RDS, Aurora, DynamoDB, ElastiCache'],
              ['Networking', 'VPC, Route 53, CloudFront, ELB'],
              ['Security', 'IAM, KMS, Secrets Manager, GuardDuty'],
              ['Management', 'CloudFormation, Systems Manager, Config'],
            ].map(([layer, svcs]) => (
              <div key={layer as string} className="bg-gray-50 border rounded p-2 text-xs">
                <span className="font-semibold text-fuchsia-700">{layer}: </span>
                <span className="text-gray-700">{svcs}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">4. Cronograma de Migración</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Fase</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Duración</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Actividades Clave</th>
              </tr></thead>
              <tbody>
                {[
                  ['Preparación', '2-4 semanas', 'Landing Zone, conectividad, capacitación'],
                  ['Migración Piloto', '2-3 semanas', '1-2 aplicaciones no críticas'],
                  ['Ola 1', '4-6 semanas', 'Aplicaciones de baja complejidad'],
                  ['Ola 2', '6-8 semanas', 'Aplicaciones de producción'],
                  ['Ola 3', '8-12 semanas', 'Aplicaciones críticas'],
                  ['Optimización', 'Continuo', 'Rightsizing, modernización'],
                ].map(([f, d, a], i) => (
                  <tr key={f as string} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{f}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{d}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{a}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">5. Recursos y Responsabilidades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Rol</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Responsabilidades</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Dedicación</th>
              </tr></thead>
              <tbody>
                {[
                  ['Migration Lead', 'Coordinación general, stakeholder management', '100%'],
                  ['Cloud Architect', 'Diseño de arquitectura, best practices', '100%'],
                  ['Migration Engineers', 'Ejecución de migraciones, testing', '100%'],
                  ['Application Owners', 'Validación funcional, UAT', '25-50%'],
                  ['Security Specialist', 'Compliance, seguridad, auditorías', '50%'],
                  ['Network Engineer', 'Conectividad, DNS, routing', '50%'],
                ].map(([rol, resp, ded], i) => (
                  <tr key={rol as string} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{rol}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{resp}</td>
                    <td className="border border-gray-200 px-3 py-2 text-fuchsia-700 font-medium">{ded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">6. Estrategia de Cutover</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Opciones de Cutover</p>
          <ul className="space-y-1.5">
            <CheckItem><strong>Big Bang:</strong> Migración completa en una ventana</CheckItem>
            <CheckItem><strong>Phased:</strong> Migración por componentes o usuarios</CheckItem>
            <CheckItem><strong>Parallel Run:</strong> Operación simultánea on-prem y cloud</CheckItem>
            <CheckItem><strong>Blue/Green:</strong> Entorno paralelo con switch rápido</CheckItem>
          </ul>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Plan de Rollback</p>
          <ul className="space-y-1.5">
            {['Criterios de go/no-go definidos', 'Procedimiento de rollback documentado', 'Backups completos antes de cutover', 'Equipo de soporte disponible 24/7', 'Plan de comunicación a usuarios'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">7. Gestión de Riesgos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead><tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Riesgo</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Mitigación</th>
                <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Contingencia</th>
              </tr></thead>
              <tbody>
                {[
                  ['Downtime extendido', 'Testing exhaustivo, dry runs', 'Rollback inmediato'],
                  ['Pérdida de datos', 'Backups múltiples, validación', 'Restauración desde backup'],
                  ['Problemas de performance', 'Load testing, rightsizing', 'Escalado vertical/horizontal'],
                  ['Incompatibilidad de aplicaciones', 'Testing en ambiente de prueba', 'Ajustes de configuración'],
                ].map(([r, m, c], i) => (
                  <tr key={r as string} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800">{r}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{m}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">8. Criterios de Éxito</h3>
          <ul className="space-y-1.5">
            {['Todas las aplicaciones funcionando correctamente', 'Performance igual o superior a on-premises', 'Downtime dentro de ventanas aprobadas', 'Sin pérdida de datos', 'Usuarios satisfechos con la experiencia', 'Costos dentro del presupuesto', 'Compliance y seguridad validados'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Entregables del Plan de Migración</h3>
          <ul className="space-y-2">
            {['📄 Documento de Plan de Migración (20-40 páginas)', '📄 Inventario de aplicaciones con estrategia asignada', '📊 Cronograma detallado (Gantt chart)', '📐 Diagramas de arquitectura objetivo', '📄 Matriz RACI de responsabilidades', '📄 Plan de gestión de riesgos', '📄 Runbooks de migración por aplicación', '📄 Plan de comunicación'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Start small:</strong> Comenzar con aplicaciones simples para ganar experiencia</CheckItem>
            <CheckItem><strong>Automatización:</strong> Usar herramientas como AWS MGN, CloudEndure</CheckItem>
            <CheckItem><strong>Testing:</strong> Validar exhaustivamente en ambientes de prueba</CheckItem>
            <CheckItem><strong>Documentación:</strong> Mantener runbooks actualizados</CheckItem>
            <CheckItem><strong>Comunicación:</strong> Mantener informados a todos los stakeholders</CheckItem>
            <CheckItem><strong>Flexibilidad:</strong> Estar preparado para ajustar el plan según aprendizajes</CheckItem>
          </ul>
          <TipAlert>Realiza una migración piloto con una aplicación no crítica para validar el proceso y ajustar el plan antes de migrar aplicaciones de producción.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── PRESENTACIÓN EJECUTIVA ───────────────────────────────────────────────────
function PresentacionPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Presentación Ejecutiva Final</h3>
          <p className="text-sm text-gray-700 leading-relaxed">La Presentación Ejecutiva es el momento culminante del MAP Assessment, donde se presentan los hallazgos, recomendaciones y el plan de acción a los stakeholders clave y la dirección ejecutiva.</p>
          <InfoAlert><strong>Objetivo:</strong> Comunicar de manera clara y convincente los resultados del assessment, obtener aprobación para proceder con la migración y alinear expectativas.</InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Audiencia y Preparación</h3>
          <p className="text-sm font-semibold text-gray-700 mb-1">Stakeholders Clave</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['C-Level: CEO, CTO, CFO, CIO', 'Directores: IT, Operaciones, Finanzas, Seguridad', 'Gerentes: Infraestructura, Aplicaciones, Proyectos', 'Sponsors: Patrocinadores del proyecto', 'Partners: AWS, SoftwareONE'].map((i) => (
              <div key={i} className="p-2 bg-fuchsia-50 border border-fuchsia-100 rounded text-xs text-fuchsia-800">{i}</div>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-3 mb-1">Preparación de la Presentación</p>
          <ul className="space-y-1.5">
            {['Validar hallazgos con stakeholders técnicos', 'Revisar números financieros con CFO', 'Preparar respuestas a preguntas anticipadas', 'Ensayar la presentación (dry run)', 'Preparar material de respaldo (anexos)', 'Coordinar logística (sala, equipos, horarios)'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Estructura de la Presentación</h3>
          <div className="space-y-3">
            {[
              { n: '1', t: 'Portada y Agenda', slides: '1 slide', items: ['Título del proyecto', 'Fecha y audiencia', 'Logos (SoftwareONE, AWS, Cliente)', 'Agenda de la sesión'] },
              { n: '2', t: 'Resumen Ejecutivo', slides: '2-3 slides', items: ['Contexto: Por qué se realizó el assessment', 'Alcance: Qué se evaluó', 'Hallazgos clave: Top 3-5 insights', 'Recomendación: Proceder con la migración', 'Valor esperado: ROI, ahorros, beneficios'] },
              { n: '3', t: 'Situación Actual', slides: '2-3 slides', items: ['Inventario de infraestructura (servidores, storage, aplicaciones)', 'Utilización de recursos (gráficos de CPU, RAM, disco)', 'Desafíos identificados (costos, escalabilidad, agilidad)', 'Oportunidades de mejora'] },
              { n: '4', t: 'Análisis de Costos', slides: '3-4 slides', items: ['TCO On-Premises: Desglose de costos actuales', 'TCO AWS: Proyección de costos en cloud', 'Comparación: Gráfico comparativo 3-5 años', 'Ahorros: % de reducción y valor absoluto', 'ROI: Período de recuperación y NPV'] },
              { n: '5', t: 'Estrategia de Migración', slides: '2-3 slides', items: ['Distribución 7Rs: Gráfico de torta con % por estrategia', 'Priorización: Aplicaciones por ola de migración', 'Quick wins: Oportunidades de éxito temprano', 'Arquitectura objetivo: Diagrama de alto nivel'] },
              { n: '6', t: 'Plan de Migración', slides: '2-3 slides', items: ['Cronograma: Timeline con hitos clave', 'Fases: Preparación, Piloto, Olas 1-3, Optimización', 'Recursos: Equipo requerido y dedicación', 'Duración total: Tiempo estimado del proyecto'] },
              { n: '7', t: 'Beneficios Esperados', slides: '2 slides', items: ['Financieros: Ahorros, optimización de CapEx/OpEx', 'Operacionales: Agilidad, escalabilidad, disponibilidad', 'Estratégicos: Innovación, competitividad, alcance global', 'Técnicos: Modernización, automatización, seguridad'] },
              { n: '8', t: 'Riesgos y Mitigación', slides: '1-2 slides', items: ['Tabla de riesgos: Impacto, Probabilidad, Mitigación', 'Downtime no planificado → Migración por fases, rollback plan', 'Sobrecostos → Planning detallado, contingencia 15%', 'Resistencia al cambio → Change management, capacitación'] },
              { n: '9', t: 'Financiamiento MAP', slides: '1 slide', items: ['MAP Funding disponible: Créditos AWS', 'Requisitos: Compromiso de consumo', 'Beneficios: Reducción de costos de migración', 'Proceso: Pasos para aplicar'] },
              { n: '10', t: 'Próximos Pasos', slides: '1 slide', items: ['Firma de contrato de migración', 'Aplicación a MAP Funding', 'Kick-off de fase Mobilize', 'Inicio de construcción de Landing Zone'] },
              { n: '11', t: 'Q&A y Cierre', slides: '1 slide', items: ['Espacio para preguntas y respuestas', 'Información de contacto del equipo', 'Agradecimientos'] },
            ].map((item) => (
              <div key={item.n} className="flex gap-3">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{item.n}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1"><p className="text-sm font-semibold text-gray-800">{item.t}</p><span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.slides}</span></div>
                  <BulletList items={item.items} />
                </div>
              </div>
            ))}
          </div>
          <TipAlert>Usa gráficos visuales (barras, líneas, tortas) para facilitar la comprensión de los números. Evita tablas con muchos datos en slides ejecutivos.</TipAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas de Presentación</h3>
          {[
            { t: 'Diseño Visual', items: ['Simplicidad: Una idea por slide', 'Visualización: Más gráficos, menos texto', 'Consistencia: Plantilla corporativa uniforme', 'Colores: Paleta profesional (blanco, grises, azul AWS)', 'Fuentes: Tamaño legible (mínimo 18pt)', 'Logos: SoftwareONE y AWS en todas las slides'] },
            { t: 'Contenido', items: ['Lenguaje ejecutivo: Evitar jerga técnica excesiva', 'Storytelling: Narrativa coherente de principio a fin', 'Datos concretos: Números específicos, no generalidades', 'Foco en valor: Beneficios de negocio, no solo técnicos', 'Llamado a la acción: Decisión clara que se solicita'] },
            { t: 'Delivery', items: ['Duración: 30-45 minutos + 15 min Q&A', 'Ritmo: 2-3 minutos por slide', 'Interacción: Pausas para preguntas en secciones clave', 'Confianza: Conocer el material a profundidad', 'Flexibilidad: Adaptar según reacciones de la audiencia'] },
          ].map((group) => (
            <div key={group.t}><p className="text-sm font-semibold text-gray-700 mb-1.5">{group.t}</p><ul className="space-y-1.5 mb-3">{group.items.map((i) => <CheckItem key={i}>{i}</CheckItem>)}</ul></div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Preguntas Frecuentes Anticipadas</h3>
          {[
            { cat: 'Preguntas Técnicas', color: 'bg-blue-50 border-blue-100', questions: [
              { q: '¿Qué pasa con nuestras aplicaciones legacy?', a: 'Estrategia específica por aplicación (Rehost, Replatform, Retain)' },
              { q: '¿Cómo garantizamos la seguridad?', a: 'Certificaciones AWS, controles de seguridad, compliance' },
              { q: '¿Qué pasa si hay problemas?', a: 'Plan de rollback, soporte 24/7, SLAs' },
            ]},
            { cat: 'Preguntas Financieras', color: 'bg-green-50 border-green-100', questions: [
              { q: '¿Los números son realistas?', a: 'Basados en datos reales, supuestos conservadores, validados' },
              { q: '¿Qué pasa si los costos aumentan?', a: 'Monitoreo continuo, optimización, alertas de presupuesto' },
              { q: '¿Cuándo veremos ahorros?', a: 'Timeline específico, quick wins en primeros meses' },
            ]},
            { cat: 'Preguntas Organizacionales', color: 'bg-amber-50 border-amber-100', questions: [
              { q: '¿Cómo afecta a nuestro equipo?', a: 'Plan de capacitación, upskilling, nuevas oportunidades' },
              { q: '¿Cuánto tiempo tomará?', a: 'Cronograma detallado, hitos claros, flexibilidad' },
              { q: '¿Qué soporte tendremos?', a: 'SoftwareONE, AWS, documentación, comunidad' },
            ]},
          ].map((group) => (
            <div key={group.cat} className={`p-3 rounded-lg border ${group.color}`}>
              <p className="text-xs font-semibold text-gray-700 mb-2">{group.cat}</p>
              <div className="space-y-2">
                {group.questions.map((faq) => (
                  <div key={faq.q}>
                    <p className="text-xs font-medium text-gray-800">"{faq.q}"</p>
                    <p className="text-xs text-gray-600 mt-0.5">→ {faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Material de Apoyo</h3>
          <ul className="space-y-2">
            {['📊 Presentación ejecutiva (PowerPoint/PDF)', '📄 Documento de Business Case completo', '📄 Plan de Migración detallado', '📐 Anexos técnicos (inventario, arquitecturas)', '📄 FAQ document', '📄 Casos de éxito similares'].map((i) => (
              <li key={i} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{i}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Post-Presentación</h3>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">Seguimiento Inmediato</p>
            <ul className="space-y-1.5">
              {['Enviar presentación y materiales a todos los asistentes', 'Documentar preguntas y respuestas', 'Agendar reuniones de seguimiento si es necesario', 'Solicitar feedback formal'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">Obtención de Aprobación</p>
            <ul className="space-y-1.5">
              {['Aprobación ejecutiva documentada', 'Presupuesto aprobado', 'Recursos asignados', 'Cronograma acordado', 'Sponsor ejecutivo designado'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">Transición a Mobilize</p>
            <ul className="space-y-1.5">
              {['Kick-off de fase Mobilize', 'Aplicación a MAP Funding', 'Contratación de recursos adicionales si es necesario', 'Inicio de construcción de Landing Zone', 'Planning detallado de migración piloto'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
            </ul>
          </div>
          <WarnAlert><strong>Importante:</strong> La presentación ejecutiva es tu oportunidad de "vender" el proyecto. Prepárala con cuidado, practica múltiples veces y anticipa objeciones.</WarnAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Checklist Final de Presentación</h3>
          <ul className="space-y-1.5">
            {['Presentación revisada y aprobada internamente', 'Números validados con CFO/Finanzas', 'Hallazgos técnicos validados con CTO/IT', 'Dry run completado', 'Material de respaldo preparado', 'Logística confirmada (sala, equipos, asistentes)', 'Plan B en caso de problemas técnicos'].map((i) => <CheckItem key={i}>{i}</CheckItem>)}
          </ul>
          <TipAlert>Graba tu dry run y revísalo para identificar áreas de mejora en tu delivery y timing.</TipAlert>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────
export function WikiMapAssessment({ initialPage = 'overview' }: { initialPage?: MapPage }) {
  const [activePage, setActivePage] = useState<MapPage>(initialPage);

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
