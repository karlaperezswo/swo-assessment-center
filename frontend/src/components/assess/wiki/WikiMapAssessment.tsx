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
          <h3 className="font-semibold text-gray-800">MAP Assessment</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            La fase de Assessment es el punto de partida fundamental del programa MAP. Durante esta etapa, se realiza un
            análisis exhaustivo del entorno actual del cliente para comprender su infraestructura, aplicaciones,
            dependencias y costos operativos.
          </p>
          <InfoAlert>
            <strong>Objetivo Principal:</strong> Proporcionar una visión clara del estado actual de la infraestructura
            y desarrollar un plan de migración estratégico basado en datos reales.
          </InfoAlert>
          <p className="text-sm text-gray-700">Entregables clave de esta fase:</p>
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
          <h3 className="font-semibold text-gray-800">Proceso de Assessment</h3>
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
                <CheckItem>Selección de herramienta de colecta</CheckItem>
                <CheckItem>Instalación y configuración de agentes</CheckItem>
                <CheckItem>Recolección de datos (mínimo 2 semanas)</CheckItem>
                <CheckItem>Validación de datos recolectados</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="3" title="Análisis y Evaluación" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Análisis de patrones de uso y performance</CheckItem>
                <CheckItem>Mapeo de dependencias</CheckItem>
                <CheckItem>Evaluación de estrategias de migración (7Rs)</CheckItem>
                <CheckItem>Cálculo de TCO</CheckItem>
              </ul>
            </div>
            <div><StepHeader number="4" title="Desarrollo del Business Case" />
              <ul className="space-y-1.5 ml-8">
                <CheckItem>Análisis comparativo de costos on-premises vs AWS</CheckItem>
                <CheckItem>Identificación de beneficios tangibles e intangibles</CheckItem>
                <CheckItem>Desarrollo del plan de migración</CheckItem>
              </ul>
            </div>
          </div>
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
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Agenda del Kickoff Interno</h3>
          <div className="space-y-2">
            {[
              { n: '1', t: 'Revisión del Cliente', time: '15 min' },
              { n: '2', t: 'Alcance del Assessment', time: '20 min' },
              { n: '3', t: 'Asignación de Roles', time: '15 min' },
              { n: '4', t: 'Herramientas y Metodología', time: '20 min' },
              { n: '5', t: 'Próximos Pasos', time: '10 min' },
            ].map((item) => (
              <div key={item.n} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{item.n}</span>
                <span className="text-sm text-gray-700 flex-1">{item.t}</span>
                <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span>
              </div>
            ))}
          </div>
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
          <h3 className="font-semibold text-gray-800">Agenda del Kickoff Externo</h3>
          <div className="space-y-2">
            {[
              { n: '1', t: 'Bienvenida e Introducciones', time: '10 min' },
              { n: '2', t: 'Objetivos del Proyecto', time: '15 min' },
              { n: '3', t: 'Alcance del Assessment', time: '20 min' },
              { n: '4', t: 'Metodología y Proceso', time: '20 min' },
              { n: '5', t: 'Timeline y Milestones', time: '15 min' },
              { n: '6', t: 'Requerimientos del Cliente', time: '20 min' },
              { n: '7', t: 'Comunicación y Gobernanza', time: '15 min' },
              { n: '8', t: 'Riesgos y Mitigación', time: '10 min' },
              { n: '9', t: 'Q&A y Próximos Pasos', time: '15 min' },
            ].map((item) => (
              <div key={item.n} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{item.n}</span>
                <span className="text-sm text-gray-700 flex-1">{item.t}</span>
                <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.time}</span>
              </div>
            ))}
          </div>
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
              { name: 'Cloudamize', desc: 'Mejor para: Entornos medianos a grandes con infraestructura moderna', color: 'border-blue-300 bg-blue-50' },
              { name: 'Concierto', desc: 'Mejor para: Entornos complejos, multi-cloud o con restricciones de agentes', color: 'border-purple-300 bg-purple-50' },
              { name: 'Matilda', desc: 'Mejor para: Sistemas legacy y mainframes', color: 'border-fuchsia-300 bg-fuchsia-50' },
            ].map((tool) => (
              <div key={tool.name} className={`p-3 rounded-lg border ${tool.color}`}>
                <p className="font-semibold text-gray-800 text-sm">{tool.name}</p>
                <p className="text-xs text-gray-600 mt-0.5">{tool.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Criterios de Selección por Tamaño</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800 rounded-tl-lg">Tamaño</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Nº de Servidores</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800 rounded-tr-lg">Herramienta Recomendada</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2 text-gray-700">Pequeño</td><td className="p-2 text-gray-700">&lt; 100</td><td className="p-2 text-gray-700">Cualquiera</td></tr>
                <tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Mediano</td><td className="p-2 text-gray-700">100 – 500</td><td className="p-2 text-gray-700">Cloudamize o Concierto</td></tr>
                <tr className="border-t"><td className="p-2 text-gray-700">Grande</td><td className="p-2 text-gray-700">&gt; 500</td><td className="p-2 text-gray-700">Concierto</td></tr>
              </tbody>
            </table>
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
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="font-semibold text-gray-800 text-sm">1. Instalación Manual</p>
              <p className="text-xs text-gray-600 mt-0.5">Cuándo usar: Entornos pequeños (&lt;20 servidores) o servidores críticos</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="font-semibold text-gray-800 text-sm">2. Instalación Masiva (Scripted)</p>
              <p className="text-xs text-gray-600 mt-0.5">Cuándo usar: Entornos medianos a grandes (&gt;20 servidores)</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="font-semibold text-gray-800 text-sm">3. Instalación Remota</p>
              <p className="text-xs text-gray-600 mt-0.5">Cuándo usar: Cuando no hay acceso directo a los servidores</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Verificación Post-Instalación</h3>
          <ul className="space-y-1.5">
            <CheckItem>Agente instalado correctamente</CheckItem>
            <CheckItem>Servicio ejecutándose en todos los servidores</CheckItem>
            <CheckItem>Datos fluyendo hacia la plataforma de colecta</CheckItem>
            <CheckItem>Sin alertas de errores en la consola</CheckItem>
          </ul>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { title: 'Métricas de Infraestructura', items: ['CPU, RAM, disco, red', 'Configuración de VMs', 'Sistemas operativos', 'Versiones de software'] },
              { title: 'Información de Aplicaciones', items: ['Procesos en ejecución', 'Puertos y servicios', 'Dependencias externas', 'Usuarios concurrentes'] },
              { title: 'Datos de Performance', items: ['Picos de uso', 'Patrones horarios', 'Latencia de red', 'IOPS de almacenamiento'] },
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
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Validación de Datos</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-1.5">1. Validación de Completitud</p>
              <ul className="space-y-1.5 ml-2">
                <CheckItem>Todos los servidores objetivo tienen datos</CheckItem>
                <CheckItem>Período de recolección completo</CheckItem>
                <CheckItem>Métricas clave capturadas (CPU, RAM, disco, red)</CheckItem>
                <CheckItem>Información de aplicaciones disponible</CheckItem>
                <CheckItem>Dependencias identificadas</CheckItem>
              </ul>
            </div>
          </div>
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
          <h3 className="font-semibold text-gray-800">Costos On-Premises (Baseline)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Categoría</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Componentes</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Consideraciones</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { cat: 'Hardware', comp: 'Servidores, storage, red', con: 'Incluir depreciación y reemplazo' },
                  { cat: 'Software', comp: 'Licencias, soporte, actualizaciones', con: 'Costos anuales recurrentes' },
                  { cat: 'Datacenter', comp: 'Espacio, energía, refrigeración', con: 'Costos por rack o m²' },
                  { cat: 'Personal', comp: 'Salarios, beneficios, capacitación', con: 'FTEs dedicados a infraestructura' },
                  { cat: 'Mantenimiento', comp: 'Reparaciones, actualizaciones', con: 'Contratos de soporte' },
                ].map((row, i) => (
                  <tr key={row.cat} className={`border-t ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="p-2 font-medium text-gray-700">{row.cat}</td>
                    <td className="p-2 text-gray-600">{row.comp}</td>
                    <td className="p-2 text-gray-600">{row.con}</td>
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
          <h3 className="font-semibold text-gray-800">Ejemplo de Estrategia por Aplicación</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Aplicación</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Estrategia</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Prioridad</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2 text-gray-700">App Web Corporativa</td><td className="p-2 text-fuchsia-600 font-medium">Rehost</td><td className="p-2"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Alta</span></td><td className="p-2 text-gray-600">2–3 semanas</td></tr>
                <tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Base de Datos Legacy</td><td className="p-2 text-fuchsia-600 font-medium">Replatform</td><td className="p-2"><span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">Alta</span></td><td className="p-2 text-gray-600">4–6 semanas</td></tr>
                <tr className="border-t"><td className="p-2 text-gray-700">Sistema de Reportes</td><td className="p-2 text-gray-600 font-medium">Retire</td><td className="p-2"><span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">Baja</span></td><td className="p-2 text-gray-600">1 semana</td></tr>
              </tbody>
            </table>
          </div>
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
          <div className="space-y-2">
            {[
              { n: '1', t: 'Portada y Agenda', slides: '1 slide' },
              { n: '2', t: 'Resumen Ejecutivo', slides: '2–3 slides' },
              { n: '3', t: 'Situación Actual', slides: '2–3 slides' },
              { n: '4', t: 'Análisis de Costos', slides: '3–4 slides' },
              { n: '5', t: 'Estrategia de Migración', slides: '2–3 slides' },
              { n: '6', t: 'Plan de Migración', slides: '2–3 slides' },
              { n: '7', t: 'Beneficios Esperados', slides: '2 slides' },
              { n: '8', t: 'Riesgos y Mitigación', slides: '1–2 slides' },
            ].map((item) => (
              <div key={item.n} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">{item.n}</span>
                <span className="text-sm text-gray-700 flex-1">{item.t}</span>
                <span className="text-xs text-gray-500 bg-white border rounded px-2 py-0.5">{item.slides}</span>
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
