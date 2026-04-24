import { useState } from 'react';
import { Info, CheckCircle, ChevronRight, Lightbulb, AlertTriangle, FileText, Video } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type HerramientaPage =
  | 'guia' | 'cloudamize' | 'concierto' | 'matilda'
  | 'aws-transform' | 'aws-transform-ova' | 'aws-transform-proceso' | 'aws-transform-mgn';

const subPages: { value: HerramientaPage; label: string }[] = [
  { value: 'guia', label: 'Guía de Selección' },
  { value: 'cloudamize', label: 'Cloudamize' },
  { value: 'concierto', label: 'Concierto' },
  { value: 'matilda', label: 'Matilda' },
  { value: 'aws-transform', label: 'AWS Transform' },
  { value: 'aws-transform-ova', label: '↳ Manual OVA' },
  { value: 'aws-transform-proceso', label: '↳ Proceso Transform' },
  { value: 'aws-transform-mgn', label: '↳ MGN Connector' },
];

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" /><div>{children}</div>
    </div>
  );
}
function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" /><div>{children}</div>
    </div>
  );
}
function DangerAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
      <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" /><div>{children}</div>
    </div>
  );
}
function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-gray-700">
      <CheckCircle className="h-4 w-4 text-fuchsia-500 flex-shrink-0 mt-0.5" /><span>{children}</span>
    </li>
  );
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-gray-800 mb-2">{children}</h3>;
}
function ResourceList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
          <FileText className="h-4 w-4 text-fuchsia-400 flex-shrink-0" />{item}
        </li>
      ))}
    </ul>
  );
}
function VideoList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map(item => (
        <li key={item} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700">
          <Video className="h-4 w-4 text-purple-400 flex-shrink-0" />{item}
        </li>
      ))}
    </ul>
  );
}
function RaciTable({ rows }: { rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-fuchsia-50">
            {['Actividad','Consultor Lead','Consultor Técnico','Cliente IT','Cliente Negocio'].map(h => (
              <th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-t ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
              {row.map((cell, j) => (
                <td key={j} className={`p-2 ${j === 0 ? 'text-gray-700' : 'text-center font-medium text-fuchsia-700'}`}>{cell}</td>
              ))}
            </tr>
          ))}
          <tr className="border-t bg-gray-50">
            <td colSpan={5} className="p-2 text-xs text-gray-500 italic">R=Responsable, A=Aprobador, C=Consultado, I=Informado</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
function TroubleshootingSection({ items }: { items: { problema: string; sintomas?: string; soluciones: string[] }[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-red-100 rounded-xl p-4 bg-red-50">
          <p className="font-semibold text-red-800 text-sm mb-1">{item.problema}</p>
          {item.sintomas && <p className="text-xs text-red-600 mb-2">Síntomas: {item.sintomas}</p>}
          <ul className="space-y-1">
            {item.soluciones.map((s, j) => (
              <li key={j} className="flex items-start gap-1.5 text-xs text-red-700">
                <span className="mt-0.5">•</span>{s}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
function ChecklistOutputs({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(item => <CheckItem key={item}>{item}</CheckItem>)}
    </ul>
  );
}

// ─── GUIA ────────────────────────────────────────────────────────────────────
function GuiaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <SectionTitle>Guía de Selección de Herramientas</SectionTitle>
          <p className="text-sm text-gray-700 leading-relaxed">SoftwareONE trabaja con tres herramientas principales, cada una con características específicas que las hacen más adecuadas para diferentes escenarios.</p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5">
          <SectionTitle>Comparativa de Herramientas</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-fuchsia-50">{['Característica','Cloudamize','Concierto','Matilda'].map(h=><th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>)}</tr></thead>
              <tbody>
                {[
                  ['Tipo de Instalación','Agente ligero','Agentless / Agente','Agente'],
                  ['Plataformas Soportadas','Windows, Linux, VMware','Multi-cloud, On-premises','Windows, Linux, AIX'],
                  ['Análisis de Dependencias','Sí (avanzado)','Sí (muy detallado)','Sí (básico)'],
                  ['Recomendaciones AWS','Automáticas','Automáticas + ML','Manuales'],
                  ['Complejidad de Setup','Media','Baja','Alta'],
                  ['Mejor Para','Entornos medianos-grandes','Entornos complejos','Entornos legacy'],
                ].map((row,i)=>(
                  <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}>
                    {row.map((cell,j)=><td key={j} className={`p-2 ${j===0?'font-medium text-gray-700':'text-gray-600'}`}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <SectionTitle>Criterios de Selección</SectionTitle>
          <p className="text-sm text-gray-600">Considera los siguientes factores al seleccionar la herramienta:</p>
          <div className="space-y-3">
            {[
              { n:'1', title:'Tamaño del Entorno', items:['Pequeño (<100 servidores): Cualquier herramienta','Mediano (100-500 servidores): Cloudamize o Concierto','Grande (>500 servidores): Concierto recomendado'] },
              { n:'2', title:'Complejidad de la Infraestructura', items:['Infraestructura moderna: Cloudamize','Multi-cloud o híbrida: Concierto','Sistemas legacy (AS/400, mainframes): Matilda'] },
              { n:'3', title:'Restricciones del Cliente', items:['No permite instalación de agentes: Concierto (modo agentless)','Restricciones de seguridad estrictas: Evaluar caso por caso','Conectividad limitada: Considerar colecta offline'] },
            ].map(c=>(
              <div key={c.n} className="border-l-4 border-fuchsia-300 bg-blue-50 rounded-r-xl p-3">
                <p className="font-semibold text-gray-800 text-sm mb-1.5">{c.n}. {c.title}</p>
                <ul className="space-y-1">{c.items.map(i=><li key={i} className="flex items-start gap-1.5 text-xs text-gray-700"><span className="text-fuchsia-400">•</span>{i}</li>)}</ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <SectionTitle>Troubleshooting General</SectionTitle>
          <TroubleshootingSection items={[
            { problema:'Cliente rechaza instalación de agentes', soluciones:['Opción 1: Utilizar Concierto en modo agentless','Opción 2: Proponer instalación en entorno de prueba primero','Opción 3: Demostrar que los agentes son read-only y no afectan performance','Opción 4: Ofrecer análisis de seguridad de los agentes'] },
            { problema:'Entorno sin conectividad a internet', soluciones:['Configurar colecta offline con exportación periódica de datos','Establecer un servidor proxy o jump server','Utilizar modo disconnected de la herramienta seleccionada'] },
            { problema:'Múltiples plataformas y sistemas legacy', soluciones:['Considerar uso de múltiples herramientas en paralelo','Matilda para sistemas legacy + Cloudamize/Concierto para infraestructura moderna','Consolidar datos en una única vista'] },
          ]} />
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <SectionTitle>Checklist de Inputs</SectionTitle>
          <p className="text-sm text-gray-600">Antes de iniciar la instalación de cualquier herramienta, asegúrate de tener:</p>
          <ul className="space-y-1.5">
            {['Lista completa de servidores a evaluar','Credenciales de acceso con permisos adecuados','Información de red (IPs, puertos, firewalls)','Aprobaciones de seguridad necesarias','Ventana de mantenimiento para instalación (si aplica)','Contacto técnico del cliente asignado','Documentación de la infraestructura existente','Licencias de la herramienta activadas'].map(i=><CheckItem key={i}>{i}</CheckItem>)}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── CLOUDAMIZE ───────────────────────────────────────────────────────────────
function CloudamizePage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Cloudamize</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Cloudamize es una plataforma de análisis y optimización de infraestructura que proporciona recomendaciones precisas para migración a AWS basadas en datos reales de uso y performance.</p>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-4">
        <SectionTitle>Prerrequisitos</SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
            <ul className="space-y-1.5"><CheckItem>Windows Server 2008 R2 y superior</CheckItem><CheckItem>Linux (RHEL, CentOS, Ubuntu, SUSE, Debian)</CheckItem><CheckItem>VMware vSphere 5.5 y superior</CheckItem></ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos del Sistema</p>
            <ul className="space-y-1.5"><CheckItem>CPU: Mínimo 1% de uso disponible</CheckItem><CheckItem>RAM: 50 MB disponibles</CheckItem><CheckItem>Disco: 100 MB de espacio libre</CheckItem></ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conectividad</p>
            <ul className="space-y-1.5"><CheckItem>Acceso HTTPS saliente al puerto 443</CheckItem><CheckItem>URL permitida: *.cloudamize.com</CheckItem><CheckItem>Ancho de banda: ~1 KB/s por servidor</CheckItem></ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Permisos Necesarios</p>
            <ul className="space-y-1.5"><CheckItem>Windows: Administrador local o permisos de lectura WMI</CheckItem><CheckItem>Linux: Usuario root o sudo para instalación</CheckItem><CheckItem>VMware: Rol de solo lectura en vCenter</CheckItem></ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Información Requerida del Cliente</p>
            <ul className="space-y-1.5"><CheckItem>Lista de servidores con IPs y nombres</CheckItem><CheckItem>Credenciales de acceso administrativo</CheckItem><CheckItem>Información de proxy (si aplica)</CheckItem><CheckItem>Aprobación de seguridad para instalación de agentes</CheckItem><CheckItem>Contacto técnico para soporte durante instalación</CheckItem></ul>
          </div>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Timeline del Proyecto</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-fuchsia-50">{['Fase','Duración','Actividades Principales'].map(h=><th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>)}</tr></thead>
            <tbody>
              {[['Semana 1','5 días','Setup inicial, instalación de agentes, validación de conectividad'],['Semanas 2-3','14 días','Período de recolección de datos, monitoreo de agentes'],['Semana 4','5 días','Análisis de datos, generación de reportes, validación'],['Semana 5','3 días','Preparación de presentación, revisión con cliente']].map((row,i)=>(
                <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}>{row.map((cell,j)=><td key={j} className="p-2 text-gray-700">{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Matriz RACI</SectionTitle>
        <RaciTable rows={[['Planificación del Assessment','R/A','C','C','I'],['Instalación de Agentes','A','R','C','I'],['Monitoreo de Recolección','A','R','I','I'],['Análisis de Datos','R/A','R','C','I'],['Generación de Reportes','R/A','C','I','I'],['Presentación de Resultados','R/A','C','C','A']]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Plantillas</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Plantilla de Inventario de Servidores','Checklist de Instalación de Agentes','Template de Reporte de Assessment','Plantilla de Business Case','Template de Plan de Migración']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Manuales</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Manual de Instalación de Agentes Windows','Manual de Instalación de Agentes Linux','Guía de Configuración de vCenter Connector','Manual de Usuario de la Plataforma Cloudamize','Guía de Interpretación de Reportes']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Troubleshooting</SectionTitle>
        <TroubleshootingSection items={[
          { problema:'Agente no se conecta a Cloudamize', sintomas:'El agente está instalado pero no aparece en el portal', soluciones:['Verificar conectividad: telnet cloudamize.com 443','Revisar configuración de proxy en el agente','Verificar que el firewall permita tráfico saliente HTTPS','Revisar logs en /var/log/cloudamize/ (Linux) o C:\\ProgramData\\Cloudamize\\logs\\ (Windows)','Reiniciar el servicio del agente'] },
          { problema:'Datos incompletos o inconsistentes', sintomas:'Faltan métricas o los datos no son coherentes', soluciones:['Verificar que el período de recolección sea de al menos 2 semanas','Confirmar que los agentes han estado activos todo el período','Revisar si hay servidores apagados o en mantenimiento','Validar permisos del agente para acceder a métricas del sistema'] },
          { problema:'Alto consumo de recursos por el agente', sintomas:'El agente consume más CPU/RAM de lo esperado', soluciones:['Ajustar la frecuencia de recolección de métricas','Verificar que no haya múltiples instancias del agente corriendo','Actualizar a la última versión del agente','Contactar soporte de Cloudamize para optimización'] },
        ]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Descargables</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Instalador de Agente Windows (64-bit)','Instalador de Agente Linux (script)','Script de Instalación Masiva','Herramienta de Diagnóstico de Conectividad','Dashboard de Monitoreo (Excel)']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Videos de Entrenamiento</CardTitle></CardHeader>
          <CardContent className="pt-0"><VideoList items={['Introducción a Cloudamize (15 min)','Instalación de Agentes - Paso a Paso (20 min)','Navegación del Portal Cloudamize (25 min)','Análisis de Reportes y Recomendaciones (30 min)','Troubleshooting Común (15 min)','Generación del Business Case (20 min)']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Checklist de Outputs</SectionTitle>
        <ChecklistOutputs items={['Inventario completo de servidores con métricas','Reporte de análisis de infraestructura actual','Mapa de dependencias entre aplicaciones','Recomendaciones de rightsizing para AWS','Análisis de TCO (on-premises vs AWS)','Business case con proyección de costos','Plan de migración con waves priorizadas','Identificación de estrategias de migración (7Rs)','Presentación ejecutiva para stakeholders','Documentación técnica detallada','Exportación de datos raw de Cloudamize','Reporte de riesgos y recomendaciones de mitigación']} />
      </CardContent></Card>
    </div>
  );
}

// ─── CONCIERTO ────────────────────────────────────────────────────────────────
function ConciertPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Concierto</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Concierto es una plataforma avanzada de análisis multi-cloud que utiliza machine learning para proporcionar recomendaciones inteligentes de migración y optimización. Es ideal para entornos complejos y heterogéneos.</p>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-4">
        <SectionTitle>Prerrequisitos</SectionTitle>
        <div className="space-y-3">
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
            <ul className="space-y-1.5"><CheckItem>Windows Server 2012 y superior</CheckItem><CheckItem>Linux (todas las distribuciones principales)</CheckItem><CheckItem>AIX, Solaris, HP-UX</CheckItem><CheckItem>VMware, Hyper-V, KVM</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modos de Operación</p>
            <ul className="space-y-1.5"><CheckItem>Agentless: Conexión remota vía SSH/WMI</CheckItem><CheckItem>Agent-based: Instalación de agente ligero</CheckItem><CheckItem>Hybrid: Combinación de ambos métodos</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos del Sistema (modo agente)</p>
            <ul className="space-y-1.5"><CheckItem>CPU: &lt;1% de uso</CheckItem><CheckItem>RAM: 30 MB disponibles</CheckItem><CheckItem>Disco: 50 MB de espacio libre</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conectividad</p>
            <ul className="space-y-1.5"><CheckItem>Modo agentless: SSH (puerto 22) o WMI (puerto 135, 445)</CheckItem><CheckItem>Modo agente: HTTPS saliente al puerto 443</CheckItem><CheckItem>URL permitida: *.concierto.cloud</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Permisos Necesarios</p>
            <ul className="space-y-1.5"><CheckItem>Windows: Administrador local o permisos WMI de lectura</CheckItem><CheckItem>Linux: Usuario con sudo o acceso root (solo lectura)</CheckItem><CheckItem>VMware: Rol de solo lectura en vCenter</CheckItem><CheckItem>Cloud Providers: Credenciales con permisos de lectura (ReadOnly)</CheckItem></ul></div>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Timeline del Proyecto</SectionTitle>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-fuchsia-50">{['Fase','Duración','Actividades Principales'].map(h=><th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>)}</tr></thead>
          <tbody>{[['Semana 1','5 días','Configuración de conectores, validación de accesos, inicio de discovery'],['Semanas 2-3','14 días','Recolección continua de métricas, análisis de dependencias'],['Semana 4','5 días','Análisis con ML, generación de recomendaciones, validación'],['Semana 5','3 días','Refinamiento de business case, preparación de presentación']].map((row,i)=>(
            <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}>{row.map((cell,j)=><td key={j} className="p-2 text-gray-700">{cell}</td>)}</tr>
          ))}</tbody>
        </table></div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Matriz RACI</SectionTitle>
        <RaciTable rows={[['Planificación del Assessment','R/A','C','C','I'],['Configuración de Conectores','A','R','C','I'],['Discovery y Recolección','A','R','I','I'],['Análisis de Datos','R/A','R','C','I'],['Generación de Reportes','R/A','C','I','I'],['Presentación de Resultados','R/A','C','C','A']]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Plantillas</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Plantilla de Inventario Multi-Cloud','Checklist de Configuración de Conectores','Template de Reporte de Assessment Concierto','Plantilla de Business Case Avanzado','Template de Roadmap de Migración']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Manuales</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Manual de Configuración Agentless','Guía de Instalación de Agentes','Manual de Conectores Cloud (AWS, Azure, GCP)','Guía de Usuario de la Plataforma Concierto','Manual de Análisis de Dependencias','Guía de Interpretación de Recomendaciones ML']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Troubleshooting</SectionTitle>
        <TroubleshootingSection items={[
          { problema:'Fallo en conexión agentless', sintomas:'No se puede establecer conexión SSH/WMI con los servidores', soluciones:['Verificar credenciales y permisos de usuario','Confirmar que los puertos necesarios estén abiertos en firewall','Validar que SSH/WMI esté habilitado en los servidores target','Probar conexión manual desde el servidor Concierto','Revisar logs de conexión en la plataforma'] },
          { problema:'Discovery incompleto', sintomas:'Faltan servidores o aplicaciones en el inventario', soluciones:['Verificar que todos los rangos de IP estén incluidos en el scan','Confirmar que las credenciales tengan acceso a todos los segmentos','Revisar si hay servidores en subredes aisladas','Ejecutar discovery manual para servidores faltantes'] },
          { problema:'Análisis de dependencias impreciso', sintomas:'Las dependencias mostradas no coinciden con la realidad', soluciones:['Extender el período de observación (mínimo 3 semanas recomendado)','Validar que el análisis de red capture todo el tráfico','Complementar con información manual del cliente','Ejecutar análisis en horarios de mayor actividad'] },
        ]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Descargables</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Concierto Agent Installer (Multi-platform)','Script de Configuración Masiva SSH','Herramienta de Validación de Conectividad','Template de Credenciales (CSV)','Dashboard de Monitoreo de Discovery']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Videos de Entrenamiento</CardTitle></CardHeader>
          <CardContent className="pt-0"><VideoList items={['Introducción a Concierto (20 min)','Configuración de Discovery Agentless (25 min)','Instalación y Gestión de Agentes (20 min)','Análisis de Dependencias Avanzado (30 min)','Interpretación de Recomendaciones ML (25 min)','Generación de Business Case Multi-Cloud (30 min)']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Checklist de Outputs</SectionTitle>
        <ChecklistOutputs items={['Inventario completo multi-cloud con métricas detalladas','Mapa completo de dependencias entre aplicaciones','Análisis de patrones de uso y performance','Recomendaciones de migración basadas en ML','Análisis comparativo multi-cloud (AWS, Azure, GCP)','Business case con múltiples escenarios','Roadmap de migración con waves optimizadas','Análisis de riesgos y compliance','Reporte de optimización de costos','Presentación ejecutiva personalizada','Documentación técnica completa','Exportación de datos y reportes de Concierto']} />
      </CardContent></Card>
    </div>
  );
}

// ─── MATILDA ──────────────────────────────────────────────────────────────────
function MatildaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Matilda</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Matilda es una plataforma especializada en el análisis y migración de sistemas legacy, incluyendo mainframes, AS/400, y aplicaciones monolíticas complejas. Es la herramienta ideal cuando se trabaja con infraestructura heredada.</p>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-4">
        <SectionTitle>Prerrequisitos</SectionTitle>
        <div className="space-y-3">
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
            <ul className="space-y-1.5"><CheckItem>Windows Server 2008 y superior</CheckItem><CheckItem>Linux (RHEL, CentOS, Ubuntu, SUSE)</CheckItem><CheckItem>AIX (todas las versiones)</CheckItem><CheckItem>Solaris, HP-UX</CheckItem><CheckItem>IBM i (AS/400, iSeries)</CheckItem><CheckItem>z/OS (Mainframe)</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos del Sistema</p>
            <ul className="space-y-1.5"><CheckItem>CPU: 2% de uso disponible</CheckItem><CheckItem>RAM: 100 MB disponibles</CheckItem><CheckItem>Disco: 200 MB de espacio libre</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conectividad</p>
            <ul className="space-y-1.5"><CheckItem>Acceso HTTPS saliente al puerto 443</CheckItem><CheckItem>URL permitida: *.matilda.cloud</CheckItem><CheckItem>Soporte para entornos air-gapped (offline)</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Permisos Necesarios</p>
            <ul className="space-y-1.5"><CheckItem>Windows: Administrador local</CheckItem><CheckItem>Linux/Unix: Usuario root o sudo</CheckItem><CheckItem>AIX: Usuario con permisos de sistema</CheckItem><CheckItem>AS/400: Perfil con autoridad *ALLOBJ</CheckItem><CheckItem>Mainframe: Usuario con permisos de lectura de datasets</CheckItem></ul></div>
          <div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Información Requerida del Cliente</p>
            <ul className="space-y-1.5"><CheckItem>Inventario de sistemas legacy y aplicaciones</CheckItem><CheckItem>Documentación de arquitectura existente</CheckItem><CheckItem>Credenciales de acceso a sistemas legacy</CheckItem><CheckItem>Información de licenciamiento actual</CheckItem><CheckItem>Ventanas de mantenimiento disponibles</CheckItem><CheckItem>Contactos de expertos en sistemas legacy</CheckItem></ul></div>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Timeline del Proyecto</SectionTitle>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-fuchsia-50">{['Fase','Duración','Actividades Principales'].map(h=><th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>)}</tr></thead>
          <tbody>{[['Semana 1-2','10 días','Análisis preliminar, instalación de agentes, configuración especializada'],['Semanas 3-5','21 días','Recolección de datos, análisis de código legacy, mapeo de dependencias'],['Semana 6','7 días','Análisis de viabilidad de modernización, evaluación de estrategias'],['Semana 7','5 días','Desarrollo de business case, preparación de recomendaciones']].map((row,i)=>(
            <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}>{row.map((cell,j)=><td key={j} className="p-2 text-gray-700">{cell}</td>)}</tr>
          ))}</tbody>
        </table></div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Matriz RACI</SectionTitle>
        <RaciTable rows={[['Análisis de Sistemas Legacy','R/A','R','C','I'],['Instalación de Agentes','A','R','R','I'],['Recolección de Datos','A','R','C','I'],['Análisis de Código','A','R','C','I'],['Evaluación de Estrategias','R/A','R','C','C'],['Presentación de Resultados','R/A','C','C','A']]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Plantillas</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Plantilla de Inventario de Sistemas Legacy','Checklist de Análisis de Mainframe','Template de Evaluación de Modernización','Plantilla de Business Case para Legacy','Template de Estrategia de Migración 7Rs']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Manuales</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Manual de Instalación en Sistemas AIX','Guía de Configuración para AS/400','Manual de Análisis de Mainframe z/OS','Guía de Usuario de la Plataforma Matilda','Manual de Análisis de Código Legacy','Guía de Estrategias de Modernización']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Troubleshooting</SectionTitle>
        <TroubleshootingSection items={[
          { problema:'Agente no se instala en sistema legacy', sintomas:'Fallo en la instalación del agente en AIX o AS/400', soluciones:['Verificar compatibilidad de versión del sistema operativo','Confirmar que hay espacio suficiente en disco','Validar permisos del usuario de instalación','Revisar dependencias de librerías del sistema','Consultar logs de instalación en /var/log/matilda/','Contactar soporte especializado de Matilda'] },
          { problema:'Análisis de código incompleto', sintomas:'No se detectan todas las aplicaciones o módulos', soluciones:['Verificar que el agente tenga acceso a todos los directorios','Confirmar que los lenguajes legacy estén soportados (COBOL, RPG, etc.)','Extender el período de análisis','Complementar con análisis manual de código fuente'] },
          { problema:'Performance degradada en sistema legacy', sintomas:'El sistema se vuelve lento después de instalar el agente', soluciones:['Ajustar la frecuencia de recolección de métricas','Programar análisis intensivos fuera de horario productivo','Reducir el alcance del análisis de código','Considerar análisis offline con exportación de datos'] },
        ]} />
      </CardContent></Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Descargables</CardTitle></CardHeader>
          <CardContent className="pt-0"><ResourceList items={['Matilda Agent para AIX','Matilda Agent para AS/400','Matilda Agent para z/OS','Script de Análisis Offline','Herramienta de Validación de Compatibilidad','Template de Análisis de Complejidad']} /></CardContent></Card>
        <Card className="border-fuchsia-100"><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-800">Videos de Entrenamiento</CardTitle></CardHeader>
          <CardContent className="pt-0"><VideoList items={['Introducción a Matilda y Sistemas Legacy (25 min)','Instalación en Sistemas AIX (20 min)','Configuración para AS/400 (25 min)','Análisis de Mainframe z/OS (30 min)','Estrategias de Modernización de Legacy (35 min)','Evaluación de Refactoring vs Replatforming (30 min)']} /></CardContent></Card>
      </div>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Checklist de Outputs</SectionTitle>
        <ChecklistOutputs items={['Inventario completo de sistemas legacy','Análisis de código fuente y dependencias','Evaluación de complejidad de aplicaciones','Mapeo de integraciones y dependencias externas','Análisis de viabilidad de modernización','Recomendaciones de estrategia por aplicación (7Rs)','Business case con análisis de TCO legacy vs cloud','Plan de modernización por fases','Identificación de riesgos técnicos','Evaluación de skills gap del equipo','Presentación ejecutiva con roadmap','Documentación técnica detallada de sistemas legacy']} />
      </CardContent></Card>
    </div>
  );
}

// ─── AWS TRANSFORM ────────────────────────────────────────────────────────────
function AwsTransformPage({ onNavigate }: { onNavigate: (page: HerramientaPage) => void }) {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>AWS Transform</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">AWS Transform es la herramienta de AWS para automatizar y acelerar la migración de infraestructura VMware hacia Amazon Web Services. Cubre desde la instalación del Discovery Tool hasta la ejecución completa del proceso de migración.</p>
      </CardContent></Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { page:'aws-transform-ova' as HerramientaPage, emoji:'💿', title:'Manual de Instalación OVA', desc:'Instalación y configuración del Discovery Tool en vCenter' },
          { page:'aws-transform-proceso' as HerramientaPage, emoji:'🔄', title:'Proceso de Transform', desc:'Fases del proceso de migración VMware a AWS' },
          { page:'aws-transform-mgn' as HerramientaPage, emoji:'🔌', title:'MGN Connector', desc:'Implementación del conector MGN on-premises → AWS' },
        ].map(card=>(
          <button key={card.page} onClick={()=>onNavigate(card.page)} className="text-left p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="text-2xl mb-2">{card.emoji}</div>
            <p className="font-semibold text-fuchsia-900 text-sm">{card.title}</p>
            <p className="text-xs text-fuchsia-700 mt-0.5">{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function AwsTransformOvaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Manual de Instalación del OVA en vCenter</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Procedimiento para la instalación, configuración y puesta en marcha del Discovery Tool de AWS Transform en un entorno VMware vCenter, incluyendo prerrequisitos, despliegue del OVA y configuración inicial.</p>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-4">
        <SectionTitle>1. Prerrequisitos</SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">1.1 Requisitos Generales</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>Máquina virtual: 4 vCPU, 16 GB RAM, 35 GB almacenamiento</CheckItem><CheckItem>Conectividad de red habilitada</CheckItem><CheckItem>Acceso a los servidores objetivo desde la VM del Discovery Tool</CheckItem></ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">1.2 Puertos de Red Requeridos</p>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="bg-fuchsia-50">{['Sistema Operativo','Protocolo','Puerto','Uso'].map(h=><th key={h} className="text-left p-2 font-semibold text-fuchsia-800">{h}</th>)}</tr></thead>
              <tbody>{[['Linux','SSH','TCP 22','Recolección de datos'],['Windows (HTTP)','TCP','5985','WinRM'],['Windows (HTTPS)','TCP','5986','WinRM'],['SNMP','UDP','161','Recolección de red']].map((row,i)=>(
                <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}>{row.map((cell,j)=><td key={j} className="p-2 text-gray-700">{cell}</td>)}</tr>
              ))}</tbody>
            </table></div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">1.3 Requisitos para Linux</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>Usuario con acceso SSH</CheckItem><CheckItem>Permisos para ejecutar comandos: ss/netstat, dmidecode, lvdisplay</CheckItem><CheckItem>Se recomienda configurar sudo sin contraseña (passwordless sudo)</CheckItem></ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1.5">1.4 Requisitos para VMware</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>Versión de VMware vCenter: 6.5, 6.7, 7.0 u 8.0</CheckItem><CheckItem>Permiso: Read y View en el grupo System</CheckItem><CheckItem>Permiso para desplegar OVA</CheckItem></ul>
          </div>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>2. Descarga del Discovery Tool</SectionTitle>
        <p className="text-sm text-gray-700">Acceder al entorno de vCenter y descargar el archivo OVA desde:</p>
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono break-all">
          https://s3.us-east-1.amazonaws.com/atx.discovery.collector.bundle/releases/latest/AWS-Transform-discovery-tool.ova
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>3. Despliegue del OVA</SectionTitle>
        <div className="space-y-2">
          {['Iniciar sesión en vCenter','Seleccionar el clúster o recurso destino','Ejecutar: Deploy OVF Template','Seleccionar el archivo .ova descargado','Configurar: Nombre de la VM, Red, Almacenamiento','Finalizar el despliegue'].map((step,i)=>(
            <div key={i} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
              <span className="text-sm text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>4. Configuración Inicial</SectionTitle>
        <p className="text-sm font-medium text-gray-700">4.1 Acceso a la Interfaz</p>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-fuchsia-50"><th className="text-left p-2 font-semibold text-fuchsia-800">Parámetro</th><th className="text-left p-2 font-semibold text-fuchsia-800">Valor</th></tr></thead>
          <tbody><tr className="border-t"><td className="p-2 text-gray-700">URL de acceso</td><td className="p-2 font-mono text-xs text-gray-600">https://&lt;IP_VM&gt;:5000</td></tr><tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Usuario</td><td className="p-2 text-gray-600">discovery</td></tr><tr className="border-t"><td className="p-2 text-gray-700">Contraseña inicial</td><td className="p-2 text-gray-600">Password</td></tr></tbody>
        </table></div>
        <DangerAlert><strong>Importante:</strong> Crear una nueva contraseña al ingresar por primera vez.</DangerAlert>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>5. Configuración de Acceso a vCenter</SectionTitle>
        <ul className="space-y-1.5"><CheckItem>Ir a: Set up access to connect to your vCenter Server</CheckItem><CheckItem>Introducir FQDN o IP del vCenter (sin https://)</CheckItem><CheckItem>Ingresar usuario y contraseña (Windows: DOMINIO\usuario)</CheckItem><CheckItem>Verificar conexión — Estado esperado: Connected</CheckItem><CheckItem>Para recolección manual: Actions → Force collection</CheckItem></ul>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>6. Inventario Descubierto</SectionTitle>
        <p className="text-sm text-gray-700">Acceder a <strong>Discovered Inventory</strong> para visualizar:</p>
        <ul className="space-y-1.5"><CheckItem>Máquinas virtuales</CheckItem><CheckItem>Servicios</CheckItem><CheckItem>Dependencias</CheckItem></ul>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>7. Configuración de Acceso a Sistemas Operativos</SectionTitle>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">7.1 Tipos de Credenciales</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>SSH (Linux)</CheckItem><CheckItem>WinRM (Windows)</CheckItem><CheckItem>Formato Kerberos: usuario@DOMINIO.TLD</CheckItem></ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">7.2 Configuración Automática</p>
            <p className="text-sm text-gray-600 ml-2">Activar <strong>Auto-connect</strong> para aplicar credenciales a todas las VMs automáticamente.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">7.3 Configuración Manual</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>Ir a Discovered Inventory</CheckItem><CheckItem>Aplicar filtro (ejemplo: nombre del grupo)</CheckItem><CheckItem>Seleccionar hosts → Manage access credential</CheckItem><CheckItem>Asignar credenciales y guardar</CheckItem></ul>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">7.4 Validación</p>
            <ul className="space-y-1.5 ml-2"><CheckItem>Network Status → Success</CheckItem><CheckItem>Database Status → Success (para Windows con SQL Server)</CheckItem></ul>
          </div>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>8. Descargas y Resultados Esperados</SectionTitle>
        <ul className="space-y-1.5"><CheckItem>Inventario: opción Download Inventory</CheckItem><CheckItem>Logs: opción Download Logs</CheckItem><CheckItem>Identificación de: Servidores, Aplicaciones, Dependencias</CheckItem><CheckItem>Datos de red: IP origen/destino, Puertos, Protocolos, Servicios activos</CheckItem></ul>
        <WarnAlert>Siguiente paso: Una vez instalado el Discovery Tool, continúa con el Proceso de uso de Transform.</WarnAlert>
      </CardContent></Card>
    </div>
  );
}

function AwsTransformProcesoPage() {
  const phases = [
    { n:'1', title:'Descubrimiento e Importación de Inventario', obj:'Identificar y recopilar información sobre la infraestructura VMware de origen.',
      items:['Importar RVTools (.xlsx) y exportación del Discovery Tool (.zip)','AWS Transform extrae: servidores, SO, recursos de cómputo, almacenamiento y relaciones de red','Resultado: Inventario completo de servidores VMware disponible para planificación'] },
    { n:'2', title:'Planificación de Migración', obj:'Agrupar servidores en aplicaciones y definir oleadas (waves) de migración.',
      items:['Analizar dependencias entre servidores y aplicaciones','Agrupar servidores en aplicaciones lógicas','Generar el plan de oleadas (wave plan)','Artefacto generado: migration_planning/wave_plan-[fecha].csv'] },
    { n:'3', title:'Conexión a la Cuenta AWS de Destino', obj:'Establecer la conexión segura entre AWS Transform y la cuenta AWS de destino.',
      items:['Configurar el conector de cuenta de destino (Target account connection)','Establecer conexión con la cuenta AWS','Configurar el rol IAM: AWSTransform-Connector-role','Resultado: Conexión activa y verificada con la cuenta de destino'] },
    { n:'4', title:'Migración de Red', obj:'Configurar la infraestructura de red necesaria en AWS.',
      items:['Diseñar y desplegar la topología de red en AWS','Configurar VPCs, subnets, security groups','Asegurar conectividad entre entorno origen y AWS de destino'] },
    { n:'5', title:'Preparación y Ejecución del Plan de Migración', obj:'Preparar los artefactos necesarios para la ejecución con AWS MGN.',
      items:['Generar el inventario enriquecido de MGN (enriched_inventory-[id]-[fecha].csv)','Generar recomendaciones de instancias EC2','Crear archivo de importación MGN por Wave (mgn_import_Wave_[nombre]-[fecha].csv)','Verificar emparejamiento exitoso con tipos de instancia EC2'] },
    { n:'6', title:'Ejecución de la Migración', obj:'Ejecutar la migración de los servidores de cada Wave.',
      items:['Iniciar replicación de datos mediante AWS MGN','Ejecutar pruebas de lanzamiento (test launch)','Revisar instancias de prueba generadas','Aprobar acciones de cutover en la consola de aprobaciones','Ejecutar el cutover de las instancias'] },
  ];

  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Proceso de Migración VMware a AWS con AWS Transform</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Migración de servidores VMware hacia AWS mediante estrategia de rehost (lift-and-shift) utilizando AWS Application Migration Service (MGN) en modalidad single-account.</p>
      </CardContent></Card>

      {phases.map(phase=>(
        <Card key={phase.n} className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">{phase.n}</span>
            <h3 className="font-semibold text-gray-800">Fase {phase.n}: {phase.title}</h3>
          </div>
          <InfoAlert><strong>Objetivo:</strong> {phase.obj}</InfoAlert>
          <ul className="space-y-1.5">{phase.items.map(i=><CheckItem key={i}>{i}</CheckItem>)}</ul>
          {phase.n === '6' && <DangerAlert><strong>Nota:</strong> Verificar el estado de cada servidor antes de aprobar el cutover. El proceso es irreversible una vez completado.</DangerAlert>}
        </CardContent></Card>
      ))}

      <Card className="border-fuchsia-100"><CardContent className="pt-5">
        <SectionTitle>Resumen de Artefactos Generados</SectionTitle>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="bg-fuchsia-50"><th className="text-left p-2 font-semibold text-fuchsia-800">Artefacto</th><th className="text-left p-2 font-semibold text-fuchsia-800">Descripción</th></tr></thead>
          <tbody>{[['RVTools export (.xlsx)','Archivo de inventario VMware de origen'],['Discovery Tool export (.zip)','Datos de descubrimiento de 28 días'],['wave_plan-[fecha].csv','Plan de oleadas de migración'],['enriched_inventory-[id]-[fecha].csv','Inventario enriquecido de MGN'],['mgn_import_Wave_[nombre]-[fecha].csv','Archivo de importación MGN por Wave']].map((row,i)=>(
            <tr key={i} className={`border-t ${i%2===1?'bg-gray-50':''}`}><td className="p-2 font-mono text-xs text-fuchsia-700">{row[0]}</td><td className="p-2 text-gray-700">{row[1]}</td></tr>
          ))}</tbody>
        </table></div>
      </CardContent></Card>
    </div>
  );
}

function AwsTransformMgnPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Implementación de MGN Connector (On-Premises → AWS)</SectionTitle>
        <p className="text-sm text-gray-700 leading-relaxed">Guía completa para instalar y configurar el MGN Connector que permite la conexión entre el entorno on-premises y AWS Application Migration Service.</p>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>1. Requisitos Generales</SectionTitle>
        <ul className="space-y-1.5"><CheckItem>Servidor dedicado recomendado</CheckItem><CheckItem>Permisos IAM configurados</CheckItem><CheckItem>Conectividad saliente HTTPS (puerto 443)</CheckItem></ul>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>2. Sistemas Operativos Soportados (Linux 64 bits)</SectionTitle>
        <ul className="space-y-1.5"><CheckItem>Ubuntu 18.x – 22.04</CheckItem><CheckItem>Amazon Linux 2</CheckItem><CheckItem>RHEL 8.x</CheckItem></ul>
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700 mb-1">No soportados:</p>
          <p className="text-xs text-red-600">CentOS 5/6 · RHEL 6 · Oracle 6 · Amazon Linux 1</p>
        </div>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>3. Requisitos del Agente SSM</SectionTitle>
        <ul className="space-y-1.5"><CheckItem>Instalación automática del agente SSM</CheckItem><CheckItem>Si ya existe una versión previa → desinstalar primero</CheckItem><CheckItem>Espacio mínimo: 200 MB en disco, 200 KB en /var</CheckItem></ul>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>4. Creación de Roles IAM con CloudFormation</SectionTitle>
        <p className="text-sm text-gray-600 mb-2">Desplegar los roles IAM requeridos con el siguiente comando:</p>
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono whitespace-pre">{`aws cloudformation create-stack \\
  --stack-name mgn-connector-roles \\
  --template-body file://roles.yaml \\
  --capabilities CAPABILITY_NAMED_IAM`}</div>
        <p className="text-sm text-gray-700 mt-2">Los roles requeridos son:</p>
        <ul className="space-y-1.5"><CheckItem>MGNConnectorInstallerRole — permisos mgn:*</CheckItem><CheckItem>AWSApplicationMigrationConnectorManagementRole — permisos SSM, S3, logs, secretsmanager</CheckItem><CheckItem>AWSApplicationMigrationConnectorSharingRole — permisos AWSApplicationMigrationAgentInstallationPolicy</CheckItem></ul>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>5. Hybrid Activation (SSM)</SectionTitle>
        <p className="text-sm text-gray-700">Desde AWS Systems Manager, generar:</p>
        <ul className="space-y-1.5"><CheckItem>Activation ID</CheckItem><CheckItem>Activation Code</CheckItem></ul>
        <InfoAlert>Una vez generados, ir a la sección MGN Connector → Agregar conector e ingresar los datos.</InfoAlert>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>6. Instalación del MGN Connector</SectionTitle>
        <p className="text-sm font-medium text-gray-700 mb-2">6.1 Descargar el instalador:</p>
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono whitespace-pre">{`wget -O ./aws-vcenter-client-installer-init.py \\
  https://aws-application-migration-service-us-east-1.s3.us-east-1.amazonaws.com/latest/vcenter-client/linux/aws-vcenter-client-installer-init.py`}</div>
        <p className="text-sm font-medium text-gray-700 mt-3 mb-2">6.2 Ejecutar la instalación:</p>
        <div className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs font-mono whitespace-pre">{`sudo python3 aws-vcenter-client-installer-init.py \\
  --connector source-automation \\
  --region us-east-1 \\
  --activation-code <ACTIVATION_CODE> \\
  --connector-name <CONNECTOR_NAME>`}</div>
        <WarnAlert>Reemplazar &lt;ACTIVATION_CODE&gt; y &lt;CONNECTOR_NAME&gt; con los valores generados en el paso de Hybrid Activation.</WarnAlert>
      </CardContent></Card>

      <Card className="border-fuchsia-100"><CardContent className="pt-5 space-y-3">
        <SectionTitle>7. Instalación del Agente MGN</SectionTitle>
        <p className="text-sm text-gray-700">Se recomienda usar la opción <strong>Install agent (automático)</strong> desde la consola de AWS MGN para simplificar el proceso.</p>
      </CardContent></Card>

      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200"><CardContent className="pt-5 space-y-3">
        <SectionTitle>Resumen del Flujo Completo</SectionTitle>
        <div className="space-y-2">
          {['Crear roles IAM con CloudFormation','Crear Hybrid Activation en AWS Systems Manager','Instalar el conector MGN en el servidor on-premises','Registrar el conector en MGN','Conectar a vCenter','Descubrir VMs','Instalar agentes en los servidores objetivo'].map((step,i)=>(
            <div key={i} className="flex items-center gap-3">
              <span className="bg-fuchsia-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">{i+1}</span>
              <span className="text-sm text-gray-700">{step}</span>
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function WikiHerramientas() {
  const [activePage, setActivePage] = useState<HerramientaPage>('guia');

  const content: Record<HerramientaPage, React.ReactNode> = {
    'guia': <GuiaPage />,
    'cloudamize': <CloudamizePage />,
    'concierto': <ConciertPage />,
    'matilda': <MatildaPage />,
    'aws-transform': <AwsTransformPage onNavigate={setActivePage} />,
    'aws-transform-ova': <AwsTransformOvaPage />,
    'aws-transform-proceso': <AwsTransformProcesoPage />,
    'aws-transform-mgn': <AwsTransformMgnPage />,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1">
        {subPages.map(p=>(
          <button key={p.value} onClick={()=>setActivePage(p.value)}
            className={cn('flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              activePage===p.value ? 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300' : 'text-gray-600 border-transparent hover:bg-gray-100')}>
            {activePage===p.value && <ChevronRight className="h-3 w-3" />}{p.label}
          </button>
        ))}
      </div>
      <div className="animate-fadeIn">{content[activePage]}</div>
    </div>
  );
}
