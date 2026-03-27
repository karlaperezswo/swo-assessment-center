import { useState, useRef } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { TechMemoryData, AWSServiceEntry, DictionaryEntry, WellArchPillar } from './types';
import { exportTechMemoryWord } from './wordExporter';
import {
  Search, Plus, Trash2, Download, Upload, RefreshCw,
  BookOpen, Building2, FileText, Award, ChevronDown, ChevronUp, Loader2,
  Link, Library, CheckSquare, Square, ShieldCheck
} from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #e91e8c 0%, #9c27b0 50%, #1565c0 100%)';
const GRADIENT_H = 'linear-gradient(90deg, #e91e8c 0%, #9c27b0 50%, #1565c0 100%)';

const DEFAULT_INTRO = `[NOMBRE_EMPRESA], empresa con sede en Medellín, se especializa en ofrecer soluciones tecnológicas y de gestión para el sector salud. Su modelo de negocio se caracteriza por un enfoque integral que abarca desde la consultoría y el diseño de procesos hasta la implementación de plataformas digitales que optimizan la operación clínica y administrativa. La compañía se distingue por su compromiso con la innovación, la eficiencia operativa y el bienestar de pacientes y profesionales de la salud.

En este contexto, la adopción de soluciones tecnológicas en la nube se ha convertido en un pilar estratégico para [NOMBRE_EMPRESA]. Estas iniciativas no solo permiten habilitar herramientas eficientes para sus usuarios, sino también optimizar procesos internos y fortalecer el soporte al talento humano, garantizando seguridad, escalabilidad y cumplimiento normativo en un sector altamente regulado.

Con este objetivo, [NOMBRE_EMPRESA] se acercó a SoftwareONE para liderar conjuntamente la implementación de una landing zone en Amazon Web Services (AWS). El propósito principal del proyecto fue establecer una hoja de ruta clara y estructurada que facilitara su transición hacia un entorno cloud seguro, escalable y alineado con sus necesidades operativas y regulatorias.

Durante la fase de implementación, [NOMBRE_EMPRESA] proporcionó los requerimientos técnicos y la información crítica necesaria para definir los servicios a implementar. Gracias a esta colaboración, se logró ejecutar un proceso ordenado y eficiente, culminando en la implementación exitosa de la infraestructura en tres ambientes diferenciados: producción, calidad y desarrollo. Cada servicio fue aprovisionado y validado conforme a los requisitos técnicos establecidos, garantizando su correcto funcionamiento en el nuevo entorno cloud.

Este documento no solo recopila las especificaciones técnicas de los servicios implementados, sino que también ofrece una descripción general de cada solución utilizada. Su objetivo es proporcionar al equipo de [NOMBRE_EMPRESA] una base de conocimiento sólida que facilite futuras decisiones en sus procesos de modernización tecnológica y gobernanza en la nube.

Finalmente, extendemos nuestro agradecimiento al equipo de [NOMBRE_EMPRESA] por su compromiso, colaboración y dedicación durante todas las etapas del proyecto. Su participación activa fue clave para asegurar que la solución implementada esté alineada con la visión de la empresa y con las mejores prácticas de la industria.`;

const DEFAULT_INFRA = `Durante el proyecto de implementación desarrollado para [NOMBRE_EMPRESA], se llevaron a cabo diversas actividades de re-arquitectura, con el propósito de garantizar que cada componente de la solución operara bajo los estándares de seguridad y cumplimiento requeridos para su entorno específico.

Dado que se trató de una implementación desde cero en el entorno de Amazon Web Services (AWS), el enfoque principal se centró en optimizar la infraestructura, mejorando su organización, segmentación y capacidades de comunicación. Para ello, se diseñó una arquitectura que contempla tres ambientes diferenciados: Producción, Desarrollo y Calidad (QA), además de una cuenta transversal de networking, encargada de conectar todos los ambientes. Cada entorno fue configurado con sus propios recursos y parámetros específicos, asegurando una operación eficiente y segura.

En particular, se implementaron cuatro VPC interconectadas mediante el servicio Resource Access Manager (RAM), lo que permitió establecer una comunicación segura y eficaz entre los ambientes de Desarrollo, Calidad, Networking y Producción. Esta estrategia facilitó una adecuada separación lógica entre los entornos, permitiendo un control granular del tráfico de red y reforzando las buenas prácticas de arquitectura en la nube.

El presente documento detalla los componentes clave de la infraestructura desplegada, incluyendo VPCs, subnets, tablas de ruteo, grupos de seguridad, entre otros elementos críticos. No obstante, el objetivo principal de esta sección es ofrecer una visión de alto nivel de la solución diseñada por el equipo de consultores de SoftwareONE, destacando las decisiones arquitectónicas más relevantes tomadas durante el proceso.`;

