import { CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

function WarnAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
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
          <p className="text-sm text-gray-600">Antes de comenzar, asegúrese de tener:</p>
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
            {
              n: '1', title: 'Abrir la Aplicación',
              desc: 'Haga doble clic en el archivo index.html o ábralo con su navegador preferido.',
            },
            {
              n: '2', title: 'Cargar Archivo RVTools',
              desc: 'Haga clic en "Seleccionar Archivo" y elija su archivo .xlsx de RVTools. La aplicación procesará automáticamente la hoja "vInfo".',
            },
            {
              n: '3', title: 'Revisar Validaciones',
              desc: 'La herramienta detectará automáticamente sistemas operativos no soportados y máquinas virtuales apagadas. Revise los colores de resaltado.',
            },
            {
              n: '4', title: 'Completar Información',
              desc: 'Para cada servidor, complete los campos requeridos: Hostname, Sistema Operativo y Ambiente (Producción, QA, Desarrollo, etc.).',
            },
            {
              n: '5', title: 'Guardar Progreso',
              desc: 'Use el botón "Guardar" para exportar su progreso en formato JSON. Guarde frecuentemente (cada 15–20 minutos) para no perder trabajo.',
            },
            {
              n: '6', title: 'Exportar Resultados',
              desc: 'Al finalizar, exporte a Excel para el inventario completo y a PDF para el reporte ejecutivo.',
            },
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

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Sistemas Operativos Soportados</h3>
          <p className="text-sm text-gray-600 mb-2">
            Solo los siguientes sistemas operativos son soportados en el assessment. Si el SO del servidor no está en esta lista, quedará automáticamente fuera del alcance.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Sistema Operativo</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Versiones Soportadas</th>
                  <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { os: 'Windows Server', versions: '2016, 2019, 2022', type: 'Windows' },
                  { os: 'Windows 10 / 11', versions: 'Todas las ediciones', type: 'Windows' },
                  { os: 'Red Hat Enterprise Linux', versions: '7, 8, 9', type: 'Linux' },
                  { os: 'CentOS', versions: '7, 8', type: 'Linux' },
                  { os: 'Ubuntu Server', versions: '18.04, 20.04, 22.04 LTS', type: 'Linux' },
                  { os: 'Amazon Linux', versions: '2, 2023', type: 'Linux' },
                  { os: 'SUSE Linux Enterprise', versions: '12, 15', type: 'Linux' },
                  { os: 'Oracle Linux', versions: '7, 8, 9', type: 'Linux' },
                  { os: 'Debian', versions: '10 (Buster), 11 (Bullseye)', type: 'Linux' },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-200 px-3 py-2 text-gray-800 font-medium">{row.os}</td>
                    <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.versions}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${row.type === 'Windows' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {row.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Códigos de Color</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
              <span className="w-5 h-5 rounded bg-yellow-300 flex-shrink-0 mt-0.5 border border-amber-400" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Fondo Amarillo</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Sistema operativo no soportado (VMware o escritorio). Estos servidores quedan automáticamente fuera del alcance del assessment.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50">
              <span className="w-5 h-5 rounded bg-red-200 flex-shrink-0 mt-0.5 border border-red-400" />
              <div>
                <p className="text-sm font-semibold text-red-900">Fondo Rojo Claro</p>
                <p className="text-xs text-red-800 mt-0.5">
                  Máquina virtual apagada. Puede decidir si incluirla o no en el assessment usando el checkbox "Incluir".
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Función de Búsqueda</h3>
          <p className="text-sm text-gray-700">Use la barra de búsqueda para filtrar servidores por:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {['Nombre de VM', 'Hostname', 'Sistema operativo', 'Cluster', 'Datacenter', 'Ambiente', 'Nombre de aplicación'].map((field) => (
              <div key={field} className="p-2 bg-gray-50 border rounded text-xs text-gray-700 text-center">{field}</div>
            ))}
          </div>
          <InfoAlert>
            <strong>Tip:</strong> Trabaje por grupos usando la búsqueda. Por ejemplo, busque "prod" para ver solo servidores de producción, o "sql" para ver servidores con SQL Server.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Panel de Estadísticas</h3>
          <p className="text-sm text-gray-700">El panel superior muestra en tiempo real:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {[
              { label: 'Total VMs', desc: 'Cantidad total de máquinas virtuales' },
              { label: 'Encendidas', desc: 'VMs en estado "Powered On"' },
              { label: 'Apagadas', desc: 'VMs en estado "Powered Off"' },
              { label: 'No Soportadas', desc: 'VMs con SO no soportado' },
              { label: 'Completadas', desc: 'VMs con información completa (Hostname, SO y Ambiente)' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 bg-fuchsia-50 border border-fuchsia-100 rounded-lg">
                <p className="text-xs font-bold text-fuchsia-800">{stat.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{stat.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Almacenamiento de Datos</h3>
          <p className="text-sm font-medium text-gray-700">¿Dónde se guardan mis datos?</p>
          <p className="text-sm text-gray-600">La aplicación <strong>NO</strong> usa base de datos. Sus datos se guardan en:</p>
          <ul className="space-y-1.5">
            <CheckItem><strong>Archivos JSON:</strong> Para guardar y cargar progreso</CheckItem>
            <CheckItem><strong>Archivos Excel:</strong> Para exportar resultados completos</CheckItem>
            <CheckItem><strong>Archivos PDF:</strong> Para reportes ejecutivos</CheckItem>
          </ul>
          <InfoAlert>
            <strong>Importante:</strong> Todos los archivos se guardan en su computadora. No se envía información a ningún servidor externo.
          </InfoAlert>
          <WarnAlert>
            <ul className="space-y-1 text-xs">
              <li>Guarde su progreso frecuentemente (cada 15–20 minutos)</li>
              <li>Si cierra el navegador sin guardar, perderá su trabajo</li>
              <li>Los archivos JSON son texto plano, puede editarlos manualmente si es necesario</li>
              <li>Necesita conexión a internet solo para la primera carga de la página</li>
            </ul>
          </WarnAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Preguntas Frecuentes</h3>
          <div className="space-y-3">
            {[
              {
                q: '¿Puedo usar esta aplicación sin internet?',
                a: 'Necesita internet solo para cargar la página por primera vez (descarga las librerías). Después puede trabajar offline.',
              },
              {
                q: '¿Mis datos están seguros?',
                a: 'Sí, todos los datos se procesan localmente en su navegador. No se envía información a ningún servidor.',
              },
              {
                q: '¿Qué navegador es mejor?',
                a: 'Recomendamos Google Chrome o Microsoft Edge para mejor rendimiento, pero funciona en cualquier navegador moderno.',
              },
              {
                q: '¿Puedo editar múltiples archivos RVTools?',
                a: 'Puede cargar un archivo a la vez. Para múltiples archivos, procese uno, exporte, y luego cargue el siguiente.',
              },
              {
                q: '¿Qué hago si encuentro un error?',
                a: 'Presione F12 para abrir la consola del navegador y vea el mensaje de error. Verifique que su archivo RVTools sea válido y contenga la hoja "vInfo".',
              },
            ].map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                <p className="text-sm text-gray-600 mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>
          <ul className="space-y-1.5">
            <CheckItem>Revise primero las validaciones automáticas</CheckItem>
            <CheckItem>Trabaje por grupos (use filtros por cluster o datacenter)</CheckItem>
            <CheckItem>Complete primero los servidores productivos</CheckItem>
            <CheckItem>Guarde progreso cada 15–20 minutos</CheckItem>
            <CheckItem>Verifique las estadísticas para asegurar completitud</CheckItem>
            <CheckItem>Exporte a Excel y PDF al finalizar</CheckItem>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
