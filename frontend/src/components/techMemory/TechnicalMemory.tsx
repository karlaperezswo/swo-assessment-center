import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { TechMemoryData, AWSServiceEntry, DictionaryEntry, WellArchPillar } from './types';
import { exportTechMemoryWord } from './wordExporter';
import {
  Search, Plus, Trash2, Download, Upload, RefreshCw,
  BookOpen, Building2, FileText, Award, ChevronDown, ChevronUp, Loader2,
  Link, Library, CheckSquare, Square, ShieldCheck, Eye, X
} from 'lucide-react';

const DICT_STORAGE_KEY = 'tm_dictionary_v1';

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

const STORAGE_KEY = 'tm_dictionary_v1';

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
  dictCategories: [],
  wellArch: DEFAULT_WELL_ARCH,
  thankYouLetter: DEFAULT_THANK_YOU,
  thankYouDate: new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }),
  itTeam: '',
});

// Carga el diccionario guardado en localStorage (persiste entre sesiones)
function loadSavedDictionary(): { dictionary: DictionaryEntry[]; dictCategories: any[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { dictionary: DEFAULT_DICTIONARY, dictCategories: [] };
}

export function TechnicalMemory() {
  const [data, setData] = useState<TechMemoryData>(() => {
    const base = emptyData();
    const saved = loadSavedDictionary();
    return { ...base, dictionary: saved.dictionary, dictCategories: saved.dictCategories };
  });
  const [activeTab, setActiveTab] = useState<'project'|'company'|'services'|'dictionary'|'document'|'wellarch'|'letter'>('project');
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceUrl, setServiceUrl] = useState('');
  const [freeQuery, setFreeQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryFuente, setQueryFuente] = useState<'aws'|'web'>('aws');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [exploringUrl, setExploringUrl] = useState<string | null>(null);
  const [exploredPage, setExploredPage] = useState<any>(null);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [expandedPageSections, setExpandedPageSections] = useState<Set<number>>(new Set());
  const [isSearchingAWS, setIsSearchingAWS] = useState(false);
  const [isScrapingUrl, setIsScrapingUrl] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [expandedService, setExpandedService] = useState<string|null>(null);
  const [searchPreview, setSearchPreview] = useState<any>(null); // resultado previo antes de agregar
  const [urlPreview, setUrlPreview] = useState<any>(null);       // resultado de extracción de URL
  const [urlCacheList, setUrlCacheList] = useState<string[]>(    // cache local de URLs consultadas
    () => { try { return JSON.parse(localStorage.getItem('tm_url_cache') || '[]'); } catch { return []; } }
  );
  const [dictSearch, setDictSearch] = useState('');
  const [newTerm, setNewTerm] = useState({ term: '', definition: '', category: '' });
  const [dictPage, setDictPage] = useState(1);
  const [dictCatFilter, setDictCatFilter] = useState<string>('');
  const [dictViewEntry, setDictViewEntry] = useState<DictionaryEntry | null>(null); // entrada en vista detalle
  const DICT_PAGE_SIZE = 6;
  const clientLogoRef = useRef<HTMLInputElement>(null);

  // ── Persistencia automática del diccionario ────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        dictionary: data.dictionary,
        dictCategories: data.dictCategories,
      }));
    } catch {}
  }, [data.dictionary, data.dictCategories]);

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

  // ── Search AWS service — muestra preview antes de agregar ─────────────────
  const searchAWSService = async () => {
    if (!serviceSearch.trim()) { toast.error('Ingresa el nombre del servicio AWS'); return; }
    setIsSearchingAWS(true);
    setSearchPreview(null);
    toast.loading(`Buscando en docs.aws.amazon.com...`, { id: 'aws-search' });
    try {
      const res = await apiClient.post('/api/scraper/aws-service', { serviceName: serviceSearch });
      if (res.data.success) {
        const d = res.data.data;
        if (d.error) { toast.error(d.error, { id: 'aws-search' }); return; }
        setSearchPreview({ ...d, _searchTerm: serviceSearch });
        toast.success(`Informacion encontrada - revisa y agrega al documento`, { id: 'aws-search' });
      } else {
        toast.error(res.data.error || 'Error de sincronizacion con la fuente oficial. Por favor, verifica el nombre del servicio.', { id: 'aws-search' });
      }
    } catch {
      toast.error('Error de sincronizacion con la fuente oficial. Por favor, verifica el nombre del servicio.', { id: 'aws-search' });
    } finally { setIsSearchingAWS(false); }
  };

  const addServiceFromPreview = () => {
    if (!searchPreview) return;
    const d = searchPreview;
    if (data.services.find(s => s.serviceName.toLowerCase() === (d._searchTerm || d.title).toLowerCase())) {
      toast.warning('Este servicio ya fue agregado'); return;
    }
    const newSvc: AWSServiceEntry = {
      id: `svc-${Date.now()}`,
      serviceName: d._searchTerm || d.title,
      title: d.title,
      description: d.summary || d.description || '',
      advantages: d.features || d.advantages || [],
      disadvantages: d.disadvantages || [],
      useCases: d.useCases || [],
      keyPoints: d.useCases || [],
      whyUsed: '',
      docsUrl: d.docsUrl || '',
      summary: d.summary,
      features: d.features,
      security: d.security,
      cost: d.cost,
      quotas: d.quotas,
    };
    const dictEntry: DictionaryEntry = {
      id: `dict-svc-${Date.now()}`,
      term: d.title,
      definition: (d.summary || d.description || '').slice(0, 300),
      category: 'Servicios AWS',
      selected: false,
    };
    setData(prev => ({
      ...prev,
      services: [...prev.services, newSvc],
      dictionary: prev.dictionary.some(e => e.term.toLowerCase() === d.title.toLowerCase())
        ? prev.dictionary : [...prev.dictionary, dictEntry],
    }));
    setSearchPreview(null);
    setServiceSearch('');
    setExpandedService(newSvc.id);
    toast.success(`${d.title} agregado al documento`);
  };


  const removeService = (id: string) =>
    setData(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));

  const updateService = (id: string, field: keyof AWSServiceEntry, value: any) =>
    setData(prev => ({
      ...prev,
      services: prev.services.map(s => s.id === id ? { ...s, [field]: value } : s),
    }));

  // ── Extraer por URL — muestra preview + alimenta diccionario ─────────────
  const scrapeByUrl = async (forceRefresh = false) => {
    if (!serviceUrl.trim()) { toast.error('Ingresa una URL'); return; }
    if (!serviceUrl.startsWith('http')) { toast.error('La URL debe comenzar con http:// o https://'); return; }
    setIsScrapingUrl(true);
    setUrlPreview(null);
    toast.loading('Conectando y extrayendo información...', { id: 'url-scrape' });
    try {
      const res = await apiClient.get('/api/scraper/extraer', {
        params: { url: serviceUrl, force: forceRefresh ? '1' : '0' },
      });
      if (res.data) {
        const d = res.data;
        setUrlPreview({ ...d, _sourceUrl: serviceUrl });
        const cacheMsg = d.fromCache ? ' (desde caché)' : '';
        toast.success(`Información extraída${cacheMsg} — revisa y guarda`, { id: 'url-scrape' });

        // Guardar URL en cache local del navegador
        const cached = JSON.parse(localStorage.getItem('tm_url_cache') || '[]') as string[];
        if (!cached.includes(serviceUrl)) {
          const updated = [serviceUrl, ...cached].slice(0, 20);
          localStorage.setItem('tm_url_cache', JSON.stringify(updated));
          setUrlCacheList(updated);
        }
      } else {
        toast.error('No se pudo extraer información de la URL', { id: 'url-scrape' });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Error al conectar con el servidor';
      toast.error(msg, { id: 'url-scrape' });
    } finally { setIsScrapingUrl(false); }
  };

  // Agregar contenido de URL al documento y al diccionario
  const addUrlToDocument = () => {
    if (!urlPreview) return;
    const d = urlPreview;
    const newSvc: AWSServiceEntry = {
      id: `svc-${Date.now()}`,
      serviceName: d.title,
      title: d.title,
      description: d.description,
      advantages: d.keyPoints || [],
      disadvantages: ['Verificar compatibilidad con el entorno del proyecto.'],
      useCases: (d.sections || []).slice(0, 4).map((s: any) => s.heading).filter(Boolean),
      keyPoints: d.keyPoints || [],
      whyUsed: '',
      docsUrl: d.docsUrl || d._sourceUrl,
    };
    // Auto-alimentar diccionario con términos clave extraídos
    const newDictEntries: DictionaryEntry[] = (d.keyTerms || [])
      .filter((kt: any) => !data.dictionary.some(e => e.term.toLowerCase() === kt.term.toLowerCase()))
      .map((kt: any, i: number) => ({
        id: `dict-url-${Date.now()}-${i}`,
        term: kt.term,
        definition: kt.context || `Término extraído de: ${d.docsUrl || d._sourceUrl}`,
        category: 'Extraído de URL',
        selected: false,
      }));

    setData(prev => ({
      ...prev,
      services: [...prev.services, newSvc],
      dictionary: [...prev.dictionary, ...newDictEntries],
    }));
    setUrlPreview(null);
    setServiceUrl('');
    setExpandedService(newSvc.id);
    toast.success(`"${d.title}" agregado — ${newDictEntries.length} términos al diccionario`);
  };

  // ── Consulta libre en lenguaje natural ────────────────────────────────────
  const runFreeQuery = async () => {
    if (!freeQuery.trim()) { toast.error('Escribe una consulta'); return; }
    setIsQuerying(true);
    setQueryResult(null);
    toast.loading('Consultando documentación oficial...', { id: 'free-query' });
    try {
      const res = await apiClient.get('/api/scraper/consulta', {
        params: { q: freeQuery, fuente: queryFuente },
      });
      if (res.data.error && !res.data.summary) {
        toast.error(res.data.error, { id: 'free-query' });
      } else {
        setQueryResult(res.data);
        setExpandedSections(new Set());
        toast.success('Consulta completada', { id: 'free-query' });
      }
    } catch {
      toast.error('Error al consultar. Verifica que el Python API esté corriendo.', { id: 'free-query' });
    } finally { setIsQuerying(false); }
  };

  // ── Explorar página completa al hacer clic en una URL ─────────────────────
  const explorePage = async (url: string) => {
    setExploringUrl(url);
    setExploredPage(null);
    setExpandedPageSections(new Set());
    setIsLoadingPage(true);
    toast.loading('Cargando página...', { id: 'explore-page' });
    try {
      const res = await apiClient.get('/api/scraper/leer-pagina', { params: { url } });
      setExploredPage({ ...res.data, _url: url });
      toast.success('Página cargada', { id: 'explore-page' });
    } catch {
      toast.error('No se pudo cargar la página', { id: 'explore-page' });
      setExploringUrl(null);
    } finally { setIsLoadingPage(false); }
  };

  // ── Agregar consulta al diccionario — detección automática de servicio ───────
  const addQueryToDictionary = (withImages = false) => {
    if (!queryResult) return;

    const query = queryResult.query.toLowerCase();
    const summary = queryResult.summary || queryResult.allContent || '';

    // 1. Detectar a qué servicio/entrada del diccionario corresponde
    //    Busca por: nombre del servicio en la query, en el título del resultado,
    //    o en las categorías existentes
    const findMatchingEntry = (): DictionaryEntry | null => {
      // Palabras clave de la query (ignorar palabras comunes)
      const stopWords = new Set(['como', 'que', 'de', 'en', 'el', 'la', 'los', 'las', 'un', 'una',
        'con', 'para', 'por', 'del', 'al', 'se', 'es', 'son', 'hay', 'tiene', 'usar', 'usar',
        'configurar', 'crear', 'ver', 'buscar', 'traer', 'mostrar', 'listar', 'obtener',
        'cuales', 'cuáles', 'cuántos', 'límites', 'limites', 'últimas', 'ultimas', 'actualizaciones']);

      const queryWords = query.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

      // Buscar en el diccionario existente
      let bestMatch: DictionaryEntry | null = null;
      let bestScore = 0;

      data.dictionary.forEach(entry => {
        const entryText = `${entry.term} ${entry.definition} ${entry.category}`.toLowerCase();
        let score = 0;
        queryWords.forEach(word => {
          if (entryText.includes(word)) score++;
        });
        // Bonus si el término del diccionario aparece en el resumen
        if (summary.toLowerCase().includes(entry.term.toLowerCase())) score += 3;
        if (score > bestScore) { bestScore = score; bestMatch = entry; }
      });

      return bestScore >= 2 ? bestMatch : null;
    };

    const matchedEntry = findMatchingEntry();

    // 2. Construir el contenido enriquecido
    const newContent = [
      summary.slice(0, 400),
      ...(queryResult.keyPoints || []).slice(0, 5),
    ].filter(Boolean).join('\n• ');

    const firstImage = withImages && (queryResult.images || []).length > 0
      ? queryResult.images[0] : undefined;

    if (matchedEntry) {
      // Enriquecer la entrada existente
      const enriched: DictionaryEntry = {
        ...matchedEntry,
        definition: matchedEntry.definition.length < 400
          ? `${matchedEntry.definition}\n\n📌 ${queryResult.query}:\n${newContent.slice(0, 300)}`
          : matchedEntry.definition,
        imageBase64: firstImage || matchedEntry.imageBase64,
      };
      setData(prev => ({
        ...prev,
        dictionary: prev.dictionary.map(d => d.id === matchedEntry.id ? enriched : d),
      }));
      toast.success(`✅ Información agregada a "${matchedEntry.term}" en el diccionario`);
    } else {
      // Detectar categoría automáticamente por el contenido
      const detectCategory = (): string => {
        const text = `${query} ${summary}`.toLowerCase();
        if (/s3|storage|bucket|almacen/.test(text)) return 'AWS Storage';
        if (/lambda|function|serverless|funcion/.test(text)) return 'AWS Compute';
        if (/ec2|instancia|instance|servidor/.test(text)) return 'AWS Compute';
        if (/rds|database|base de datos|mysql|postgres|aurora/.test(text)) return 'AWS Database';
        if (/iam|rol|policy|permiso|acceso|seguridad/.test(text)) return 'AWS Security';
        if (/vpc|red|network|subnet|routing/.test(text)) return 'AWS Networking';
        if (/cloudwatch|monitor|log|metric/.test(text)) return 'AWS Monitoring';
        if (/bedrock|sagemaker|ai|ml|machine learning/.test(text)) return 'AWS AI/ML';
        if (/eks|ecs|container|docker|kubernetes/.test(text)) return 'AWS Containers';
        if (/cloudfront|cdn|distribution/.test(text)) return 'AWS CDN';
        return 'Consultas AWS';
      };

      // Crear entrada nueva con el término más relevante de la query
      const termWords = query.split(/\s+/).filter(w => w.length > 3);
      const term = termWords.slice(0, 4).join(' ').slice(0, 60) || queryResult.query.slice(0, 60);

      const newEntry: DictionaryEntry = {
        id: `dict-q-${Date.now()}`,
        term,
        definition: newContent.slice(0, 500),
        category: detectCategory(),
        selected: false,
        imageBase64: firstImage,
      };

      // También agregar secciones importantes como sub-entradas
      const subEntries: DictionaryEntry[] = (queryResult.sections || [])
        .filter((s: any) => s.heading && s.content?.trim().length > 30)
        .slice(0, 3)
        .map((s: any, i: number) => ({
          id: `dict-q-sub-${Date.now()}-${i}`,
          term: s.heading.slice(0, 60),
          definition: s.content.trim().slice(0, 300),
          category: detectCategory(),
          selected: false,
        }));

      const allNew = [newEntry, ...subEntries].filter(
        e => !data.dictionary.some(d => d.term.toLowerCase() === e.term.toLowerCase())
      );

      setData(prev => ({ ...prev, dictionary: [...prev.dictionary, ...allNew] }));
      toast.success(`✅ ${allNew.length} entradas nuevas agregadas al diccionario en "${newEntry.category}"`);
    }
  };
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

  const clearAllDict = () => {
    if (window.confirm('¿Borrar todo el diccionario? Esta acción no se puede deshacer.')) {
      setData(prev => ({ ...prev, dictionary: [], dictCategories: [] }));
      setDictPage(1);
    }
  };

  const setCategoryImage = (catName: string, imageBase64: string | undefined) =>
    setData(prev => {
      const existing = prev.dictCategories.find(c => c.name === catName);
      if (existing) {
        return { ...prev, dictCategories: prev.dictCategories.map(c => c.name === catName ? { ...c, imageBase64 } : c) };
      }
      return { ...prev, dictCategories: [...prev.dictCategories, { name: catName, imageBase64 }] };
    });

  const getCategoryImage = (catName: string) =>
    data.dictCategories.find(c => c.name === catName)?.imageBase64;

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
                  <button onClick={() => scrapeByUrl()} disabled={isScrapingUrl}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8,
                      border: 'none', background: isScrapingUrl ? '#f1f5f9' : GRADIENT_H,
                      color: isScrapingUrl ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {isScrapingUrl ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Link style={{ width: 14, height: 14 }} />}
                    {isScrapingUrl ? 'Extrayendo...' : 'Extraer de URL'}
                  </button>
                </div>
              </div>
              {/* Consulta libre en lenguaje natural */}
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  Consulta en lenguaje natural
                </label>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>
                  Ej: "límites de concurrencia de Lambda", "política de ciclo de vida S3 con JSON", "últimas actualizaciones de Bedrock"
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={freeQuery} onChange={e => setFreeQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runFreeQuery()}
                    placeholder="Escribe tu consulta sobre AWS..."
                    style={{ flex: 1, minWidth: 200, padding: '9px 14px', borderRadius: 8, border: '1px solid #fce4ec', fontSize: 13, outline: 'none' }} />
                  <select value={queryFuente} onChange={e => setQueryFuente(e.target.value as 'aws'|'web')}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #fce4ec', fontSize: 12, color: '#9c27b0', outline: 'none', background: '#fff' }}>
                    <option value="aws">📄 Docs AWS</option>
                    <option value="web">🌐 Web general</option>
                  </select>
                  <button onClick={runFreeQuery} disabled={isQuerying}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8,
                      border: 'none', background: isQuerying ? '#f1f5f9' : GRADIENT_H,
                      color: isQuerying ? '#94a3b8' : '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {isQuerying ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Search style={{ width: 14, height: 14 }} />}
                    {isQuerying ? 'Consultando...' : 'Consultar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel resultado de consulta libre */}
          {queryResult && (
            <div style={{ background: '#fff', borderRadius: 10, border: '2px solid #7c3aed', overflow: 'hidden' }}>
              <div style={{ background: GRADIENT, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>🔍 {queryResult.query}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                    {queryResult.fuente === 'aws' ? '📄 docs.aws.amazon.com' : '🌐 Búsqueda web'} · {(queryResult.sections || []).length} secciones · {(queryResult.images || []).length} imágenes
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button onClick={() => addQueryToDictionary(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7,
                      border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.15)',
                      color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                    <Plus style={{ width: 11, height: 11 }} /> Al diccionario
                  </button>
                  {(queryResult.images || []).length > 0 && (
                    <button onClick={() => addQueryToDictionary(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7,
                        border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.2)',
                        color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      <Upload style={{ width: 11, height: 11 }} /> Con imágenes
                    </button>
                  )}
                  <button onClick={() => setQueryResult(null)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                      padding: '5px 9px', cursor: 'pointer', color: '#fff' }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 600, overflowY: 'auto' }}>
                {/* Resumen */}
                {queryResult.summary && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 5 }}>Resumen</div>
                    <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0 }}>{queryResult.summary}</p>
                  </div>
                )}

                {/* Imágenes encontradas */}
                {(queryResult.images || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                      🖼️ Imágenes encontradas ({queryResult.images.length})
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {queryResult.images.map((imgUrl: string, i: number) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={imgUrl} alt={`img-${i}`}
                            style={{ maxWidth: 140, maxHeight: 100, objectFit: 'cover', borderRadius: 6,
                              border: '1px solid #fce4ec', cursor: 'pointer' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <button
                            onClick={() => {
                              // Agregar imagen al diccionario como entrada
                              const entry: DictionaryEntry = {
                                id: `dict-img-${Date.now()}-${i}`,
                                term: `Imagen: ${queryResult.query.slice(0, 40)}`,
                                definition: `Imagen extraída de: ${imgUrl}`,
                                category: 'Consultas AWS',
                                selected: false,
                                imageBase64: imgUrl,
                              };
                              setData(prev => ({ ...prev, dictionary: [...prev.dictionary, entry] }));
                              toast.success('Imagen agregada al diccionario');
                            }}
                            style={{ position: 'absolute', top: 2, right: 2, background: GRADIENT_H,
                              border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer',
                              color: '#fff', fontSize: 9, fontWeight: 700 }}>
                            + Dict
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Puntos clave */}
                {(queryResult.keyPoints || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 5 }}>Puntos Clave</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {queryResult.keyPoints.map((p: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Secciones completas */}
                {(queryResult.sections || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                      Contenido Completo ({queryResult.sections.length} secciones) — haz clic en el título para expandir
                    </div>
                    {queryResult.sections.map((sec: any, i: number) => {
                      const isExpanded = expandedSections.has(i);
                      const hasContent = sec.content?.trim().length > 0;
                      return (
                        <div key={i} style={{ marginBottom: 4, borderRadius: 8, overflow: 'hidden',
                          border: '1px solid #fce4ec' }}>
                          {/* Título clickeable */}
                          <button
                            onClick={() => {
                              setExpandedSections(prev => {
                                const next = new Set(prev);
                                if (next.has(i)) next.delete(i); else next.add(i);
                                return next;
                              });
                            }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '9px 14px', background: isExpanded ? '#f3e8ff' : '#fdf4ff',
                              border: 'none', cursor: hasContent ? 'pointer' : 'default',
                              textAlign: 'left', transition: 'background 0.15s' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: isExpanded ? '#7c3aed' : '#9c27b0',
                              flex: 1, marginRight: 8 }}>
                              {sec.heading || `Sección ${i + 1}`}
                            </span>
                            <span style={{ fontSize: 10, color: '#c084fc', flexShrink: 0 }}>
                              {isExpanded ? '▲ Cerrar' : '▼ Ver contenido'}
                            </span>
                          </button>
                          {/* Contenido expandido */}
                          {isExpanded && hasContent && (
                            <div style={{ padding: '12px 14px', background: '#fff',
                              borderTop: '1px solid #fce4ec' }}>
                              <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0,
                                whiteSpace: 'pre-wrap' }}>
                                {sec.content.trim()}
                              </p>
                              {/* Botón agregar esta sección al diccionario */}
                              <button
                                onClick={() => {
                                  const entry: DictionaryEntry = {
                                    id: `dict-sec-${Date.now()}-${i}`,
                                    term: (sec.heading || `Sección ${i + 1}`).slice(0, 60),
                                    definition: sec.content.trim().slice(0, 500),
                                    category: 'Consultas AWS',
                                    selected: false,
                                  };
                                  if (!data.dictionary.some(d => d.term.toLowerCase() === entry.term.toLowerCase())) {
                                    setData(prev => ({ ...prev, dictionary: [...prev.dictionary, entry] }));
                                    toast.success(`"${entry.term}" agregado al diccionario`);
                                  } else {
                                    toast.info(`"${entry.term}" ya existe en el diccionario`);
                                  }
                                }}
                                style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 6, border: '1px solid #fce4ec',
                                  background: '#fdf4ff', color: '#9c27b0', fontSize: 10,
                                  fontWeight: 600, cursor: 'pointer' }}>
                                <Plus style={{ width: 10, height: 10 }} /> Agregar al diccionario
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Ejemplos de código */}
                {(queryResult.codeExamples || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 5 }}>Ejemplos de Código</div>
                    {queryResult.codeExamples.map((ex: any, i: number) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div style={{ fontSize: 10, color: '#9c27b0', marginBottom: 3, fontWeight: 600 }}>{ex.language?.toUpperCase()}</div>
                        <pre style={{ background: '#1e1b4b', color: '#e0e7ff', padding: '12px 14px', borderRadius: 8,
                          fontSize: 11, overflowX: 'auto', margin: 0, lineHeight: 1.6 }}>
                          {ex.code}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fuentes — clickeables para explorar */}
                {(queryResult.sources || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                      📄 Páginas encontradas ({queryResult.sources.length}) — haz clic para explorar
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {queryResult.sources.map((url: string, i: number) => {
                        const isExploring = exploringUrl === url;
                        const label = url.replace('https://docs.aws.amazon.com', '').replace('https://aws.amazon.com', '').slice(0, 80) || url;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              onClick={() => explorePage(url)}
                              disabled={isLoadingPage}
                              style={{ flex: 1, textAlign: 'left', padding: '7px 12px', borderRadius: 7,
                                border: `1px solid ${isExploring ? '#7c3aed' : '#fce4ec'}`,
                                background: isExploring ? '#f3e8ff' : '#fdf4ff',
                                color: isExploring ? '#7c3aed' : '#9c27b0',
                                fontSize: 11, cursor: 'pointer', fontWeight: isExploring ? 700 : 400,
                                display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isExploring && isLoadingPage
                                ? <Loader2 style={{ width: 11, height: 11, flexShrink: 0 }} className="animate-spin" />
                                : <Eye style={{ width: 11, height: 11, flexShrink: 0 }} />}
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {label}
                              </span>
                            </button>
                            <a href={url} target="_blank" rel="noreferrer"
                              style={{ fontSize: 10, color: '#c084fc', flexShrink: 0, textDecoration: 'none' }}
                              title="Abrir en nueva pestaña">↗</a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Panel de exploración de página seleccionada */}
                {exploredPage && (
                  <div style={{ borderRadius: 10, border: '2px solid #7c3aed', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ background: 'linear-gradient(90deg,#7c3aed,#9c27b0)', padding: '10px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{exploredPage.title}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>
                          {exploredPage.wordCount} palabras · {(exploredPage.sections || []).length} secciones
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => {
                            const entry: DictionaryEntry = {
                              id: `dict-page-${Date.now()}`,
                              term: exploredPage.title.slice(0, 60),
                              definition: (exploredPage.summary || '').slice(0, 500),
                              category: 'Consultas AWS',
                              selected: false,
                            };
                            if (!data.dictionary.some(d => d.term.toLowerCase() === entry.term.toLowerCase())) {
                              setData(prev => ({ ...prev, dictionary: [...prev.dictionary, entry] }));
                              toast.success(`"${entry.term}" agregado al diccionario`);
                            } else {
                              toast.info('Ya existe en el diccionario');
                            }
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px',
                            borderRadius: 6, border: '1px solid rgba(255,255,255,0.4)',
                            background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          <Plus style={{ width: 11, height: 11 }} /> Al diccionario
                        </button>
                        <button onClick={() => { setExploredPage(null); setExploringUrl(null); }}
                          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                            padding: '5px 9px', cursor: 'pointer', color: '#fff' }}>✕</button>
                      </div>
                    </div>

                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
                      maxHeight: 500, overflowY: 'auto', background: '#fff' }}>
                      {/* Resumen */}
                      {exploredPage.summary && (
                        <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.7, margin: 0,
                          padding: '10px 12px', background: '#fdf4ff', borderRadius: 8, border: '1px solid #fce4ec' }}>
                          {exploredPage.summary}
                        </p>
                      )}

                      {/* Secciones clickeables */}
                      {(exploredPage.sections || []).map((sec: any, i: number) => {
                        const isExp = expandedPageSections.has(i);
                        return (
                          <div key={i} style={{ borderRadius: 7, border: '1px solid #fce4ec', overflow: 'hidden' }}>
                            <button
                              onClick={() => setExpandedPageSections(prev => {
                                const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n;
                              })}
                              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '8px 12px', background: isExp ? '#f3e8ff' : '#fdf4ff',
                                border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: isExp ? '#7c3aed' : '#9c27b0', flex: 1 }}>
                                {sec.heading || `Sección ${i + 1}`}
                              </span>
                              <span style={{ fontSize: 10, color: '#c084fc' }}>{isExp ? '▲' : '▼'}</span>
                            </button>
                            {isExp && sec.content?.trim() && (
                              <div style={{ padding: '10px 12px', background: '#fff', borderTop: '1px solid #fce4ec' }}>
                                <p style={{ fontSize: 11, color: '#374151', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                                  {sec.content.trim()}
                                </p>
                                <button
                                  onClick={() => {
                                    const e: DictionaryEntry = {
                                      id: `dict-ps-${Date.now()}-${i}`,
                                      term: (sec.heading || `Sección ${i + 1}`).slice(0, 60),
                                      definition: sec.content.trim().slice(0, 500),
                                      category: 'Consultas AWS', selected: false,
                                    };
                                    if (!data.dictionary.some(d => d.term.toLowerCase() === e.term.toLowerCase())) {
                                      setData(prev => ({ ...prev, dictionary: [...prev.dictionary, e] }));
                                      toast.success(`"${e.term}" agregado`);
                                    } else { toast.info('Ya existe'); }
                                  }}
                                  style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4,
                                    padding: '4px 10px', borderRadius: 6, border: '1px solid #fce4ec',
                                    background: '#fdf4ff', color: '#9c27b0', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>
                                  <Plus style={{ width: 10, height: 10 }} /> Agregar al diccionario
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Ejemplos de código */}
                      {(exploredPage.codeExamples || []).length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', marginBottom: 6 }}>Ejemplos de Código</div>
                          {exploredPage.codeExamples.map((ex: any, i: number) => (
                            <div key={i} style={{ marginBottom: 8 }}>
                              <div style={{ fontSize: 10, color: '#9c27b0', marginBottom: 3, fontWeight: 600 }}>{ex.language?.toUpperCase()}</div>
                              <pre style={{ background: '#1e1b4b', color: '#e0e7ff', padding: '10px 12px',
                                borderRadius: 8, fontSize: 11, overflowX: 'auto', margin: 0, lineHeight: 1.6 }}>
                                {ex.code}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {searchPreview && (
            <div style={{ background: '#fff', borderRadius: 10, border: '2px solid #e91e8c', overflow: 'hidden' }}>
              {/* Header resultado */}
              <div style={{ background: GRADIENT, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>🛠️ {searchPreview.title}</div>
                  <a href={searchPreview.docsUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>
                    {searchPreview.docsUrl}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={addServiceFromPreview}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7,
                      border: '2px solid #fff', background: 'rgba(255,255,255,0.2)', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus style={{ width: 13, height: 13 }} /> Agregar al documento
                  </button>
                  <button onClick={() => setSearchPreview(null)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                      padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 12 }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. Resumen Técnico */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e91e8c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: GRADIENT_H, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11 }}>1</span>
                    Resumen Técnico
                  </div>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                    {searchPreview.summary || searchPreview.description}
                  </p>
                </div>

                {/* 2. Características */}
                {(searchPreview.features || searchPreview.advantages || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e91e8c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: GRADIENT_H, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11 }}>2</span>
                      Características y Capacidades Clave
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(searchPreview.features || searchPreview.advantages || []).slice(0, 6).map((f: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3. Well-Architected */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {(searchPreview.security || []).length > 0 && (
                    <div style={{ background: '#fdf4ff', borderRadius: 8, padding: '10px 14px', border: '1px solid #fce4ec' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ background: GRADIENT_H, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 10 }}>3</span>
                        🔐 Seguridad
                      </div>
                      {(searchPreview.security || []).slice(0, 3).map((s: string, i: number) => (
                        <div key={i} style={{ fontSize: 11, color: '#374151', marginBottom: 3 }}>• {s}</div>
                      ))}
                    </div>
                  )}
                  {(searchPreview.cost || []).length > 0 && (
                    <div style={{ background: '#fdf4ff', borderRadius: 8, padding: '10px 14px', border: '1px solid #fce4ec' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ background: GRADIENT_H, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 10 }}>3</span>
                        💰 Costos
                      </div>
                      {(searchPreview.cost || []).slice(0, 3).map((c: string, i: number) => (
                        <div key={i} style={{ fontSize: 11, color: '#374151', marginBottom: 3 }}>• {c}</div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Límites y Cuotas */}
                {(searchPreview.quotas || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e91e8c', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: GRADIENT_H, color: '#fff', borderRadius: 4, padding: '1px 8px', fontSize: 11 }}>4</span>
                      Límites y Cuotas (Service Quotas)
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(searchPreview.quotas || []).slice(0, 4).map((q: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ fontSize: 10, color: '#9c27b0', padding: '6px 10px', background: '#fdf4ff', borderRadius: 6, border: '1px solid #fce4ec' }}>
                  Fuente oficial: <a href={searchPreview.docsUrl} target="_blank" rel="noreferrer" style={{ color: '#e91e8c' }}>{searchPreview.docsUrl}</a>
                </div>
              </div>
            </div>
          )}

          {/* Panel preview de URL extraída */}
          {urlPreview && (
            <div style={{ background: '#fff', borderRadius: 10, border: '2px solid #9c27b0', overflow: 'hidden' }}>
              <div style={{ background: GRADIENT, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                    🔗 {urlPreview.title}
                    {urlPreview.fromCache && <span style={{ marginLeft: 8, fontSize: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 8px' }}>⚡ caché</span>}
                  </div>
                  <a href={urlPreview.docsUrl || urlPreview._sourceUrl} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', textDecoration: 'underline' }}>
                    {urlPreview.docsUrl || urlPreview._sourceUrl}
                  </a>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => scrapeByUrl(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6,
                      border: '1px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, cursor: 'pointer' }}>
                    <RefreshCw style={{ width: 11, height: 11 }} /> Actualizar
                  </button>
                  <button onClick={addUrlToDocument}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px', borderRadius: 7,
                      border: '2px solid #fff', background: 'rgba(255,255,255,0.2)', color: '#fff',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus style={{ width: 13, height: 13 }} /> Guardar en documento
                  </button>
                  <button onClick={() => setUrlPreview(null)}
                    style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6,
                      padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 12 }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Descripción */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 5 }}>Descripción</div>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.6, margin: 0 }}>{urlPreview.description}</p>
                </div>

                {/* Puntos clave */}
                {(urlPreview.keyPoints || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 5 }}>Puntos Clave Extraídos</div>
                    <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(urlPreview.keyPoints || []).slice(0, 8).map((p: string, i: number) => (
                        <li key={i} style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Secciones */}
                {(urlPreview.sections || []).length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 5 }}>Secciones del Documento</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(urlPreview.sections || []).slice(0, 10).map((s: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, background: '#f3e8ff', color: '#7b2ff7',
                          border: '1px solid #fce4ec', borderRadius: 12, padding: '2px 10px' }}>
                          {s.heading}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Términos clave → diccionario */}
                {(urlPreview.keyTerms || []).length > 0 && (
                  <div style={{ background: '#fdf4ff', borderRadius: 8, padding: '10px 14px', border: '1px solid #fce4ec' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 6 }}>
                      📚 {urlPreview.keyTerms.length} términos detectados → se agregarán al Diccionario
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {(urlPreview.keyTerms || []).slice(0, 12).map((kt: any, i: number) => (
                        <span key={i} style={{ fontSize: 10, background: '#fff', color: '#e91e8c',
                          border: '1px solid #fce4ec', borderRadius: 10, padding: '2px 8px', fontWeight: 600 }}>
                          {kt.term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* URLs en caché */}
                {urlCacheList.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 5 }}>
                      ⚡ URLs en caché ({urlCacheList.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: 80, overflowY: 'auto' }}>
                      {urlCacheList.slice(0, 5).map((u, i) => (
                        <button key={i} onClick={() => { setServiceUrl(u); }}
                          style={{ textAlign: 'left', fontSize: 10, color: '#7b2ff7', background: 'none',
                            border: 'none', cursor: 'pointer', padding: '2px 0', textDecoration: 'underline',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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

      {/* ── TAB: Diccionario ────────────────────────────────────────────────── */}
      {activeTab === 'dictionary' && (() => {
        // Filtrado
        const allCats = [...new Set(data.dictionary.map(d => d.category || 'General'))];
        const filtered = data.dictionary.filter(d => {
          const matchCat = !dictCatFilter || (d.category || 'General') === dictCatFilter;
          const matchSearch = !dictSearch || d.term.toLowerCase().includes(dictSearch.toLowerCase()) || d.definition.toLowerCase().includes(dictSearch.toLowerCase());
          return matchCat && matchSearch;
        });
        const totalPages = Math.max(1, Math.ceil(filtered.length / DICT_PAGE_SIZE));
        const paginated = filtered.slice((dictPage - 1) * DICT_PAGE_SIZE, dictPage * DICT_PAGE_SIZE);
        const catsByPage = [...new Set(paginated.map(d => d.category || 'General'))];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Barra de control */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
              <div style={{ background: GRADIENT, padding: '10px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                  Base de Conocimiento — {data.dictionary.length} términos · {selectedCount} seleccionados
                </div>
                <button onClick={clearAllDict}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6,
                    border: '1px solid rgba(255,100,100,0.5)', background: 'rgba(255,100,100,0.2)',
                    color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 style={{ width: 12, height: 12 }} /> Borrar todo
                </button>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Search style={{ width: 14, height: 14, color: '#9c27b0', flexShrink: 0 }} />
                <input value={dictSearch} onChange={e => { setDictSearch(e.target.value); setDictPage(1); }}
                  placeholder="Filtrar términos..."
                  style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none', fontSize: 13, color: '#374151' }} />
                <select value={dictCatFilter} onChange={e => { setDictCatFilter(e.target.value); setDictPage(1); }}
                  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 12, color: '#9c27b0', outline: 'none' }}>
                  <option value="">Todas las categorías</option>
                  {allCats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <span style={{ fontSize: 11, color: '#9c27b0', fontWeight: 600, background: '#f3e8ff', borderRadius: 10, padding: '2px 10px' }}>
                  {selectedCount} → Word
                </span>
              </div>
            </div>

            {/* Agregar término */}
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
              <div style={{ background: GRADIENT, padding: '8px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Agregar Término</div>
              </div>
              <div style={{ padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
                <div>
                  <label style={{ fontSize: 10, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 3 }}>Término *</label>
                  <input value={newTerm.term} onChange={e => setNewTerm(p => ({ ...p, term: e.target.value }))}
                    placeholder="ej. Kubernetes"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #fce4ec', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 3 }}>Categoría</label>
                  <input value={newTerm.category} onChange={e => setNewTerm(p => ({ ...p, category: e.target.value }))}
                    placeholder="ej. Tecnologías"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #fce4ec', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, color: '#9c27b0', fontWeight: 600, display: 'block', marginBottom: 3 }}>Definición *</label>
                  <input value={newTerm.definition} onChange={e => setNewTerm(p => ({ ...p, definition: e.target.value }))}
                    placeholder="Definición del término..."
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #fce4ec', fontSize: 12, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <button onClick={addDictEntry}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 7,
                    border: 'none', background: GRADIENT_H, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  <Plus style={{ width: 13, height: 13 }} /> Agregar
                </button>
              </div>
            </div>

            {/* Tarjetas paginadas por categoría */}
            {catsByPage.map(cat => {
              const catEntries = paginated.filter(d => (d.category || 'General') === cat);
              const catImg = getCategoryImage(cat);
              return (
                <div key={cat} style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
                  {/* Header de categoría con imagen */}
                  <div style={{ background: 'linear-gradient(90deg,#e91e8c22,#9c27b022)', padding: '10px 16px',
                    display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #fce4ec' }}>
                    {catImg && <img src={catImg} alt={cat} style={{ height: 36, width: 36, objectFit: 'cover', borderRadius: 6, border: '1px solid #fce4ec' }} />}
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#9c27b0', flex: 1 }}>{cat}</span>
                    {/* Subir imagen de categoría */}
                    <label title="Imagen de categoría (o pega con Ctrl+V)"
                      style={{ cursor: 'pointer', color: catImg ? '#e91e8c' : '#9c27b0', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 600 }}>
                      <Upload style={{ width: 12, height: 12 }} /> {catImg ? 'Cambiar imagen' : 'Agregar imagen'}
                      <input type="file" accept="image/*" style={{ display: 'none' }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => setCategoryImage(cat, ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }} />
                    </label>
                    {catImg && (
                      <button onClick={() => setCategoryImage(cat, undefined)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 10 }}>
                        <Trash2 style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                  </div>

                  {/* Zona paste de imagen */}
                  <div
                    onPaste={e => {
                      const items = Array.from(e.clipboardData.items);
                      const imgItem = items.find(it => it.type.startsWith('image/'));
                      if (imgItem) {
                        const blob = imgItem.getAsFile();
                        if (blob) {
                          const reader = new FileReader();
                          reader.onload = ev => setCategoryImage(cat, ev.target?.result as string);
                          reader.readAsDataURL(blob);
                        }
                      }
                    }}
                    tabIndex={0}
                    style={{ padding: '4px 16px', background: '#fdf4ff', fontSize: 10, color: '#c084fc',
                      borderBottom: '1px solid #fce4ec', outline: 'none', cursor: 'text' }}>
                    📋 Haz clic aquí y pega una imagen con Ctrl+V para esta categoría
                  </div>

                  {/* Entradas */}
                  {catEntries.map((entry, i) => (
                    <div key={entry.id}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
                        borderBottom: '1px solid #fce4ec', background: i % 2 === 0 ? '#fff' : '#fdf4ff' }}>
                      {/* Checkbox */}
                      <div style={{ flexShrink: 0, marginTop: 2, color: entry.selected ? '#e91e8c' : '#d1d5db', cursor: 'pointer' }}
                        onClick={() => toggleDictEntry(entry.id)}>
                        {entry.selected ? <CheckSquare style={{ width: 16, height: 16 }} /> : <Square style={{ width: 16, height: 16 }} />}
                      </div>
                      {/* Contenido */}
                      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => toggleDictEntry(entry.id)}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: entry.selected ? '#e91e8c' : '#0f172a' }}>{entry.term}</div>
                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 1.5 }}>{entry.definition}</div>
                        {entry.imageBase64 && (
                          <img src={entry.imageBase64} alt={entry.term}
                            style={{ marginTop: 6, maxWidth: 160, maxHeight: 100, borderRadius: 6,
                              border: '1px solid #fce4ec', objectFit: 'contain', display: 'block' }} />
                        )}
                      </div>
                      {/* Botón ver detalle */}
                      <button title="Explorar este término" onClick={e => { e.stopPropagation(); setDictViewEntry(entry); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9c27b0', flexShrink: 0, padding: 4 }}>
                        <Eye style={{ width: 13, height: 13 }} />
                      </button>
                      {/* Subir imagen al término */}
                      <label title="Adjuntar imagen al término" style={{ flexShrink: 0, cursor: 'pointer', color: entry.imageBase64 ? '#e91e8c' : '#9c27b0', padding: 4 }}
                        onClick={e => e.stopPropagation()}>
                        <Upload style={{ width: 13, height: 13 }} />
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setData(prev => ({
                              ...prev,
                              dictionary: prev.dictionary.map(d => d.id === entry.id ? { ...d, imageBase64: ev.target?.result as string } : d),
                            }));
                            reader.readAsDataURL(file);
                          }} />
                      </label>
                      {entry.imageBase64 && (
                        <button title="Quitar imagen" onClick={e => { e.stopPropagation();
                          setData(prev => ({ ...prev, dictionary: prev.dictionary.map(d => d.id === entry.id ? { ...d, imageBase64: undefined } : d) }));
                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f59e0b', flexShrink: 0, padding: 4 }}>
                          <Trash2 style={{ width: 11, height: 11 }} />
                        </button>
                      )}
                      {/* Caneca — borrar entrada */}
                      <button title="Eliminar término" onClick={e => { e.stopPropagation(); removeDictEntry(entry.id); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', flexShrink: 0, padding: 4 }}>
                        <Trash2 style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', background: '#fff', borderRadius: 10, border: '1px dashed #fce4ec' }}>
                No hay términos que coincidan con el filtro.
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <button onClick={() => setDictPage(p => Math.max(1, p - 1))} disabled={dictPage === 1}
                  style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #fce4ec', background: dictPage === 1 ? '#f9fafb' : '#fff',
                    color: dictPage === 1 ? '#d1d5db' : '#9c27b0', cursor: dictPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                  ← Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setDictPage(p)}
                    style={{ padding: '6px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: p === dictPage ? GRADIENT_H : '#fff', color: p === dictPage ? '#fff' : '#9c27b0' }}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setDictPage(p => Math.min(totalPages, p + 1))} disabled={dictPage === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #fce4ec', background: dictPage === totalPages ? '#f9fafb' : '#fff',
                    color: dictPage === totalPages ? '#d1d5db' : '#9c27b0', cursor: dictPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Siguiente →
                </button>
                <span style={{ fontSize: 11, color: '#9c27b0' }}>Página {dictPage} de {totalPages} · {filtered.length} términos</span>
              </div>
            )}

            <div style={{ fontSize: 11, color: '#9c27b0', padding: '8px 12px', background: '#f3e8ff', borderRadius: 8, border: '1px solid #fce4ec' }}>
              ✅ El diccionario se guarda automáticamente. Los términos seleccionados aparecen en el Glosario del Word.
            </div>
          </div>
        );
      })()}

      {/* ── Modal de exploración de término ──────────────────────────────── */}
      {dictViewEntry && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setDictViewEntry(null)}>
          <div style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 640,
            maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 8px 40px rgba(233,30,140,0.25)' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ background: GRADIENT, padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{dictViewEntry.term}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {dictViewEntry.category || 'General'} · {dictViewEntry.selected ? '✓ Incluido en Word' : 'No incluido en Word'}
                </div>
              </div>
              <button onClick={() => setDictViewEntry(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                  padding: '6px 10px', cursor: 'pointer', color: '#fff', fontSize: 16 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Contenido scrollable */}
            <div style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Definición */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Definición
                </div>
                <textarea
                  value={dictViewEntry.definition}
                  onChange={e => {
                    const updated = { ...dictViewEntry, definition: e.target.value };
                    setDictViewEntry(updated);
                    setData(prev => ({ ...prev, dictionary: prev.dictionary.map(d => d.id === updated.id ? updated : d) }));
                  }}
                  rows={5}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #fce4ec',
                    fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                    fontFamily: 'inherit', lineHeight: 1.7, color: '#374151' }} />
              </div>

              {/* Imagen */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#9c27b0', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Imagen
                </div>
                {dictViewEntry.imageBase64 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <img src={dictViewEntry.imageBase64} alt={dictViewEntry.term}
                      style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 8,
                        border: '1px solid #fce4ec' }} />
                    <button onClick={() => {
                      const updated = { ...dictViewEntry, imageBase64: undefined };
                      setDictViewEntry(updated);
                      setData(prev => ({ ...prev, dictionary: prev.dictionary.map(d => d.id === updated.id ? updated : d) }));
                    }} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 6, border: '1px solid #fce4ec',
                      background: '#fff', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>
                      <Trash2 style={{ width: 11, height: 11 }} /> Quitar imagen
                    </button>
                  </div>
                ) : (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px',
                    borderRadius: 8, border: '2px dashed #fce4ec', cursor: 'pointer',
                    color: '#9c27b0', fontSize: 12, fontWeight: 600 }}>
                    <Upload style={{ width: 16, height: 16 }} />
                    Subir imagen o pegar con Ctrl+V
                    <input type="file" accept="image/*" style={{ display: 'none' }}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = ev => {
                          const updated = { ...dictViewEntry, imageBase64: ev.target?.result as string };
                          setDictViewEntry(updated);
                          setData(prev => ({ ...prev, dictionary: prev.dictionary.map(d => d.id === updated.id ? updated : d) }));
                        };
                        reader.readAsDataURL(file);
                      }} />
                  </label>
                )}
              </div>

              {/* Acciones */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: '1px solid #fce4ec' }}>
                <button onClick={() => {
                  const updated = { ...dictViewEntry, selected: !dictViewEntry.selected };
                  setDictViewEntry(updated);
                  setData(prev => ({ ...prev, dictionary: prev.dictionary.map(d => d.id === updated.id ? updated : d) }));
                }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', borderRadius: 8, border: '1px solid #fce4ec', cursor: 'pointer',
                  background: dictViewEntry.selected ? GRADIENT_H : '#f3e8ff',
                  color: dictViewEntry.selected ? '#fff' : '#9c27b0', fontSize: 12, fontWeight: 600 }}>
                  {dictViewEntry.selected ? <CheckSquare style={{ width: 14, height: 14 }} /> : <Square style={{ width: 14, height: 14 }} />}
                  {dictViewEntry.selected ? 'Incluido en Word' : 'Incluir en Word'}
                </button>
                <button onClick={() => {
                  if (window.confirm(`¿Eliminar "${dictViewEntry.term}"?`)) {
                    removeDictEntry(dictViewEntry.id);
                    setDictViewEntry(null);
                  }
                }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 16px',
                  borderRadius: 8, border: '1px solid #fce4ec', background: '#fff',
                  color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Trash2 style={{ width: 13, height: 13 }} /> Eliminar
                </button>
              </div>
            </div>
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



      {/* TAB: Carta */}
      {activeTab === 'letter' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
            <div style={{ background: GRADIENT, padding: '10px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Datos de la Carta</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Todos los campos son editables. La fecha se genera automaticamente si no la modificas.</div>
            </div>
            <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>Fecha de la Carta</label>
                <input value={data.thankYouDate} onChange={e => set('thankYouDate', e.target.value)}
                  placeholder="ej. 27 de marzo de 2026"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>Equipo de TI Destinatario</label>
                <input value={data.itTeam} onChange={e => set('itTeam', e.target.value)}
                  placeholder="ej. Equipo de Infraestructura y Arquitectura Cloud"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>Nombre del Consultor (SoftwareOne)</label>
                <input value={data.consultorName} onChange={e => set('consultorName', e.target.value)}
                  placeholder="ej. Juan Perez"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>Cargo / Firma</label>
                <input value={data.consultorSignature} onChange={e => set('consultorSignature', e.target.value)}
                  placeholder="ej. Arquitecto Cloud Senior"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: 11, color: '#9c27b0', fontWeight: 700, display: 'block', marginBottom: 4 }}>Correo del Consultor</label>
                <input value={data.consultorEmail} onChange={e => set('consultorEmail', e.target.value)}
                  placeholder="ej. juan.perez@softwareone.com"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 7, border: '1px solid #fce4ec', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #fce4ec', overflow: 'hidden' }}>
            <div style={{ background: GRADIENT, padding: '10px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Contenido de la Carta</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Usa [NOMBRE_EMPRESA] como marcador</div>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <textarea value={data.thankYouLetter} onChange={e => set('thankYouLetter', e.target.value)}
                rows={16}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'Times New Roman, serif', lineHeight: 1.8 }} />
            </div>
          </div>
          <div style={{ padding: '10px 14px', background: '#f3e8ff', borderRadius: 8, border: '1px solid #fce4ec', fontSize: 11, color: '#7b2ff7' }}>
            El documento Word incluira el logo de SoftwareOne en la esquina inferior derecha de la carta, junto con los datos del consultor y la fecha indicada.
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
