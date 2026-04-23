import { CheckCircle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

export function WikiCuestionario() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Cuestionario de Infraestructura</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El cuestionario de infraestructura es un componente esencial del MAP Assessment que complementa los datos
            recolectados por las herramientas automatizadas. Permite capturar información cualitativa y contextual
            que no puede ser obtenida mediante agentes.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Obtener una visión completa del entorno del cliente, incluyendo aspectos
            organizacionales, operacionales y estratégicos que influirán en la migración.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Proceso</h3>
          {[
            {
              n: '1', title: 'Preparación',
              items: [
                'Identificar a los participantes clave (IT, Seguridad, Operaciones, Negocio)',
                'Programar sesiones de trabajo (2–3 sesiones de 2 horas cada una)',
                'Enviar el cuestionario con anticipación para revisión',
                'Preparar contexto y objetivos de cada sección',
              ],
            },
            {
              n: '2', title: 'Ejecución',
              items: [
                'Conducir sesiones estructuradas por área temática',
                'Documentar respuestas detalladas y ejemplos específicos',
                'Solicitar evidencia documental cuando sea relevante',
                'Identificar áreas que requieren profundización',
              ],
            },
            {
              n: '3', title: 'Validación',
              items: [
                'Revisar respuestas con el equipo técnico del cliente',
                'Contrastar información con datos de herramientas de colecta',
                'Resolver inconsistencias o ambigüedades',
                'Obtener aprobación final del cliente',
              ],
            },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-1.5">{step.title}</p>
                <ul className="space-y-1.5">
                  {step.items.map((item) => <CheckItem key={item}>{item}</CheckItem>)}
                </ul>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Áreas Cubiertas por el Cuestionario</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {[
              'Arquitectura y Topología de Red',
              'Inventario de Aplicaciones Críticas',
              'Políticas de Seguridad y Compliance',
              'Procesos de Backup y DR',
              'Contratos y Licenciamiento',
              'Objetivos de Negocio y Timeline',
              'Restricciones Técnicas y Organizacionales',
              'Nivel de Madurez en la Nube',
            ].map((area) => (
              <div key={area} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-fuchsia-400 flex-shrink-0" />
                {area}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