const DEFAULT_CONCLUSIONS = `La exitosa configuración de los servicios dentro de la organización de AWS, siguiendo las mejores prácticas desde el inicio, representa un avance estratégico clave para [NOMBRE_EMPRESA]. Esta implementación ha establecido una base sólida para la innovación, la eficiencia operativa y la escalabilidad, traduciéndose en beneficios tangibles y una mayor agilidad para adaptarse a las dinámicas del mercado.

La adopción de AWS Control Tower y la Landing Zone permitió una gestión centralizada y segura del entorno multi-cuenta, aplicando políticas de seguridad, cumplimiento y auditoría desde el primer momento. Se diseñaron arquitecturas de red eficientes y seguras, basadas en VPCs centralizadas, Transit Gateway y segmentación por entornos (producción, desarrollo, pruebas), garantizando conectividad y aislamiento adecuados entre cuentas.

Gracias al uso de herramientas como Terraform, se logró automatizar la creación de recursos y configuraciones, reduciendo errores humanos y acelerando los tiempos de despliegue. Además, la integración con servicios como AWS CloudTrail y GuardDuty permite una supervisión continua del entorno, facilitando la detección temprana de desviaciones y amenazas.`;

const DEFAULT_THANK_YOU = `Estimado equipo de [NOMBRE_EMPRESA],

En nombre de SoftwareOne, queremos expresar nuestro más sincero agradecimiento por la confianza depositada en nosotros para acompañarlos en este importante proceso de transformación digital.

Ha sido un privilegio trabajar junto a su equipo de TI, cuya dedicación, profesionalismo y compromiso han sido fundamentales para el éxito de este proyecto. La colaboración estrecha entre ambos equipos ha permitido superar los desafíos presentados y alcanzar los objetivos establecidos.

Estamos convencidos de que esta migración a AWS representa el inicio de una nueva etapa de crecimiento e innovación para su organización. SoftwareOne continuará siendo su aliado estratégico en este camino hacia la transformación digital.

Agradecemos profundamente la oportunidad de haber sido parte de este proyecto y esperamos continuar fortaleciendo nuestra relación en el futuro.

Atentamente,
[CONSULTOR]
[FIRMA]
[CORREO]`;

const DEFAULT_WELL_ARCH: WellArchPillar[] = [
  {
    id: 'wa1', name: 'Excelencia Operacional', icon: '⚙️', color: '#0891b2',
    recommendations: [
      'Implementar AWS CloudWatch para monitoreo centralizado de métricas y logs.',
      'Definir runbooks y playbooks para operaciones rutinarias y respuesta a incidentes.',
      'Adoptar prácticas de Infrastructure as Code (IaC) con AWS CloudFormation o Terraform.',
      'Establecer pipelines de CI/CD con AWS CodePipeline para automatizar despliegues.',
      'Realizar revisiones periódicas de operaciones usando AWS Well-Architected Tool.',
    ],
  },
  {
    id: 'wa2', name: 'Seguridad', icon: '🔐', color: '#7c3aed',
    recommendations: [
      'Habilitar AWS GuardDuty para detección continua de amenazas en todas las cuentas.',
      'Implementar AWS Security Hub para una vista centralizada del estado de seguridad.',
      'Aplicar el principio de mínimo privilegio en todas las políticas IAM.',
      'Habilitar AWS CloudTrail en todas las regiones para auditoría completa de actividades.',
      'Cifrar todos los datos en reposo y en tránsito usando AWS KMS y TLS.',
      'Configurar AWS Config para evaluar el cumplimiento de políticas de seguridad.',
    ],
  },
  {
    id: 'wa3', name: 'Confiabilidad', icon: '🛡️', color: '#059669',
    recommendations: [
      'Diseñar arquitecturas multi-AZ para garantizar alta disponibilidad.',
      'Implementar AWS Backup para protección automatizada de datos críticos.',
      'Configurar Auto Scaling Groups para adaptarse automáticamente a la demanda.',
      'Establecer y probar regularmente planes de recuperación ante desastres (DR).',
      'Usar Amazon Route 53 con health checks para failover automático de DNS.',
    ],
  },
  {
    id: 'wa4', name: 'Eficiencia del Rendimiento', icon: '⚡', color: '#d97706',
    recommendations: [
      'Seleccionar los tipos de instancias EC2 adecuados según el perfil de carga de trabajo.',
      'Implementar Amazon CloudFront para reducir latencia en la entrega de contenido.',
      'Usar Amazon ElastiCache para cachear datos frecuentemente accedidos.',
      'Revisar y optimizar consultas de base de datos con Performance Insights en RDS.',
      'Evaluar el uso de instancias Graviton para mejor relación precio/rendimiento.',
    ],
  },
  {
    id: 'wa5', name: 'Optimización de Costos', icon: '💰', color: '#e91e8c',
    recommendations: [
      'Implementar AWS Cost Explorer y presupuestos con alertas para control de gastos.',
      'Evaluar el uso de Reserved Instances o Savings Plans para cargas de trabajo estables.',
      'Configurar políticas de ciclo de vida en S3 para mover datos a clases de almacenamiento más económicas.',
      'Usar AWS Trusted Advisor para identificar recursos subutilizados o inactivos.',
      'Revisar y eliminar recursos no utilizados (snapshots, EIPs, volúmenes huérfanos).',
    ],
  },
  {
    id: 'wa6', name: 'Sostenibilidad', icon: '🌱', color: '#16a34a',
    recommendations: [
      'Seleccionar regiones AWS con mayor porcentaje de energía renovable cuando sea posible.',
      'Optimizar el uso de recursos para reducir la huella de carbono (right-sizing).',
      'Implementar políticas de apagado automático de recursos en horarios no productivos.',
      'Usar instancias Graviton que consumen hasta un 60% menos de energía.',
      'Monitorear el impacto de sostenibilidad con AWS Customer Carbon Footprint Tool.',
    ],
  },
];

