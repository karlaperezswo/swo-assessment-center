import { BookOpen, Search, Wrench, CheckSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WikiHomeProps {
  onNavigate: (page: string) => void;
}

const cards = [
  {
    icon: BookOpen,
    title: 'Introducción al Programa MAP',
    desc: 'Conoce los fundamentos del programa MAP y sus beneficios',
    page: 'introduccion',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50 border-fuchsia-200',
  },
  {
    icon: Search,
    title: 'MAP Assessment',
    desc: 'Proceso completo de la fase de evaluación paso a paso',
    page: 'map-assessment',
    color: 'text-pink-600',
    bg: 'bg-pink-50 border-pink-200',
  },
  {
    icon: Wrench,
    title: 'Herramientas de Colecta',
    desc: 'Guías detalladas de Cloudamize, Concierto, Matilda y AWS Transform',
    page: 'herramientas',
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
  },
  {
    icon: CheckSquare,
    title: 'Checklist de Entregables',
    desc: 'Verifica todos los entregables finales del proyecto',
    page: 'checklist',
    color: 'text-fuchsia-600',
    bg: 'bg-fuchsia-50 border-fuchsia-200',
  },
];

export function WikiHome({ onNavigate }: WikiHomeProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-fuchsia-900">Guía de Ejecución Estandarizada</h2>
        <p className="text-sm text-fuchsia-700 mt-1">Documentación completa para consultores del programa MAP</p>
      </div>

      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-5">
          <h3 className="font-semibold text-fuchsia-900 mb-2">Resumen Ejecutivo</h3>
          <p className="text-sm text-fuchsia-800 leading-relaxed">
            El programa AWS Migration Acceleration Program (MAP) es una metodología integral y comprobada que ayuda
            a las organizaciones a migrar a AWS de manera más rápida y eficiente. Esta wiki proporciona una guía
            paso a paso para ejecutar la fase de Assessment del programa MAP de forma estandarizada.
          </p>
          <p className="text-sm text-fuchsia-800 leading-relaxed mt-2">
            El MAP Assessment es la fase inicial donde se evalúa el estado actual de la infraestructura del cliente,
            se identifican las cargas de trabajo, y se desarrolla un plan de migración personalizado.
          </p>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Navegación Rápida</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.page}
                onClick={() => onNavigate(c.page)}
                className={`text-left p-4 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${c.bg}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${c.color}`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{c.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{c.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
