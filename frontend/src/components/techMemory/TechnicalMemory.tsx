import { useState, useRef } from 'react';
import { toast } from 'sonner';
import apiClient from '@/lib/api';
import { TechMemoryData, AWSServiceEntry } from './types';
import { exportTechMemoryWord } from './wordExporter';
import {
  Search, Plus, Trash2, Download, Upload, RefreshCw,
  BookOpen, Building2, FileText, Award, ChevronDown, ChevronUp, Loader2
} from 'lucide-react';

const GRADIENT = 'linear-gradient(135deg, #e91e8c 0%, #9c27b0 50%, #1565c0 100%)';
const GRADIENT_H = 'linear-gradient(90deg, #e91e8c 0%, #9c27b0 50%, #1565c0 100%)';

const DEFAULT_INTRO = `El presente documento constituye la memoria técnica del proyecto de migración a Amazon Web Services (AWS) desarrollado para [NOMBRE_EMPRESA]. Este proyecto fue ejecutado por SoftwareOne en el marco del programa AWS Migration Acceleration Program (MAP), con el objetivo de modernizar la infraestructura tecnológica del cliente y aprovechar las capacidades de la nube.

A lo largo de este documento se describen los servicios AWS implementados, su justificación técnica, ventajas y consideraciones, así como los retos enfrentados durante el proceso de migración y las conclusiones derivadas de la implementación.`;

const DEFAULT_CONCLUSIONS = `La migración a AWS representa un hito estratégico para [NOMBRE_EMPRESA], permitiendo una mayor agilidad operativa, reducción de costos de infraestructura y mejora en la disponibilidad de los sistemas críticos.

Los servicios implementados han demostrado cumplir con los requerimientos funcionales y no funcionales establecidos al inicio del proyecto, garantizando la continuidad del negocio durante y después del proceso de migración.

SoftwareOne, como partner certificado de AWS, ha acompañado al cliente en cada etapa del proceso, asegurando las mejores prácticas de arquitectura, seguridad y optimización de costos.`;

const DEFAULT_CHALLENGES = `Durante el desarrollo del proyecto se identificaron los siguientes retos principales:

1. Complejidad en la migración de bases de datos legadas con dependencias críticas.
2. Necesidad de mantener la continuidad operativa durante el proceso de migración.
3. Adaptación del equipo técnico del cliente a las nuevas tecnologías cloud.
4. Optimización de costos manteniendo los niveles de servicio requeridos.
5. Gestión del cambio organizacional asociado a la adopción de la nube.`;

const DEFAULT_THANK_YOU = `Estimado equipo de [NOMBRE_EMPRESA],

En nombre de SoftwareOne, queremos expresar nuestro más sincero agradecimiento por la confianza depositada en nosotros para acompañarlos en este importante proceso de transformación digital.

Ha sido un privilegio trabajar junto a su equipo de TI, cuya dedicación, profesionalismo y compromiso han sido fundamentales para el éxito de este proyecto. La colaboración estrecha entre ambos equipos ha permitido superar los desafíos presentados y alcanzar los objetivos establecidos.

Estamos convencidos de que esta migración a AWS representa el inicio de una nueva etapa de crecimiento e innovación para su organización. SoftwareOne continuará siendo su aliado estratégico en este camino hacia la transformación digital.

Agradecemos profundamente la oportunidad de haber sido parte de este proyecto y esperamos continuar fortaleciendo nuestra relación en el futuro.`;

const emptyData = (): TechMemoryData => ({
  projectName: '',
  clientName: '',
  clientUrl: '',
  clientLogoBase64: '',
  swoLogoBase64: '',
  date: new Date().toISOString().split('T')[0],
  authors: '',
  version: '1.0',
  clientMission: '',
  clientVision: '',
  clientAbout: '',
  introduction: DEFAULT_INTRO,
  challenges: DEFAULT_CHALLENGES,
  conclusions: DEFAULT_CONCLUSIONS,
  services: [],
  thankYouLetter: DEFAULT_THANK_YOU,
  itTeam: '',
});

export function TechnicalMemory() {
  const [data, setData] = useState<TechMemoryData>(emptyData());
  const [activeTab, setActiveTab] = useState<'project'|'company'|'services'|'document'|'letter'>('project');
  const [serviceSearch, setServiceSearch] = useState('');
  const [isSearchingAWS, setIsSearchingAWS] = useState(false);
  const [isSearchingCompany, setIsSearchingCompany] = useState(false);
  const [isLoadingLogo, setIsLoadingLogo] = useState(false);
  const [expandedService, setExpandedService] = useState<string|null>(null);
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
    { id: 'project',  label: 'Proyecto',   icon: <FileText style={{ width: 14, height: 14 }} /> },
    { id: 'company',  label: 'Empresa',    icon: <Building2 style={{ width: 14, height: 14 }} /> },
    { id: 'services', label: 'Servicios AWS', icon: <BookOpen style={{ width: 14, height: 14 }} /> },
    { id: 'document', label: 'Documento',  icon: <FileText style={{ width: 14, height: 14 }} /> },
    { id: 'letter',   label: 'Carta',      icon: <Award style={{ width: 14, height: 14 }} /> },
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
            <div style={{ padding: '16px 20px', display: 'flex', gap: 8 }}>
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
                {isSearchingAWS ? 'Buscando...' : 'Buscar y Agregar'}
              </button>
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

      {/* ── TAB: Documento ────────────────────────────────────────────────── */}
      {activeTab === 'document' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Introducción', field: 'introduction' as const, rows: 10,
              hint: 'Describe el contexto del proyecto, objetivos y alcance.' },
            { label: 'Retos del Proyecto', field: 'challenges' as const, rows: 8,
              hint: 'Describe los principales desafíos enfrentados durante la migración.' },
            { label: 'Conclusiones', field: 'conclusions' as const, rows: 8,
              hint: 'Resume los logros, beneficios obtenidos y recomendaciones.' },
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
