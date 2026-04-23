import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  q: string;
  a: React.ReactNode;
}

const faqs: { category: string; items: FaqItem[] }[] = [
  {
    category: 'General',
    items: [
      {
        q: '¿Cuánto tiempo toma un MAP Assessment típico?',
        a: (
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>Un MAP Assessment completo generalmente toma entre 4 a 8 semanas:</p>
            <ul className="ml-3 space-y-1">
              {['Semana 1: Setup y kickoff', 'Semanas 2–3: Recolección de datos (mínimo 2 semanas)', 'Semana 4–5: Análisis y desarrollo de recomendaciones', 'Semana 6: Preparación de entregables y presentación'].map((item) => (
                <li key={item} className="flex items-start gap-1.5"><span className="text-fuchsia-400">•</span>{item}</li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        q: '¿Cuál es el costo de un MAP Assessment?',
        a: <p className="text-sm text-gray-700">El costo varía según el alcance del proyecto, número de servidores, y complejidad del entorno. AWS ofrece financiamiento a través del programa MAP que puede cubrir parte o la totalidad del assessment. Contacta a tu representante de SoftwareONE para un presupuesto específico.</p>,
      },
      {
        q: '¿Qué tamaño de entorno es elegible para MAP?',
        a: <p className="text-sm text-gray-700">El programa MAP está diseñado para migraciones que generen al menos $100,000 USD en gasto anual en AWS. Sin embargo, existen opciones para entornos más pequeños. Consulta con tu equipo de AWS o SoftwareONE.</p>,
      },
      {
        q: '¿Necesito tener experiencia previa con AWS?',
        a: <p className="text-sm text-gray-700">No es necesario. El MAP Assessment está diseñado para organizaciones en cualquier etapa de su journey a la nube. Los Immersion Days y capacitaciones incluidas ayudan a desarrollar las habilidades necesarias.</p>,
      },
    ],
  },
  {
    category: 'Herramientas de Colecta',
    items: [
      {
        q: '¿Qué herramienta de colecta debo usar?',
        a: (
          <div className="space-y-1.5 text-sm text-gray-700">
            <p>La selección depende de varios factores:</p>
            <ul className="ml-3 space-y-1">
              {['Cloudamize: Ideal para entornos medianos a grandes con infraestructura moderna', 'Concierto: Mejor para entornos multi-cloud o con restricciones de instalación de agentes', 'Matilda: Especializada en sistemas legacy, mainframes y AS/400'].map((item) => (
                <li key={item} className="flex items-start gap-1.5"><span className="text-fuchsia-400">•</span>{item}</li>
              ))}
            </ul>
          </div>
        ),
      },
      {
        q: '¿Los agentes impactan el performance de los servidores?',
        a: <p className="text-sm text-gray-700">El impacto es mínimo. Los agentes están diseñados para usar menos del 1–2% de CPU y menos de 100 MB de RAM. Se recomienda instalar primero en servidores no críticos para verificar el comportamiento.</p>,
      },
      {
        q: '¿Qué pasa si el cliente tiene restricciones de seguridad para instalar agentes?',
        a: <p className="text-sm text-gray-700">En este caso, Concierto ofrece un modo agentless que recopila datos vía SSH/WMI sin necesidad de instalar software en los servidores. También se puede usar la opción manual de inventario con RVTools para entornos VMware.</p>,
      },
    ],
  },
  {
    category: 'Business Case',
    items: [
      {
        q: '¿Cómo se calcula el TCO?',
        a: <p className="text-sm text-gray-700">El TCO incluye todos los costos actuales on-premises (hardware, software, datacenter, personal, mantenimiento) comparados contra los costos proyectados en AWS (cómputo, almacenamiento, red, soporte). Se proyecta a 3 años para capturar el valor completo.</p>,
      },
      {
        q: '¿Qué nivel de ahorro es típico en una migración MAP?',
        a: <p className="text-sm text-gray-700">Los ahorros típicos oscilan entre 20–40% en el TCO a 3 años, aunque esto depende mucho del entorno actual del cliente. Los mayores ahorros vienen de rightsizing, eliminación de hardware y reducción de costos operativos.</p>,
      },
    ],
  },
];

export function WikiFaq() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        Respuestas a las preguntas más comunes sobre el MAP Assessment y el proceso de migración a AWS.
      </div>

      {faqs.map((section) => (
        <div key={section.category}>
          <h3 className="text-sm font-semibold text-fuchsia-700 uppercase tracking-wide mb-2">{section.category}</h3>
          <div className="space-y-2">
            {section.items.map((faq) => {
              const key = `${section.category}:${faq.q}`;
              const isOpen = open === key;
              return (
                <div key={faq.q} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 pr-4">{faq.q}</span>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-fuchsia-500 flex-shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    }
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 bg-gray-50 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
