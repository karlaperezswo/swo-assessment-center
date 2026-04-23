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
            <strong>Objetivo:</strong> Crear una representación visual clara que documente la arquitectura actual
            (As-Is) y proponga la arquitectura objetivo en AWS (To-Be).
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
              <CheckItem>Integraciones entre sistemas</CheckItem>
            </ul>
          </div>

          <div className="border-l-4 border-green-300 pl-4 space-y-2">
            <h4 className="font-semibold text-gray-800 text-sm">3. Arquitectura Target en AWS (To-Be)</h4>
            <p className="text-xs text-gray-600">Propone la arquitectura objetivo en AWS:</p>
            <ul className="space-y-1.5">
              <CheckItem>VPCs y subnets</CheckItem>
              <CheckItem>Servicios AWS por componente</CheckItem>
              <CheckItem>Conectividad (Direct Connect, VPN)</CheckItem>
              <CheckItem>Estrategia de seguridad en la nube</CheckItem>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardContent className="pt-5 space-y-3">
          <h3 className="font-semibold text-gray-800">Herramientas Recomendadas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {['draw.io / diagrams.net', 'AWS Architecture Icons', 'Lucidchart', 'Microsoft Visio', 'Miro', 'Creately'].map((tool) => (
              <div key={tool} className="p-2 bg-gray-50 border rounded-lg text-sm text-gray-700 text-center">{tool}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