const DEFAULT_DICTIONARY: DictionaryEntry[] = [
  { id: 'd1',  term: 'Cloud Computing',      category: 'Conceptos Cloud',  selected: false, definition: 'Modelo de entrega de servicios de TI a través de internet, que permite acceso bajo demanda a recursos computacionales compartidos.' },
  { id: 'd2',  term: 'IaaS',                 category: 'Conceptos Cloud',  selected: false, definition: 'Infrastructure as a Service. Modelo de nube que proporciona recursos de infraestructura virtualizados como servidores, almacenamiento y redes.' },
  { id: 'd3',  term: 'PaaS',                 category: 'Conceptos Cloud',  selected: false, definition: 'Platform as a Service. Plataforma en la nube que permite desarrollar, ejecutar y gestionar aplicaciones sin gestionar la infraestructura subyacente.' },
  { id: 'd4',  term: 'SaaS',                 category: 'Conceptos Cloud',  selected: false, definition: 'Software as a Service. Modelo de distribución de software donde las aplicaciones se alojan en la nube y se accede a ellas vía internet.' },
  { id: 'd5',  term: 'Migración a la Nube',  category: 'Migración',        selected: false, definition: 'Proceso de mover aplicaciones, datos e infraestructura de TI desde entornos on-premises hacia una plataforma de nube.' },
  { id: 'd6',  term: 'Lift and Shift',       category: 'Migración',        selected: false, definition: 'Estrategia de migración que consiste en mover aplicaciones a la nube sin modificar su arquitectura (Rehost).' },
  { id: 'd7',  term: 'AWS MAP',              category: 'AWS',              selected: false, definition: 'Migration Acceleration Program. Programa de AWS que proporciona metodología, herramientas y financiamiento para acelerar migraciones a la nube.' },
  { id: 'd8',  term: 'VPC',                  category: 'AWS',              selected: false, definition: 'Virtual Private Cloud. Red virtual privada aislada dentro de AWS que permite controlar el entorno de red de los recursos.' },
  { id: 'd9',  term: 'IAM',                  category: 'AWS',              selected: false, definition: 'Identity and Access Management. Servicio de AWS para gestionar el acceso a recursos mediante usuarios, roles y políticas.' },
  { id: 'd10', term: 'S3',                   category: 'AWS',              selected: false, definition: 'Simple Storage Service. Servicio de almacenamiento de objetos de AWS con alta disponibilidad, durabilidad y escalabilidad.' },
  { id: 'd11', term: 'EC2',                  category: 'AWS',              selected: false, definition: 'Elastic Compute Cloud. Servicio de AWS que proporciona capacidad de cómputo escalable en la nube mediante instancias virtuales.' },
  { id: 'd12', term: 'RDS',                  category: 'AWS',              selected: false, definition: 'Relational Database Service. Servicio administrado de bases de datos relacionales en AWS que soporta múltiples motores.' },
  { id: 'd13', term: 'Alta Disponibilidad',  category: 'Arquitectura',     selected: false, definition: 'Capacidad de un sistema para operar continuamente sin fallos durante un período determinado, minimizando el tiempo de inactividad.' },
  { id: 'd14', term: 'Escalabilidad',        category: 'Arquitectura',     selected: false, definition: 'Capacidad de un sistema para manejar una cantidad creciente de trabajo añadiendo recursos de forma proporcional.' },
  { id: 'd15', term: 'Resiliencia',          category: 'Arquitectura',     selected: false, definition: 'Capacidad de un sistema para recuperarse rápidamente de fallos y continuar operando con normalidad.' },
  { id: 'd16', term: 'DevOps',               category: 'Metodologías',     selected: false, definition: 'Conjunto de prácticas que combina desarrollo de software y operaciones de TI para acortar el ciclo de vida del desarrollo.' },
  { id: 'd17', term: 'CI/CD',                category: 'Metodologías',     selected: false, definition: 'Integración Continua / Entrega Continua. Prácticas de automatización para integrar, probar y desplegar código de forma frecuente.' },
  { id: 'd18', term: 'Contenedor',           category: 'Tecnologías',      selected: false, definition: 'Unidad estándar de software que empaqueta código y sus dependencias para que la aplicación se ejecute de forma confiable en cualquier entorno.' },
  { id: 'd19', term: 'Serverless',           category: 'Tecnologías',      selected: false, definition: 'Modelo de ejecución en la nube donde el proveedor gestiona la infraestructura y el desarrollador solo se enfoca en el código.' },
  { id: 'd20', term: 'TCO',                  category: 'Negocio',          selected: false, definition: 'Total Cost of Ownership. Costo total de propiedad que incluye todos los costos directos e indirectos asociados a un activo tecnológico.' },
];

