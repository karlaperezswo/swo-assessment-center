import { FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function ResourceItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
      <FileText className="h-4 w-4 text-fuchsia-400 flex-shrink-0" />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}

const sections = [
  {
    title: 'Documentos de Proyecto',
    items: [
      'Plantilla de Statement of Work (SOW)',
      'Plantilla de Project Charter',
      'Plantilla de Plan de Proyecto',
      'Plantilla de Matriz RACI',
      'Plantilla de Registro de Riesgos',
      'Plantilla de Actas de Reunión',
      'Plantilla de Status Report Semanal',
    ],
  },
  {
    title: 'Documentos de Assessment',
    items: [
      'Plantilla de Inventario de Servidores (Excel)',
      'Plantilla de Inventario de Aplicaciones (Excel)',
      'Plantilla de Cuestionario de Infraestructura (Word)',
      'Plantilla de Análisis de Dependencias',
      'Plantilla de Evaluación de Complejidad',
      'Plantilla de Análisis de Riesgos',
    ],
  },
  {
    title: 'Documentos de Business Case',
    items: [
      'Plantilla de Business Case (PowerPoint)',
      'Calculadora TCO personalizada (Excel)',
      'Plantilla de Análisis Financiero',
      'Template de Presentación Ejecutiva',
    ],
  },
  {
    title: 'Documentos de Migración',
    items: [
      'Plantilla de Plan de Migración',
      'Plantilla de Wave Planning',
      'Checklist de Pre-migración',
      'Checklist de Post-migración',
      'Template de Runbook de Migración',
    ],
  },
];

const links = [
  { label: 'AWS MAP Program Documentation', url: 'https://aws.amazon.com/migration-acceleration-program/' },
  { label: 'AWS Migration Hub', url: 'https://aws.amazon.com/migration-hub/' },
  { label: 'AWS Pricing Calculator', url: 'https://calculator.aws/' },
  { label: 'AWS Well-Architected Tool', url: 'https://aws.amazon.com/well-architected-tool/' },
  { label: 'AWS Architecture Icons', url: 'https://aws.amazon.com/architecture/icons/' },
];

export function WikiRecursos() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5">
          <p className="text-sm text-gray-700">
            Biblioteca centralizada de todos los recursos, plantillas, herramientas y materiales de referencia
            para ejecutar un MAP Assessment exitoso.
          </p>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Plantillas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sections.map((section) => (
            <Card key={section.title} className="border-fuchsia-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {section.items.map((item) => <ResourceItem key={item} label={item} />)}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card className="border-fuchsia-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800">Links de Referencia AWS</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-1">
          {links.map((link) => (
            <div key={link.label} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
              <ExternalLink className="h-4 w-4 text-fuchsia-400 flex-shrink-0" />
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-fuchsia-700 hover:text-fuchsia-900 hover:underline"
              >
                {link.label}
              </a>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
