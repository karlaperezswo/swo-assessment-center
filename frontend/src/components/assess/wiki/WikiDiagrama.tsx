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

export function WikiDiagrama() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Diagrama de Infraestructura</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            El diagrama de infraestructura es una representación visual completa del entorno actual del cliente y la
            arquitectura propuesta en AWS. Es un entregable clave que facilita la comprensión del estado actual y
            el estado futuro.
          </p>
          <InfoAlert>
            <strong>Objetivo:</strong> Crear una representación visual clara y precisa que documente la arquitectura
            actual y proponga la arquitectura objetivo en AWS, facilitando la comunicación con stakeholders técnicos
            y de negocio.
          </InfoAlert>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Tipos de Diagramas Requeridos</h3>

          <div className="border-l-4 border-fuchsia-300 pl-4 space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">1. Diagrama de Estado Actual (As-Is)</h4>
            <p className="text-xs text-gray-600">Documenta la infraestructura on-premises existente:</p>
            <ul className="space-y-1.5">
              <CheckItem>Topología de red completa</CheckItem>
              <CheckItem>Servidores físicos y virtuales</CheckItem>
              <CheckItem>Sistemas de almacenamiento</CheckItem>
              <CheckItem>Balanceadores de carga</CheckItem>
              <CheckItem>Firewalls y dispositivos de seguridad</CheckItem>
              <CheckItem>Conexiones entre componentes</CheckItem>
              <CheckItem>Flujos de datos principales</CheckItem>
              <CheckItem>Integraciones con sistemas externos</CheckItem>
            </ul>
          </div>

          <div className="border-l-4 border-purple-300 pl-4 space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">2. Diagrama de Dependencias de Aplicaciones</h4>
            <p className="text-xs text-gray-600">Muestra las relaciones entre aplicaciones y componentes:</p>
            <ul className="space-y-1.5">
              <CheckItem>Aplicaciones y sus componentes</CheckItem>
              <CheckItem>Bases de datos asociadas</CheckItem>
              <CheckItem>Servicios compartidos</CheckItem>
              <CheckItem>APIs y integraciones</CheckItem>
              <CheckItem>Dependencias críticas</CheckItem>
              <CheckItem>Flujos de comunicación</CheckItem>
            </ul>
          </div>

          <div className="border-l-4 border-green-300 pl-4 space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">3. Diagrama de Arquitectura Propuesta en AWS (To-Be)</h4>
            <p className="text-xs text-gray-600">Diseño de la arquitectura objetivo en AWS:</p>
            <ul className="space-y-1.5">
              <CheckItem>Regiones y Availability Zones</CheckItem>
              <CheckItem>VPCs y subnets</CheckItem>
              <CheckItem>Servicios de AWS recomendados (EC2, RDS, S3, etc.)</CheckItem>
              <CheckItem>Componentes de seguridad (Security Groups, NACLs, WAF)</CheckItem>
              <CheckItem>Balanceadores de carga (ALB, NLB)</CheckItem>
              <CheckItem>Servicios de red (Direct Connect, VPN, Transit Gateway)</CheckItem>
              <CheckItem>Servicios de monitoreo y logging</CheckItem>
              <CheckItem>Estrategia de backup y DR</CheckItem>
            </ul>
          </div>

          <div className="border-l-4 border-amber-300 pl-4 space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">4. Diagrama de Migración por Waves</h4>
            <p className="text-xs text-gray-600">Visualización del plan de migración por fases:</p>
            <ul className="space-y-1.5">
              <CheckItem>Agrupación de aplicaciones por wave</CheckItem>
              <CheckItem>Secuencia de migración</CheckItem>
              <CheckItem>Dependencias entre waves</CheckItem>
              <CheckItem>Timeline estimado</CheckItem>
              <CheckItem>Quick wins identificados</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Herramientas Recomendadas</h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Para Diagramas Técnicos</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-fuchsia-50 text-fuchsia-800 text-left">
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Herramienta</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Uso Recomendado</th>
                    <th className="border border-fuchsia-100 px-3 py-2 font-semibold">Ventajas</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tool: 'draw.io (diagrams.net)', use: 'Diagramas generales', adv: 'Gratuito, plantillas AWS, fácil de usar' },
                    { tool: 'Lucidchart', use: 'Diagramas colaborativos', adv: 'Colaboración en tiempo real, integración con AWS' },
                    { tool: 'AWS Architecture Icons', use: 'Iconografía oficial', adv: 'Iconos oficiales actualizados de AWS' },
                    { tool: 'Microsoft Visio', use: 'Diagramas corporativos', adv: 'Estándar corporativo, plantillas profesionales' },
                    { tool: 'CloudCraft', use: 'Arquitecturas AWS 3D', adv: 'Visualización 3D, estimación de costos integrada' },
                  ].map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">{row.tool}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.use}</td>
                      <td className="border border-gray-200 px-3 py-2 text-gray-700">{row.adv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Para Mapeo de Dependencias</h4>
            <ul className="space-y-1.5">
              <CheckItem><strong>AWS Application Discovery Service:</strong> Mapeo automático de dependencias</CheckItem>
              <CheckItem><strong>Cloudamize / Concierto / Matilda:</strong> Exportación de diagramas de dependencias</CheckItem>
              <CheckItem><strong>XMind o MindManager:</strong> Mapas mentales de relaciones complejas</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Mejores Prácticas</h3>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Estándares de Diagramación</h4>
            <ul className="space-y-1.5">
              <CheckItem><strong>Consistencia:</strong> Usa los mismos iconos y colores en todos los diagramas</CheckItem>
              <CheckItem><strong>Claridad:</strong> Evita sobrecargar un solo diagrama, crea vistas por capas</CheckItem>
              <CheckItem><strong>Leyenda:</strong> Incluye siempre una leyenda explicando símbolos y colores</CheckItem>
              <CheckItem><strong>Versionado:</strong> Mantén control de versiones de los diagramas</CheckItem>
              <CheckItem><strong>Escalabilidad:</strong> Diseña para que sea fácil actualizar y expandir</CheckItem>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Niveles de Detalle</h4>
            <p className="text-xs text-gray-600 mb-2">Crea diagramas en múltiples niveles:</p>
            <ul className="space-y-1.5">
              <CheckItem><strong>Nivel 1 – Ejecutivo:</strong> Vista de alto nivel para stakeholders de negocio</CheckItem>
              <CheckItem><strong>Nivel 2 – Arquitectura:</strong> Vista detallada de componentes y servicios</CheckItem>
              <CheckItem><strong>Nivel 3 – Técnico:</strong> Vista con detalles de configuración y networking</CheckItem>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Elementos Esenciales a Incluir</h4>
            <ul className="space-y-1.5">
              <CheckItem>Título y descripción del diagrama</CheckItem>
              <CheckItem>Fecha y versión</CheckItem>
              <CheckItem>Autor y revisor</CheckItem>
              <CheckItem>Leyenda de símbolos y colores</CheckItem>
              <CheckItem>Logos de SoftwareONE y AWS</CheckItem>
              <CheckItem>Notas y aclaraciones importantes</CheckItem>
              <CheckItem>Indicadores de flujo de datos</CheckItem>
              <CheckItem>Zonas de seguridad claramente delimitadas</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-4">
          <h3 className="font-semibold text-gray-800">Proceso de Creación</h3>
          {[
            {
              n: '1', title: 'Recopilación de Información',
              items: [
                'Consolidar datos de herramientas de colecta',
                'Revisar cuestionario de infraestructura',
                'Obtener diagramas existentes del cliente',
                'Validar información con equipo técnico del cliente',
              ],
            },
            {
              n: '2', title: 'Diseño del Estado Actual',
              items: [
                'Crear diagrama de topología de red',
                'Documentar todos los componentes de infraestructura',
                'Mapear dependencias entre aplicaciones',
                'Validar con el cliente',
              ],
            },
            {
              n: '3', title: 'Diseño de Arquitectura AWS',
              items: [
                'Aplicar AWS Well-Architected Framework',
                'Seleccionar servicios AWS apropiados',
                'Diseñar para alta disponibilidad y resiliencia',
                'Incorporar mejores prácticas de seguridad',
                'Optimizar para costos',
              ],
            },
            {
              n: '4', title: 'Revisión y Validación',
              items: [
                'Revisión interna del equipo SoftwareONE',
                'Validación con arquitectos de AWS (si aplica)',
                'Presentación al cliente para feedback',
                'Iteración basada en comentarios',
                'Aprobación final',
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
          <h3 className="font-semibold text-gray-800">Plantillas y Recursos</h3>
          <ul className="space-y-2">
            {[
              '📐 Plantilla de Diagrama As-Is (draw.io)',
              '📐 Plantilla de Arquitectura AWS (draw.io)',
              '📐 Plantilla de Diagrama de Dependencias',
              '📐 Plantilla de Migration Waves',
              '🎨 AWS Architecture Icons (última versión)',
              '📄 Guía de Estándares de Diagramación SoftwareONE',
              '📄 Checklist de Revisión de Diagramas',
            ].map((item) => (
              <li key={item} className="text-sm text-fuchsia-700 bg-fuchsia-50 border border-fuchsia-100 rounded px-3 py-2">{item}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Ejemplos de Referencia</h3>
          <ul className="space-y-2">
            {[
              '🖼️ Ejemplo: Diagrama As-Is - Entorno Mediano',
              '🖼️ Ejemplo: Arquitectura AWS - 3-Tier Application',
              '🖼️ Ejemplo: Diagrama de Dependencias - E-commerce',
              '🖼️ Ejemplo: Migration Waves - 200 Servidores',
            ].map((item) => (
              <li key={item} className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded px-3 py-2">{item}</li>
            ))}
          </ul>
          <InfoAlert>
            <strong>Tip:</strong> Los diagramas deben ser documentos vivos que se actualicen a medida que avanza el proyecto. Mantén versiones históricas para referencia futura.
          </InfoAlert>
        </CardContent>
      </Card>
    </div>
  );
}