const emptyData = (): TechMemoryData => ({
  projectName: '',
  clientName: '',
  clientUrl: '',
  clientLogoBase64: '',
  swoLogoBase64: '',
  date: new Date().toISOString().split('T')[0],
  authors: '',
  version: '1.0',
  consultorName: '',
  consultorEmail: '',
  consultorSignature: '',
  clientMission: '',
  clientVision: '',
  clientAbout: '',
  introduction: DEFAULT_INTRO,
  infraSummary: DEFAULT_INFRA,
  conclusions: DEFAULT_CONCLUSIONS,
  services: [],
  dictionary: DEFAULT_DICTIONARY,
  wellArch: DEFAULT_WELL_ARCH,
  thankYouLetter: DEFAULT_THANK_YOU,
  itTeam: '',
});

export function TechnicalMemory() {
  const [data, setData] = useState<TechMemoryData>(emptyData());
  const [activeTab, setActiveTab] = useState<'project'|'company'|'services'|'dictionary'|'document'|'wellarch'|'letter'>('project');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [isSearchingAWS, setIsSearchingAWS] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [expandedService, setExpandedService] = useState<string|null>(null);
  const [dictSearch, setDictSearch] = useState('');
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: '' });
  const clientLogoRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof TechMemoryData, value: any) =>
    setData(prev => ({ ...prev, [field]: value }));

  // ── Load SoftwareOne logo ──────────────────────────────────────────────────
  const loadSwoLogo = async () => {
    setIsLoadingLogo(true);
    try {
      const res = await apiClient.get('/api/scraper/softwareone-logo');
      if (res.data.success) set('swoLogoBase64', res.data.data.logo);
      else toast.error('No se pudo cargar el logo de SoftwareOne');
    } catch {
      toast.error('Error al cargar el logo de SoftwareOne');
    } finally { setIsLoadingLogo(false); }
  };

  // ── Client logo upload ─────────────────────────────────────────────────────
  const handleClientLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set('clientLogoBase64', ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── Scrape company info ────────────────────────────────────────────────────
  const scrapeCompany = async () => {
    if (!data.clientUrl.trim()) { toast.error('Ingresa la URL del cliente'); return; }
    setIsSearchingCompany(true);
    toast.loading('Buscando información de la empresa...', { id: 'company-scrape' });
    try {
      const res = await apiClient.post('/api/scraper/company-info', { url: data.clientUrl });
      if (res.data.success) {
        const d = res.data.data;
        setData(prev => ({
          ...prev,
          clientMission: d.mission || prev.clientMission,
          clientVision:  d.vision  || prev.clientVision,
          clientAbout:   d.about   || prev.clientAbout,
          clientName:    prev.clientName || d.name || prev.clientName,
        }));
        toast.success('Información de la empresa obtenida', { id: 'company-scrape' });
      } else {
        toast.error(res.data.error || 'No se pudo obtener la información', { id: 'company-scrape' });
      }
    } catch {
      toast.error('Error al conectar con el servidor', { id: 'company-scrape' });
    } finally { setIsSearchingCompany(false); }
  };

  // ── Search AWS service ─────────────────────────────────────────────────────
  const searchAWSService = async () => {
    if (!serviceSearch.trim()) { toast.error('Ingresa el nombre del servicio AWS'); return; }
    if (data.services.find(s => s.serviceName.toLowerCase() === serviceSearch.toLowerCase())) {
      toast.warning('Este servicio ya fue agregado'); return;
    }
    setIsSearchingAWS(true);
    toast.loading(`Buscando ${serviceSearch} en AWS...`, { id: 'aws-search' });
    try {
      const res = await apiClient.post('/api/scraper/aws-service', { serviceName: serviceSearch });
      if (res.data.success) {
        const d = res.data.data;
        const newSvc: AWSServiceEntry = {
          id: `svc-${Date.now()}`,
          serviceName: serviceSearch,
          title: d.title,
          description: d.description,
          advantages: d.advantages,
          disadvantages: d.disadvantages,
          useCases: d.useCases,
          whyUsed: '',
          docsUrl: d.docsUrl,
        };
        setData(prev => ({ ...prev, services: [...prev.services, newSvc] }));
        setServiceSearch('');
        setExpandedService(newSvc.id);
        toast.success(`${d.title} agregado`, { id: 'aws-search' });
      } else {
        toast.error(res.data.error || 'No se encontró el servicio', { id: 'aws-search' });
      }
    } catch {
      toast.error('Error al buscar el servicio AWS', { id: 'aws-search' });
    } finally { setIsSearchingAWS(false); }
  };

  const removeService = (id: string) =>
    setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));

  const updateService = (id: string, field: keyof AWSServiceEntry, value: any) =>
    setData(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));

  // ── Scrape by URL ──────────────────────────────────────────────────────────
  const scrapeByUrl = async () => {
    if (!serviceUrl.trim()) { toast.error('Ingresa una URL'); return; }
    setIsScrapingUrl(true);
    toast.loading('Extrayendo información de la URL...', { id: 'url-scrape' });
    try {
      const res = await apiClient.post('/api/scraper/by-url', { url: serviceUrl });
      if (res.data.success) {
        const d = res.data.data;
        const newSvc: AWSServiceEntry = {
          id: `svc-${Date.now()}`,
          serviceName: d.title,
          title: d.title,
          description: d.description,
          advantages: d.advantages,
          disadvantages: d.disadvantages,
          useCases: d.keyPoints,
          keyPoints: d.keyPoints,
          whyUsed: '',
          docsUrl: serviceUrl,
        };
        setData(prev => ({ ...prev, services: [...prev.services, newSvc] }));
        setServiceUrl('');
        setExpandedService(newSvc.id);
        toast.success(`"${d.title}" agregado desde URL`, { id: 'url-scrape' });
      } else {
        toast.error(res.data.error || 'No se pudo extraer información', { id: 'url-scrape' });
      }
    } catch {
      toast.error('Error al conectar con el servidor', { id: 'url-scrape' });
    } finally { setIsScrapingUrl(false); }
  };

  // ── Dictionary helpers ─────────────────────────────────────────────────────
  const toggleDictEntry = (id: string) =>
    setData(prev => ({
      ...prev,
      dictionary: prev.dictionary.map(d =>
        d.id === id ? { ...d, selected: !d.selected } : d
      ),
    }));

  const addDictEntry = () => {
    if (!newTerm.term.trim() || !newTerm.definition.trim()) {
      toast.error('Ingresa el término y la definición'); return;
    }
    const entry: DictionaryEntry = {
      id: `dict-${Date.now()}`,
      term: newTerm.term.trim(),
      definition: newTerm.definition.trim(),
      category: newTerm.category.trim() || 'Personalizado',
      selected: true,
    };
    setData(prev => ({ ...prev, dictionary: [...prev.dictionary, entry] }));
    setNewTerm({ term: '', definition: '', category: '' });
    toast.success(`"${entry.term}" agregado al diccionario`);
  };

  const removeDictEntry = (id: string) =>
    setData(prev => ({ ...prev, dictionary: prev.dictionary.filter(d => d.id !== id) }));

  const selectedCount = data.dictionary.filter(d => d.selected).length;

  const handleExport = () => {
    if (!data.projectName || !data.clientName) {
      toast.error('Completa el nombre del proyecto y del cliente antes de exportar');
      return;
    }
    exportTechMemoryWord(data);
    toast.success('Documento Word generado correctamente');
  };

  // ── Tabs config ────────────────────────────────────────────────────────────
  const tabs = [
    { id: 'project',    label: 'Proyecto',      icon: <FileText style={{ width: 14, height: 14 }} /> },
    { id: 'company',    label: 'Empresa',        icon: <Building2 style={{ width: 14, height: 14 }} /> },
    { id: 'services',   label: 'Servicios AWS',  icon: <BookOpen style={{ width: 14, height: 14 }} /> },
    { id: 'dictionary', label: `Diccionario${selectedCount > 0 ? ` (${selectedCount})` : ''}`, icon: <Library style={{ width: 14, height: 14 }} /> },
    { id: 'document',   label: 'Documento',      icon: <FileText style={{ width: 14, height: 14 }} /> },
    { id: 'wellarch',   label: 'Recomendaciones', icon: <ShieldCheck style={{ width: 14, height: 14 }} /> },
    { id: 'letter',     label: 'Carta',          icon: <Award style={{ width: 14, height: 14 }} /> },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{ background: GRADIENT, borderRadius: 10, padding: '16px 22px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 8, display: 'flex' }}>
            <BookOpen style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>Memoria Técnica AWS</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Generación de documentación técnica profesional con normas APA
            </div>
          </div>
        </div>
        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Download style={{ width: 14, height: 14 }} /> Exportar Word
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px',
              borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: activeTab === t.id ? GRADIENT_H : '#f1f5f9',
              color: activeTab === t.id ? '#fff' : '#475569',
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(8,145,178,0.3)' : 'none' }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Proyecto ─────────────────────────────────────────────────── */}
      {activeTab === 'project' && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
          <div style={{ background: GRADIENT, padding: '10px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Información del Proyecto</div>
          </div>
          <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { label: 'Nombre del Proyecto *', field: 'projectName' as const, placeholder: 'ej. Migración AWS — Empresa XYZ' },
              { label: 'Nombre del Cliente *',  field: 'clientName'   as const, placeholder: 'ej. Empresa XYZ S.A.' },
              { label: 'Autores / Elaborado por', field: 'authors'    as const, placeholder: 'ej. Juan Pérez, María García' },
              { label: 'Versión del Documento',   field: 'version'    as const, placeholder: '1.0' },
              { label: 'Nombre del Consultor',    field: 'consultorName' as const, placeholder: 'ej. Juan Pérez' },
              { label: 'Correo del Consultor',    field: 'consultorEmail' as const, placeholder: 'ej. juan.perez@softwareone.com' },
              { label: 'Firma / Cargo',           field: 'consultorSignature' as const, placeholder: 'ej. Arquitecto Cloud Senior' },
            ].map(f => (
              <div key={f.field}>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>{f.label}</label>
                <input value={(data[f.field] as string) || ''} onChange={e => set(f.field, e.target.value)}
                  placeholder={f.placeholder}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec',
                    fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            ))}

            {/* Logos */}
            <div>
              <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>Logo SoftwareOne</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {data.swoLogoBase64
                  ? <img src={data.swoLogoBase64} alt="SWO" style={{ height: 36, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, padding: 4 }} />
                  : <span style={{ fontSize: 11, color: '#94a3b8' }}>No cargado</span>}
                <button onClick={loadSwoLogo} disabled={isLoadingLogo}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7,
                    border: '1px solid #fce4ec', background: '#fce4ec', color: '#e91e8c',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {isLoadingLogo ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <RefreshCw style={{ width: 12, height: 12 }} />}
                  {isLoadingLogo ? 'Cargando...' : 'Obtener de web'}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>Logo del Cliente</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {data.clientLogoBase64
                  ? <img src={data.clientLogoBase64} alt="Cliente" style={{ height: 36, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, padding: 4 }} />
                  : <span style={{ fontSize: 11, color: '#94a3b8' }}>No cargado</span>}
                <button onClick={() => clientLogoRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7,
                    border: '1px solid #fce4ec', background: '#fce4ec', color: '#e91e8c',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  <Upload style={{ width: 12, height: 12 }} /> Subir logo
                </button>
                <input ref={clientLogoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleClientLogo} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: Empresa ──────────────────────────────────────────────────── */}
      {activeTab === 'company' && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
          <div style={{ background: GRADIENT, padding: '10px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Información de la Empresa Cliente</div>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>
                URL del sitio web del cliente *
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={data.clientUrl} onChange={e => set('clientUrl', e.target.value)}
                  placeholder="ej. https://www.empresa.com"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none' }} />
                <button onClick={scrapeCompany} disabled={isSearchingCompany}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 7,
                    border: 'none', background: GRADIENT_H, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {isSearchingCompany ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Search style={{ width: 13, height: 13 }} />}
                  {isSearchingCompany ? 'Buscando...' : 'Buscar en web'}
                </button>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                Se extraerá automáticamente la misión y visión del sitio web del cliente.
              </div>
            </div>

            {[
              { label: 'Misión', field: 'clientMission' as const },
              { label: 'Visión', field: 'clientVision' as const },
              { label: 'Acerca de la Empresa', field: 'clientAbout' as const },
            ].map(f => (
              <div key={f.field}>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4, fontWeight: 600 }}>{f.label}</label>
                <textarea value={data[f.field] as string} onChange={e => set(f.field, e.target.value)}
                  rows={4} placeholder={`${f.label} de la empresa (editable)`}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec',
                    fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: Servicios AWS ────────────────────────────────────────────── */}
      {activeTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search bar */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
            <div style={{ background: GRADIENT, padding: '10px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Buscar Servicio AWS</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Busca en la documentación oficial de AWS y agrega al documento
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Buscar por nombre */}
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  Buscar por nombre de servicio AWS
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={serviceSearch} onChange={e => setServiceSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchAWSService()}
                    placeholder="ej. Amazon S3, AWS Lambda, Amazon RDS, Amazon EC2..."
                    style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #fce4ec',
                      fontSize: 13, outline: 'none' }} />
                  <button onClick={searchAWSService} disabled={isSearchingAWS}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8,
                      border: 'none', background: isSearchingAWS ? '#f1f5f9' : GRADIENT_H,
                      color: isSearchingAWS ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {isSearchingAWS ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Search style={{ width: 14, height: 14 }} />}
                    {isSearchingAWS ? 'Buscando...' : 'Buscar en AWS'}
                  </button>
                </div>
              </div>
              {/* Buscar por URL */}
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  O pega una URL y extrae automáticamente
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={serviceUrl} onChange={e => setServiceUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && scrapeByUrl()}
                    placeholder="ej. https://aws.amazon.com/s3/ o cualquier URL de documentación..."
                    style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #fce4ec',
                      fontSize: 13, outline: 'none' }} />
                  <button onClick={scrapeByUrl} disabled={isScrapingUrl}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8,
                      border: 'none', background: isScrapingUrl ? '#f1f5f9' : GRADIENT_H,
                      color: isScrapingUrl ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {isScrapingUrl ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Link style={{ width: 14, height: 14 }} />}
                    {isScrapingUrl ? 'Extrayendo...' : 'Extraer de URL'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Services list */}
          {data.services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8',
              background: '#fff', borderRadius: 10, border: '1px dashed #fce4ec' }}>
              <BookOpen style={{ width: 40, height: 40, margin: '0 auto 12px', color: '#fce4ec' }} />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e91e8c', marginBottom: 4 }}>
                No hay servicios agregados
              </div>
              <div style={{ fontSize: 12 }}>Busca un servicio AWS para comenzar</div>
            </div>
          ) : (
            data.services.map(svc => (
              <div key={svc.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
                <div style={{ background: GRADIENT_H, padding: '10px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{svc.title}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', background: 'rgba(255,255,255,0.15)',
                      borderRadius: 10, padding: '1px 8px' }}>{svc.serviceName}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setExpandedService(expandedService === svc.id ? null : svc.id)}
                      style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                        padding: '4px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                      {expandedService === svc.id ? <ChevronUp style={{ width: 14, height: 14 }} /> : <ChevronDown style={{ width: 14, height: 14 }} />}
                    </button>
                    <button onClick={() => removeService(svc.id)}
                      style={{ background: 'rgba(255,100,100,0.3)', border: 'none', borderRadius: 6,
                        padding: '4px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>

                {expandedService === svc.id && (
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Descripción (editable)</label>
                      <textarea value={svc.description} onChange={e => updateService(svc.id, 'description', e.target.value)}
                        rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0',
                          fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                        ¿Por qué se usa este servicio en el proyecto? *
                      </label>
                      <textarea value={svc.whyUsed} onChange={e => updateService(svc.id, 'whyUsed', e.target.value)}
                        rows={3} placeholder="Describe la justificación técnica de este servicio en el contexto del proyecto..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec',
                          fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Ventajas</label>
                        {svc.advantages.map((adv, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                            <input value={adv} onChange={e => {
                              const arr = [...svc.advantages]; arr[i] = e.target.value;
                              updateService(svc.id, 'advantages', arr);
                            }} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }} />
                            <button onClick={() => updateService(svc.id, 'advantages', svc.advantages.filter((_, j) => j !== i))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => updateService(svc.id, 'advantages', [...svc.advantages, ''])}
                          style={{ fontSize: 11, color: '#e91e8c', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Plus style={{ width: 11, height: 11 }} /> Agregar ventaja
                        </button>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>Desventajas</label>
                        {svc.disadvantages.map((dis, i) => (
                          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                            <input value={dis} onChange={e => {
                              const arr = [...svc.disadvantages]; arr[i] = e.target.value;
                              updateService(svc.id, 'disadvantages', arr);
                            }} style={{ flex: 1, padding: '5px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11, outline: 'none' }} />
                            <button onClick={() => updateService(svc.id, 'disadvantages', svc.disadvantages.filter((_, j) => j !== i))}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                              <Trash2 style={{ width: 12, height: 12 }} />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => updateService(svc.id, 'disadvantages', [...svc.disadvantages, ''])}
                          style={{ fontSize: 11, color: '#e91e8c', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Plus style={{ width: 11, height: 11 }} /> Agregar desventaja
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>
                      Fuente: <a href={svc.docsUrl} target="_blank" rel="noreferrer" style={{ color: '#9c27b0' }}>{svc.docsUrl}</a>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAB: Diccionario ──────────────────────────────────────────────── */}
      {activeTab === 'dictionary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Agregar término nuevo */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
            <div style={{ background: GRADIENT, padding: '10px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Agregar Término al Diccionario</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                Los términos seleccionados se incluyen automáticamente en el Word como Glosario
              </div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 4 }}>Término *</label>
                <input value={newTerm.term} onChange={e => setNewTerm(p => ({ ...p, term: e.target.value }))}
                  placeholder="ej. Kubernetes"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 4 }}>Categoría</label>
                <input value={newTerm.category} onChange={e => setNewTerm(p => ({ ...p, category: e.target.value }))}
                  placeholder="ej. Tecnologías"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 4 }}>Definición *</label>
                <input value={newTerm.definition} onChange={e => setNewTerm(p => ({ ...p, definition: e.target.value }))}
                  placeholder="Definición del término..."
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button onClick={addDictEntry}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 7,
                  border: 'none', background: GRADIENT_H, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <Plus style={{ width: 13, height: 13 }} /> Agregar
              </button>
            </div>
          </div>

          {/* Filtro y lista */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #fce4ec', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search style={{ width: 14, height: 14, color: '#9c27b0' }} />
              <input value={dictSearch} onChange={e => setDictSearch(e.target.value)}
                placeholder="Filtrar términos..."
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, color: '#374151' }} />
              <span style={{ fontSize: 11, color: '#9c27b0', fontWeight: 600, background: '#f3e8ff', borderRadius: 10, padding: '2px 10px' }}>
                {selectedCount} seleccionados → Word
              </span>
            </div>

            {/* Group by category */}
            {(() => {
              const filtered = data.dictionary.filter(d =>
                !dictSearch || d.term.toLowerCase().includes(dictSearch.toLowerCase()) ||
                d.definition.toLowerCase().includes(dictSearch.toLowerCase()) ||
                d.category.toLowerCase().includes(dictSearch.toLowerCase())
              );
              const categories = [...new Set(filtered.map(d => d.category || 'General'))];
              return categories.map(cat => (
                <div key={cat}>
                  <div style={{ padding: '6px 16px', background: '#f3e8ff', fontSize: 11, fontWeight: 700, color: '#7b2ff7', borderBottom: '1px solid #fce4ec' }}>
                    {cat}
                  </div>
                  {filtered.filter(d => (d.category || 'General') === cat).map((entry, i) => (
                    <div key={entry.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
                        borderBottom: '1px solid #fce4ec', background: i % 2 === 0 ? '#fff' : '#fdf4ff',
                        transition: 'background 0.1s', cursor: 'pointer' }}
                      onClick={() => toggleDictEntry(entry.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f3e8ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fdf4ff')}>
                      <div style={{ flexShrink: 0, marginTop: 2, color: entry.selected ? '#e91e8c' : '#d1d5db' }}>
                        {entry.selected
                          ? <CheckSquare style={{ width: 16, height: 16 }} />
                          : <Square style={{ width: 16, height: 16 }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: entry.selected ? '#e91e8c' : '#0f172a' }}>
                          {entry.term}
                        </div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 1.5 }}>
                          {entry.definition}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); removeDictEntry(entry.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: 4 }}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  ))}
                </div>
              ));
            })()}
          </div>

          <div style={{ fontSize: 11, color: '#9c27b0', padding: '8px 12px', background: '#f3e8ff', borderRadius: 8, border: '1px solid #fce4ec' }}>
            Haz clic en cualquier término para seleccionarlo/deseleccionarlo. Los términos seleccionados aparecerán en la sección "Glosario" del documento Word exportado.
          </div>
        </div>
      )}

      {/* ── TAB: Documento ────────────────────────────────────────────────── */}
      {activeTab === 'document' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Introducción', field: 'introduction' as const, rows: 10,
              hint: 'Describe el contexto del proyecto, objetivos y alcance. Usa [NOMBRE_EMPRESA], [CONSULTOR], [CORREO] como marcadores.' },
            { label: 'Resumen de la Infraestructura', field: 'infraSummary' as const, rows: 8,
              hint: 'Describe la arquitectura implementada, ambientes, VPCs y componentes clave.' },
            { label: 'Conclusiones', field: 'conclusions' as const, rows: 8,
              hint: 'Resume los logros, beneficios obtenidos y recomendaciones finales.' },
          ].map(f => (
            <div key={f.field} style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
              <div style={{ background: GRADIENT, padding: '10px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{f.label}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{f.hint}</div>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <textarea value={data[f.field] as string} onChange={e => set(f.field, e.target.value)}
                  rows={f.rows}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: '"Times New Roman", serif', lineHeight: 1.8 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Well-Architected ─────────────────────────────────────────── */}
      {activeTab === 'wellarch' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 16px', background: '#f3e8ff', borderRadius: 8, border: '1px solid #fce4ec', fontSize: 12, color: '#7b2ff7' }}>
            <strong>AWS Well-Architected Framework</strong> — Edita las recomendaciones por pilar. Todas se incluirán en el documento Word exportado.
          </div>
          {data.wellArch.map(pillar => (
            <div key={pillar.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
              <div style={{ background: pillar.color, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{pillar.icon}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{pillar.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 8px' }}>
                  {pillar.recommendations.length} recomendaciones
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pillar.recommendations.map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: pillar.color, fontWeight: 700, fontSize: 13, marginTop: 7, flexShrink: 0 }}>•</span>
                    <input value={rec}
                      onChange={e => {
                        const recs = [...pillar.recommendations]; recs[i] = e.target.value;
                        setData(prev => ({ ...prev, wellArch: prev.wellArch.map(p => p.id === pillar.id ? { ...p, recommendations: recs } : p) }));
                      }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none' }} />
                    <button onClick={() => {
                      const recs = pillar.recommendations.filter((_, j) => j !== i);
                      setData(prev => ({ ...prev, wellArch: prev.wellArch.map(p => p.id === pillar.id ? { ...p, recommendations: recs } : p) }));
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, flexShrink: 0 }}>
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ))}
                <button onClick={() => {
                  setData(prev => ({ ...prev, wellArch: prev.wellArch.map(p => p.id === pillar.id ? { ...p, recommendations: [...p.recommendations, ''] } : p) }));
                }} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: pillar.color, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                  <Plus style={{ width: 11, height: 11 }} /> Agregar recomendación
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: Carta ────────────────────────────────────────────────────── */}
      {activeTab === 'letter' && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
          <div style={{ background: GRADIENT, padding: '10px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Carta de Agradecimiento</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
              Editable — se incluirá al final del documento Word
            </div>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Equipo de TI Involucrado
              </label>
              <input value={data.itTeam} onChange={e => set('itTeam', e.target.value)}
                placeholder="ej. Equipo de Infraestructura y Arquitectura Cloud — Empresa XYZ"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                Contenido de la Carta
              </label>
              <textarea value={data.thankYouLetter} onChange={e => set('thankYouLetter', e.target.value)}
                rows={14}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: '"Times New Roman", serif', lineHeight: 1.8 }} />
            </div>
            <div style={{ padding: '12px 16px', background: '#fce4ec', borderRadius: 8, border: '1px solid #fce4ec',
              fontSize: 11, color: '#7b1fa2' }}>
              La carta incluirá automáticamente los logos de SoftwareOne y del cliente, el nombre de la empresa y la fecha de generación.
            </div>
          </div>
        </div>
      )}

      {/* Bottom export button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
        <button onClick={handleExport}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
            borderRadius: 9, border: 'none', background: GRADIENT,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(8,145,178,0.35)' }}>
          <Download style={{ width: 16, height: 16 }} />
          Exportar Memoria Técnica (Word — APA)
        </button>
      </div>
    </div>
  );
}
