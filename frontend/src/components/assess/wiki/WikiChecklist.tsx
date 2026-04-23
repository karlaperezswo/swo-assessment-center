import { useState } from 'react';
import { CheckCircle, Circle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const sections = [
  {
    title: '1. Documentación de Discovery',
    items: [
      'Inventario completo de servidores con especificaciones técnicas',
      'Inventario de aplicaciones y sus componentes',
      'Inventario de bases de datos (tipos, versiones, tamaños)',
      'Datos de utilización de recursos (CPU, RAM, disco, red)',
      'Cuestionario de infraestructura completado y validado',
      'Documentación de sistemas legacy (si aplica)',
    ],
  },
  {
    title: '2. Análisis y Evaluación',
    items: [
      'Mapa de dependencias entre aplicaciones',
      'Análisis de patrones de uso y performance',
      'Identificación de aplicaciones críticas vs no críticas',
      'Evaluación de complejidad de migración por aplicación',
      'Análisis de requisitos de compliance y seguridad',
      'Identificación de riesgos técnicos y de negocio',
    ],
  },
  {
    title: '3. Recomendaciones de Migración',
    items: [
      'Estrategia de migración (7Rs) por aplicación documentada',
      'Rightsizing de instancias EC2 recomendado',
      'Estrategia de base de datos definida',
      'Plan de licenciamiento en AWS',
      'Arquitectura target en AWS diseñada',
    ],
  },
  {
    title: '4. Business Case',
    items: [
      'Costos on-premises actuales documentados y validados',
      'Proyección de costos AWS calculada (3 años)',
      'ROI y período de recuperación de inversión calculados',
      'Beneficios intangibles identificados',
      'Análisis de sensibilidad completado',
    ],
  },
  {
    title: '5. Plan de Migración',
    items: [
      'Waves de migración definidas y priorizadas',
      'Timeline de migración detallado',
      'Recursos y responsabilidades asignados',
      'Plan de pruebas y validación definido',
      'Plan de rollback documentado',
      'Criterios de éxito definidos',
    ],
  },
  {
    title: '6. Presentación Ejecutiva',
    items: [
      'Presentación preparada y revisada',
      'Hallazgos validados con equipo técnico del cliente',
      'Números financieros verificados',
      'Presentación ensayada (dry run)',
      'Material de respaldo preparado',
    ],
  },
];

export function WikiChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const total = sections.reduce((acc, s) => acc + s.items.length, 0);
  const done = checked.size;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-5">
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-fuchsia-900">Progreso General</p>
            <p className="text-sm font-bold text-fuchsia-700">{done}/{total} ({pct}%)</p>
          </div>
          <div className="w-full bg-fuchsia-100 rounded-full h-2.5">
            <div
              className="bg-fuchsia-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p>Todos los entregables deben ser revisados por al menos dos miembros del equipo antes de la entrega final al cliente.</p>
      </div>

      {sections.map((section) => {
        const sectionDone = section.items.filter((item) => checked.has(`${section.title}:${item}`)).length;
        return (
          <Card key={section.title} className="border-fuchsia-100">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-800">{section.title}</CardTitle>
                <span className="text-xs text-gray-500">{sectionDone}/{section.items.length}</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {section.items.map((item) => {
                const key = `${section.title}:${item}`;
                const isDone = checked.has(key);
                return (
                  <button
                    key={item}
                    onClick={() => toggle(key)}
                    className="w-full flex items-start gap-2 text-left group"
                  >
                    {isDone
                      ? <CheckCircle className="h-4 w-4 text-fuchsia-500 flex-shrink-0 mt-0.5" />
                      : <Circle className="h-4 w-4 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-fuchsia-300 transition-colors" />
                    }
                    <span className={`text-sm transition-colors ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                      {item}
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
