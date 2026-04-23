import { useState } from 'react';
import { Info, CheckCircle, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type HerramientaPage =
  | 'guia'
  | 'cloudamize'
  | 'concierto'
  | 'matilda'
  | 'aws-transform'
  | 'aws-transform-ova'
  | 'aws-transform-proceso'
  | 'aws-transform-mgn';

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

function GuiaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Guía de Selección de Herramientas</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            SoftwareONE trabaja con tres herramientas principales, cada una con características específicas que las
            hacen más adecuadas para diferentes escenarios.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5">
          <h3 className="font-semibold text-gray-800 mb-3">Comparativa de Herramientas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Característica</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Cloudamize</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Concierto</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Matilda</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Tipo de Instalación', 'Agente ligero', 'Agentless / Agente', 'Agente'],
                  ['Plataformas Soportadas', 'Windows, Linux, VMware', 'Multi-cloud, On-prem', 'Windows, Linux, AIX'],
                  ['Análisis Dependencias', 'Sí (avanzado)', 'Sí (muy detallado)', 'Sí (básico)'],
                  ['Sistemas Legacy', 'No', 'Parcial', 'Sí (especializado)'],
                  ['Ideal para', 'Entornos medianos/grandes', 'Entornos complejos', 'Sistemas heredados'],
                ].map((row, i) => (
                  <tr key={row[0]} className={`border-t ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    {row.map((cell, j) => (
                      <td key={j} className={`p-2 ${j === 0 ? 'font-medium text-gray-700' : 'text-gray-600'}`}>{cell}</td>
                    ))}
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

function CloudamizePage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Cloudamize</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Cloudamize es una plataforma de análisis y optimización de infraestructura que proporciona recomendaciones
            precisas para migración a AWS basadas en datos reales de uso y performance.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Prerrequisitos Técnicos</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
              <ul className="space-y-1.5">
                <CheckItem>Windows Server 2008 R2 y superior</CheckItem>
                <CheckItem>Linux (RHEL, CentOS, Ubuntu, SUSE, Debian)</CheckItem>
                <CheckItem>VMware vSphere 5.5 y superior</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos del Sistema</p>
              <ul className="space-y-1.5">
                <CheckItem>CPU: Mínimo 1% de uso disponible</CheckItem>
                <CheckItem>RAM: 50 MB disponibles</CheckItem>
                <CheckItem>Disco: 100 MB de espacio libre</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conectividad</p>
              <ul className="space-y-1.5">
                <CheckItem>Acceso HTTPS saliente al puerto 443</CheckItem>
                <CheckItem>URL permitida: *.cloudamize.com</CheckItem>
                <CheckItem>Ancho de banda: ~1 KB/s por servidor</CheckItem>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Permisos Necesarios</h3>
          <ul className="space-y-1.5">
            <CheckItem>Windows: Administrador local o permisos de lectura WMI</CheckItem>
            <CheckItem>Linux: Usuario root o sudo para instalación</CheckItem>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ConciertePage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Concierto</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Concierto es una plataforma avanzada de análisis multi-cloud que utiliza machine learning para proporcionar
            recomendaciones inteligentes. Es ideal para entornos complejos y heterogéneos.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Prerrequisitos Técnicos</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
              <ul className="space-y-1.5">
                <CheckItem>Windows Server 2012 y superior</CheckItem>
                <CheckItem>Linux (todas las distribuciones principales)</CheckItem>
                <CheckItem>AIX, Solaris, HP-UX</CheckItem>
                <CheckItem>VMware, Hyper-V, KVM</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Modos de Operación</p>
              <ul className="space-y-1.5">
                <CheckItem>Agentless: Conexión remota vía SSH/WMI</CheckItem>
                <CheckItem>Agent-based: Instalación de agente ligero</CheckItem>
                <CheckItem>Hybrid: Combinación de ambos métodos</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos (modo agente)</p>
              <ul className="space-y-1.5">
                <CheckItem>CPU: &lt;1% de uso</CheckItem>
                <CheckItem>RAM: 30 MB disponibles</CheckItem>
                <CheckItem>Disco: 50 MB de espacio libre</CheckItem>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MatildaPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Matilda</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Matilda es una plataforma especializada en el análisis y migración de sistemas legacy, incluyendo
            mainframes, AS/400, y aplicaciones monolíticas complejas.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Prerrequisitos Técnicos</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sistemas Operativos Soportados</p>
              <ul className="space-y-1.5">
                <CheckItem>Windows Server 2008 y superior</CheckItem>
                <CheckItem>Linux (RHEL, CentOS, Ubuntu, SUSE)</CheckItem>
                <CheckItem>AIX (todas las versiones)</CheckItem>
                <CheckItem>Solaris, HP-UX</CheckItem>
                <CheckItem>IBM i (AS/400, iSeries)</CheckItem>
                <CheckItem>z/OS (Mainframe)</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Recursos del Sistema</p>
              <ul className="space-y-1.5">
                <CheckItem>CPU: 2% de uso disponible</CheckItem>
                <CheckItem>RAM: 100 MB disponibles</CheckItem>
                <CheckItem>Disco: 200 MB de espacio libre</CheckItem>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Conectividad</p>
              <ul className="space-y-1.5">
                <CheckItem>Acceso HTTPS saliente al puerto 443</CheckItem>
                <CheckItem>URL permitida: *.matilda.cloud</CheckItem>
                <CheckItem>Soporte para entornos air-gapped (offline)</CheckItem>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AwsTransformPage({ onNavigate }: { onNavigate: (page: HerramientaPage) => void }) {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">AWS Transform</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            AWS Transform es la herramienta de AWS para automatizar y acelerar la migración de infraestructura VMware
            hacia Amazon Web Services. Cubre desde la instalación del Discovery Tool hasta la ejecución completa
            del proceso de migración.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { page: 'aws-transform-ova' as HerramientaPage, emoji: '💿', title: 'Manual de Instalación OVA', desc: 'Instalación y configuración del Discovery Tool en vCenter' },
          { page: 'aws-transform-proceso' as HerramientaPage, emoji: '🔄', title: 'Proceso de Transform', desc: 'Fases del proceso de migración VMware a AWS' },
          { page: 'aws-transform-mgn' as HerramientaPage, emoji: '🔌', title: 'MGN Connector', desc: 'Implementación del conector MGN on-premises → AWS' },
        ].map((card) => (
          <button
            key={card.page}
            onClick={() => onNavigate(card.page)}
            className="text-left p-4 rounded-xl border border-fuchsia-200 bg-fuchsia-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
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
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Manual de Instalación del OVA en vCenter</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Procedimiento para la instalación, configuración y puesta en marcha del Discovery Tool de AWS Transform
            en un entorno VMware vCenter.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">1. Prerrequisitos</h3>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">1.1 Requisitos Generales</p>
          <ul className="space-y-1.5">
            <CheckItem>Máquina virtual: 4 vCPU, 16 GB RAM, 35 GB almacenamiento</CheckItem>
            <CheckItem>Conectividad de red habilitada</CheckItem>
            <CheckItem>Acceso a los servidores objetivo desde la VM del Discovery Tool</CheckItem>
          </ul>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1.5">1.2 Puertos de Red Requeridos</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">OS</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Protocolo</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Puerto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t"><td className="p-2 text-gray-700">Linux</td><td className="p-2 text-gray-600">SSH</td><td className="p-2 text-gray-600">22</td></tr>
                <tr className="border-t bg-gray-50"><td className="p-2 text-gray-700">Windows</td><td className="p-2 text-gray-600">WinRM</td><td className="p-2 text-gray-600">5985 / 5986</td></tr>
                <tr className="border-t"><td className="p-2 text-gray-700">VMware</td><td className="p-2 text-gray-600">HTTPS</td><td className="p-2 text-gray-600">443</td></tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AwsTransformProcesoPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Proceso de Migración VMware a AWS con AWS Transform</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Migración de servidores VMware hacia AWS utilizando estrategia de rehost (lift-and-shift) con AWS
            Application Migration Service (MGN) en modalidad single-account.
          </p>
        </CardContent>
      </Card>

      {[
        {
          n: '1', title: 'Fase 1: Descubrimiento e Importación de Inventario',
          obj: 'Identificar y recopilar información sobre la infraestructura VMware de origen.',
          items: [
            'Importar archivos de inventario VMware (RVTools .xlsx + Discovery Tool .zip)',
            'AWS Transform procesa servidores, configuraciones, SO, recursos y relaciones de red',
            'Resultado: Inventario completo de servidores VMware disponible para planificación',
          ],
        },
        {
          n: '2', title: 'Fase 2: Planificación de Migración',
          obj: 'Agrupar servidores en aplicaciones y definir oleadas (waves) de migración.',
          items: [
            'Analizar dependencias entre servidores y aplicaciones',
            'Agrupar servidores en aplicaciones lógicas',
            'Definir waves de migración priorizadas por criticidad',
          ],
        },
        {
          n: '3', title: 'Fase 3: Configuración y Ejecución',
          obj: 'Configurar AWS MGN y ejecutar la migración.',
          items: [
            'Instalar y configurar MGN Connector on-premises',
            'Instalar AWS Replication Agent en servidores origen',
            'Iniciar replicación y monitorear progreso',
            'Ejecutar cutover en ventana de mantenimiento',
          ],
        },
      ].map((phase) => (
        <Card key={phase.n} className="border-fuchsia-100">
          <CardContent className="pt-5 space-y-3">
            <h3 className="font-semibold text-gray-800">{phase.title}</h3>
            <InfoAlert><strong>Objetivo:</strong> {phase.obj}</InfoAlert>
            <ul className="space-y-1.5">
              {phase.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AwsTransformMgnPage() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Implementación de MGN Connector (On-Premises → AWS)</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Guía para instalar y configurar el MGN Connector que permite la conexión entre el entorno on-premises y
            AWS Application Migration Service.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Requisitos Generales</h3>
          <ul className="space-y-1.5">
            <CheckItem>Servidor dedicado recomendado</CheckItem>
            <CheckItem>Permisos IAM configurados</CheckItem>
            <CheckItem>Conectividad saliente HTTPS (puerto 443)</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Sistemas Operativos Soportados (Linux 64 bits)</h3>
          <ul className="space-y-1.5">
            <CheckItem>Ubuntu 18.x – 22.04</CheckItem>
            <CheckItem>Amazon Linux 2</CheckItem>
            <CheckItem>RHEL 8.x</CheckItem>
          </ul>
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1">No soportados:</p>
            <p className="text-xs text-red-600">CentOS 5/6 · RHEL 6 · Oracle 6 · Amazon Linux 1</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Requisitos del Agente SSM</h3>
          <ul className="space-y-1.5">
            <CheckItem>Instalación automática del agente SSM</CheckItem>
            <CheckItem>Permisos de SSM configurados en la instancia</CheckItem>
            <CheckItem>Conectividad con endpoints de SSM en AWS</CheckItem>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

export function WikiHerramientas() {
  const [activePage, setActivePage] = useState<HerramientaPage>('guia');

  const content: Record<HerramientaPage, React.ReactNode> = {
    'guia': <GuiaPage />,
    'cloudamize': <CloudamizePage />,
    'concierto': <ConciertePage />,
    'matilda': <MatildaPage />,
    'aws-transform': <AwsTransformPage onNavigate={setActivePage} />,
    'aws-transform-ova': <AwsTransformOvaPage />,
    'aws-transform-proceso': <AwsTransformProcesoPage />,
    'aws-transform-mgn': <AwsTransformMgnPage />,
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
