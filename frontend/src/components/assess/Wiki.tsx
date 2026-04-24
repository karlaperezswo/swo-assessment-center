import { useState } from 'react';
import { BookOpen, ChevronRight, ChevronDown, Home, Info, Search, Wrench, FileQuestion, Network, GraduationCap, CheckSquare, FolderOpen, HelpCircle, BookMarked, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { WikiHome } from './wiki/WikiHome';
import { WikiIntroduccion } from './wiki/WikiIntroduccion';
import { WikiMapAssessment } from './wiki/WikiMapAssessment';
import { WikiHerramientas } from './wiki/WikiHerramientas';
import { WikiRapidDiscovery } from './wiki/WikiRapidDiscovery';
import { WikiCuestionario } from './wiki/WikiCuestionario';
import { WikiDiagrama } from './wiki/WikiDiagrama';
import { WikiImmersionDays } from './wiki/WikiImmersionDays';
import { WikiChecklist } from './wiki/WikiChecklist';
import { WikiRecursos } from './wiki/WikiRecursos';
import { WikiFaq } from './wiki/WikiFaq';
import { WikiGlosario } from './wiki/WikiGlosario';
import { WikiContacto } from './wiki/WikiContacto';

type WikiPage =
  | 'inicio' | 'introduccion' | 'map-assessment' | 'herramientas'
  | 'rapid-discovery' | 'cuestionario' | 'diagrama' | 'immersion-days'
  | 'checklist' | 'recursos' | 'faq' | 'glosario' | 'contacto';

type MapSubPage =
  | 'overview' | 'kickoff-interno' | 'kickoff-externo' | 'seleccion-herramienta'
  | 'instalacion-agentes' | 'recoleccion-datos' | 'validacion-analisis'
  | 'business-case' | 'plan-migracion' | 'presentacion';

type HerramientaSubPage =
  | 'guia' | 'cloudamize' | 'concierto' | 'matilda'
  | 'aws-transform' | 'aws-transform-ova' | 'aws-transform-proceso' | 'aws-transform-mgn';

const mapSubItems: { value: MapSubPage; label: string }[] = [
  { value: 'overview',              label: 'Visión General' },
  { value: 'kickoff-interno',       label: 'Kickoff Interno' },
  { value: 'kickoff-externo',       label: 'Kickoff Externo' },
  { value: 'seleccion-herramienta', label: 'Selección de Herramienta' },
  { value: 'instalacion-agentes',   label: 'Instalación de Agentes' },
  { value: 'recoleccion-datos',     label: 'Recolección de Datos' },
  { value: 'validacion-analisis',   label: 'Validación y Análisis' },
  { value: 'business-case',         label: 'Business Case' },
  { value: 'plan-migracion',        label: 'Plan de Migración' },
  { value: 'presentacion',          label: 'Presentación Ejecutiva' },
];

const herramientaSubItems: { value: HerramientaSubPage; label: string; indent?: boolean }[] = [
  { value: 'guia',                  label: 'Guía de Selección' },
  { value: 'cloudamize',            label: 'Cloudamize' },
  { value: 'concierto',             label: 'Concierto' },
  { value: 'matilda',               label: 'Matilda' },
  { value: 'aws-transform',         label: 'AWS Transform' },
  { value: 'aws-transform-ova',     label: 'Manual OVA', indent: true },
  { value: 'aws-transform-proceso', label: 'Proceso Transform', indent: true },
  { value: 'aws-transform-mgn',     label: 'MGN Connector', indent: true },
];

interface NavItem {
  value: WikiPage;
  label: string;
  icon: React.ReactNode;
  expandable?: boolean;
}

const navItems: NavItem[] = [
  { value: 'inicio',        label: 'Inicio',                       icon: <Home className="h-4 w-4" /> },
  { value: 'introduccion',  label: 'Introducción al Programa MAP', icon: <Info className="h-4 w-4" /> },
  { value: 'map-assessment',label: 'MAP Assessment',               icon: <Search className="h-4 w-4" />, expandable: true },
  { value: 'herramientas',  label: 'Herramientas de Colecta',      icon: <Wrench className="h-4 w-4" />, expandable: true },
  { value: 'rapid-discovery',label: 'Rapid Discovery',             icon: <FileQuestion className="h-4 w-4" /> },
  { value: 'cuestionario',  label: 'Cuestionario de Infraestructura', icon: <FileQuestion className="h-4 w-4" /> },
  { value: 'diagrama',      label: 'Diagrama de Infraestructura',  icon: <Network className="h-4 w-4" /> },
  { value: 'immersion-days',label: 'Immersion Days',               icon: <GraduationCap className="h-4 w-4" /> },
  { value: 'checklist',     label: 'Checklist de Entregables',     icon: <CheckSquare className="h-4 w-4" /> },
  { value: 'recursos',      label: 'Recursos y Descargables',      icon: <FolderOpen className="h-4 w-4" /> },
  { value: 'faq',           label: 'Preguntas Frecuentes',         icon: <HelpCircle className="h-4 w-4" /> },
  { value: 'glosario',      label: 'Glosario de Términos',         icon: <BookMarked className="h-4 w-4" /> },
  { value: 'contacto',      label: 'Contacto y Soporte',           icon: <Phone className="h-4 w-4" /> },
];

const pageTitles: Record<WikiPage, string> = {
  inicio:           'Inicio',
  introduccion:     'Introducción al Programa MAP',
  'map-assessment': 'MAP Assessment',
  herramientas:     'Herramientas de Colecta',
  'rapid-discovery':'Rapid Discovery',
  cuestionario:     'Cuestionario de Infraestructura',
  diagrama:         'Diagrama de Infraestructura',
  'immersion-days': 'Immersion Days',
  checklist:        'Checklist de Entregables',
  recursos:         'Recursos y Descargables',
  faq:              'Preguntas Frecuentes',
  glosario:         'Glosario de Términos',
  contacto:         'Contacto y Soporte',
};

export function Wiki() {
  const [activePage, setActivePage] = useState<WikiPage>('inicio');
  const [expandedSections, setExpandedSections] = useState<Set<WikiPage>>(new Set(['map-assessment', 'herramientas']));
  const [mapSubPage, setMapSubPage] = useState<MapSubPage>('overview');
  const [herramientaSubPage, setHerramientaSubPage] = useState<HerramientaSubPage>('guia');

  const toggleExpand = (page: WikiPage) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(page)) next.delete(page);
      else next.add(page);
      return next;
    });
  };

  const navigateTo = (page: WikiPage) => {
    setActivePage(page);
    if (page === 'map-assessment' || page === 'herramientas') {
      setExpandedSections((prev) => new Set([...prev, page]));
    }
  };

  const navigateToMapSub = (sub: MapSubPage) => {
    setMapSubPage(sub);
    setActivePage('map-assessment');
    setExpandedSections((prev) => new Set([...prev, 'map-assessment']));
  };

  const navigateToHerramientaSub = (sub: HerramientaSubPage) => {
    setHerramientaSubPage(sub);
    setActivePage('herramientas');
    setExpandedSections((prev) => new Set([...prev, 'herramientas']));
  };

  const breadcrumbs: string[] = ['Wiki'];
  if (activePage !== 'inicio') {
    breadcrumbs.push(pageTitles[activePage]);
    if (activePage === 'map-assessment') {
      const sub = mapSubItems.find(s => s.value === mapSubPage);
      if (sub && mapSubPage !== 'overview') breadcrumbs.push(sub.label);
    }
    if (activePage === 'herramientas') {
      const sub = herramientaSubItems.find(s => s.value === herramientaSubPage);
      if (sub && herramientaSubPage !== 'guia') breadcrumbs.push(sub.label);
    }
  }

  const renderContent = () => {
    switch (activePage) {
      case 'inicio':          return <WikiHome onNavigate={(p) => navigateTo(p as WikiPage)} />;
      case 'introduccion':    return <WikiIntroduccion />;
      case 'map-assessment':  return <WikiMapAssessment key={mapSubPage} initialPage={mapSubPage} />;
      case 'herramientas':    return <WikiHerramientas key={herramientaSubPage} initialPage={herramientaSubPage} />;
      case 'rapid-discovery': return <WikiRapidDiscovery />;
      case 'cuestionario':    return <WikiCuestionario />;
      case 'diagrama':        return <WikiDiagrama />;
      case 'immersion-days':  return <WikiImmersionDays />;
      case 'checklist':       return <WikiChecklist />;
      case 'recursos':        return <WikiRecursos />;
      case 'faq':             return <WikiFaq />;
      case 'glosario':        return <WikiGlosario />;
      case 'contacto':        return <WikiContacto />;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900 text-lg">Wiki MAP Assessment</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                Guía de ejecución estandarizada para consultores del programa AWS MAP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 min-h-[600px]">
        {/* Sidebar */}
        <div className="w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border shadow-sm p-2 sticky top-4">
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = activePage === item.value;
                const isExpanded = expandedSections.has(item.value);

                return (
                  <div key={item.value}>
                    {/* Main nav item */}
                    <button
                      onClick={() => {
                        navigateTo(item.value);
                        if (item.expandable) toggleExpand(item.value);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-all',
                        isActive && activePage !== 'map-assessment' && activePage !== 'herramientas'
                          ? 'bg-fuchsia-100 text-fuchsia-900'
                          : isActive
                            ? 'bg-fuchsia-50 text-fuchsia-800'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                      )}
                    >
                      <span className={isActive ? 'text-fuchsia-600' : 'text-gray-400'}>{item.icon}</span>
                      <span className="flex-1 leading-tight">{item.label}</span>
                      {item.expandable && (
                        isExpanded
                          ? <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          : <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      )}
                    </button>

                    {/* MAP Assessment sub-items */}
                    {item.value === 'map-assessment' && isExpanded && (
                      <div className="ml-3 border-l border-fuchsia-100 pl-2 mt-0.5 space-y-0.5">
                        {mapSubItems.map((sub) => {
                          const isSubActive = activePage === 'map-assessment' && mapSubPage === sub.value;
                          return (
                            <button
                              key={sub.value}
                              onClick={() => navigateToMapSub(sub.value)}
                              className={cn(
                                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-all',
                                isSubActive
                                  ? 'bg-fuchsia-100 text-fuchsia-900 font-medium'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              )}
                            >
                              <span className={cn('w-1 h-1 rounded-full flex-shrink-0', isSubActive ? 'bg-fuchsia-500' : 'bg-gray-300')} />
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Herramientas sub-items */}
                    {item.value === 'herramientas' && isExpanded && (
                      <div className="ml-3 border-l border-fuchsia-100 pl-2 mt-0.5 space-y-0.5">
                        {herramientaSubItems.map((sub) => {
                          const isSubActive = activePage === 'herramientas' && herramientaSubPage === sub.value;
                          return (
                            <button
                              key={sub.value}
                              onClick={() => navigateToHerramientaSub(sub.value)}
                              className={cn(
                                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs text-left transition-all',
                                sub.indent ? 'pl-5' : '',
                                isSubActive
                                  ? 'bg-fuchsia-100 text-fuchsia-900 font-medium'
                                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                              )}
                            >
                              <span className={cn('w-1 h-1 rounded-full flex-shrink-0', isSubActive ? 'bg-fuchsia-500' : 'bg-gray-300')} />
                              {sub.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span className={i === breadcrumbs.length - 1 ? 'text-fuchsia-600 font-medium' : ''}>{crumb}</span>
              </span>
            ))}
          </div>
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
