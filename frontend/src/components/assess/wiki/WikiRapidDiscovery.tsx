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

export function WikiRapidDiscovery() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Rapid Discovery</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            Pre-Discovery &amp; Segmentación de Datos es una herramienta profesional que permite procesar y enriquecer
            la información de inventarios de servidores virtuales exportados desde RVTools, facilitando la documentación
            completa para proyectos de assessment, migración o auditoría.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Características Principales</h3>
          <ul className="space-y-1.5">
            <CheckItem><strong>Procesamiento Automático:</strong> Lee archivos Excel de RVTools y extrae la información relevante</CheckItem>
            <CheckItem><strong>Validaciones Inteligentes:</strong> Detecta automáticamente SOs no soportados</CheckItem>
            <CheckItem><strong>Búsqueda Avanzada:</strong> Filtra y encuentra servidores rápidamente</CheckItem>
            <CheckItem><strong>Sin Base de Datos:</strong> Todo se guarda en archivos locales</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Requisitos Previos</h3>
          <InfoAlert>
            Asegúrese de tener todos los requisitos antes de comenzar.
          </InfoAlert>
          <ul className="space-y-1.5">
            <CheckItem>Un navegador web moderno (Chrome, Firefox, Edge o Safari)</CheckItem>
            <CheckItem>Archivo .xlsx exportado desde RVTools</CheckItem>
            <CheckItem>El archivo debe contener la hoja llamada "vInfo"</CheckItem>
            <CheckItem>Conexión a internet (solo para la primera carga)</CheckItem>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Pasos para Usar la Aplicación</h3>
          {[
            { n: '1', title: 'Abrir la Aplicación', desc: 'Accede al módulo Rapid Discovery en la pestaña correspondiente de MAP Central.' },
            { n: '2', title: 'Cargar Archivo RVTools', desc: 'Haz clic en "Seleccionar Archivo" y elige tu archivo .xlsx de RVTools. La aplicación procesará automáticamente la hoja "vInfo".' },
            { n: '3', title: 'Revisar Resultados', desc: 'Verifica el inventario procesado: servidores, SOs, recursos y dependencias identificadas.' },
            { n: '4', title: 'Exportar y Documentar', desc: 'Exporta los resultados procesados para su uso en las siguientes etapas del assessment.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="bg-fuchsia-100 text-fuchsia-800 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                {step.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{step.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{step.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
