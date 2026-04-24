import { useState } from 'react';
import { CheckCircle, Circle, AlertTriangle, PartyPopper, FileText } from 'lucide-react';
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
      'Estrategia de migración (7Rs) por aplicación',
      'Recomendaciones de rightsizing para AWS',
      'Mapeo de servicios on-premises a servicios AWS',
      'Identificación de oportunidades de modernización',
      'Recomendaciones de arquitectura AWS',
      'Plan de optimización de costos',
    ],
  },
  {
    title: '4. Business Case',
    items: [
      'Análisis de TCO (Total Cost of Ownership) actual',
      'Proyección de costos en AWS (3-5 años)',
      'Análisis comparativo de costos (on-premises vs AWS)',
      'Cálculo de ROI y período de recuperación',
      'Identificación de beneficios tangibles e intangibles',
      'Análisis de sensibilidad y escenarios alternativos',
      'Información sobre créditos y financiamiento MAP',
    ],
  },
  {
    title: '5. Plan de Migración',
    items: [
      'Agrupación de aplicaciones en migration waves',
      'Priorización de waves basada en valor y complejidad',
      'Timeline detallado de migración',
      'Identificación de quick wins',
      'Recursos necesarios por wave (equipo, herramientas)',
      'Plan de gestión de riesgos',
      'Estrategia de rollback por wave',
    ],
  },
  {
    title: '6. Diagramas y Arquitectura',
    items: [
      'Diagrama de infraestructura actual (As-Is)',
      'Diagrama de arquitectura propuesta en AWS (To-Be)',
      'Diagrama de dependencias de aplicaciones',
      'Diagrama de migration waves',
      'Diagramas de red (VPC, subnets, conectividad)',
      'Diagramas de seguridad (zonas, controles)',
    ],
  },
  {
    title: '7. Reportes Técnicos',
    items: [
      'Reporte de assessment de herramienta de colecta',
      'Reporte de análisis de performance',
      'Reporte de análisis de seguridad',
      'Reporte de análisis de compliance',
      'Reporte de licenciamiento',
      'Documentación técnica detallada',
    ],
  },
  {
    title: '8. Presentaciones',
    items: [
      'Presentación ejecutiva (para C-level y stakeholders de negocio)',
      'Presentación técnica (para equipos de IT)',
      'Presentación de business case (para finanzas)',
      'Presentación de roadmap de migración',
    ],
  },
  {
    title: '9. Documentación de Soporte',
    items: [
      'Glosario de términos técnicos',
      'FAQ (Preguntas Frecuentes)',
      'Guía de próximos pasos',
      'Contactos y recursos de soporte',
      'Referencias y documentación adicional',
    ],
  },
  {
    title: '10. Datos Raw y Exportaciones',
    items: [
      'Exportación de datos de herramienta de colecta',
      'Hojas de cálculo con inventarios detallados',
      'Logs y evidencia de recolección de datos',
      'Backup de configuraciones y reportes',
    ],
  },
  {
    title: '11. Control de Calidad',
    items: [
      'Revisión de ortografía y gramática en todos los documentos',
      'Validación de números y cálculos',
      'Consistencia de branding (logos, colores, fuentes)',
      'Verificación de enlaces y referencias',
      'Revisión por par (peer review)',
      'Aprobación del lead consultant',
    ],
  },
  {
    title: '12. Entrega y Cierre',
    items: [
      'Organización de archivos en estructura clara',
      'Creación de índice de documentos',
      'Empaquetado de entregables para entrega',
      'Programación de presentación final',
      'Preparación de sesión de Q&A',
      'Documentación de lecciones aprendidas',
      'Encuesta de satisfacción del cliente',
      'Cierre formal del proyecto',
    ],
  },
];

const plantillas = [
  '📦 Estructura de Carpetas para Entregables',
  '📄 Template de Índice de Documentos',
  '📄 Email de Entrega de Documentos',
  '📄 Agenda de Presentación Final',
  '📄 Encuesta de Satisfacción del Cliente',
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
  const isComplete = done === total;

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <Card className={`border-fuchsia-200 transition-all ${isComplete ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gradient-to-r from-fuchsia-50 to-pink-50'}`}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-fuchsia-900">Progreso General</p>
            <p className="text-sm font-bold text-fuchsia-700">{done}/{total} ({pct}%)</p>
          </div>
          <div className="w-full bg-fuchsia-100 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${isComplete ? 'bg-green-500' : 'bg-fuchsia-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {isComplete && (
            <p className="text-xs text-green-700 font-medium mt-2 text-center">¡Checklist completo! Listo para entrega al cliente.</p>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p><strong>Importante:</strong> Todos los entregables deben ser revisados por al menos dos miembros del equipo antes de la entrega final al cliente.</p>
      </div>

      {/* Checklist sections */}
      {sections.map((section) => {
        const sectionDone = section.items.filter((item) => checked.has(`${section.title}:${item}`)).length;
        const sectionComplete = sectionDone === section.items.length;
        return (
          <Card key={section.title} className={`border-fuchsia-100 transition-all ${sectionComplete ? 'border-green-200 bg-green-50/30' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className={`text-sm font-semibold ${sectionComplete ? 'text-green-700' : 'text-gray-800'}`}>
                  {sectionComplete && <span className="mr-1.5">✓</span>}
                  {section.title}
                </CardTitle>
                <span className={`text-xs font-medium ${sectionComplete ? 'text-green-600' : 'text-gray-500'}`}>
                  {sectionDone}/{section.items.length}
                </span>
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

      {/* Congratulations */}
      <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <PartyPopper className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
        <div>
          <strong>¡Felicitaciones!</strong> Una vez completado este checklist, tu MAP Assessment está listo para entrega.
          Asegúrate de programar una sesión de presentación efectiva y de mantener comunicación abierta con el cliente para próximos pasos.
        </div>
      </div>

      {/* Plantillas de Entrega */}
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Plantillas de Entrega</h3>
          <ul className="space-y-1">
            {plantillas.map((item) => (
              <li key={item} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg text-sm text-fuchsia-700">
                <FileText className="h-4 w-4 text-fuchsia-400 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
