import { Mail, Phone, ExternalLink, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function WikiContacto() {
  return (
    <div className="space-y-5">
      <Card className="border-fuchsia-100">
        <CardContent className="pt-5">
          <p className="text-sm text-gray-700">
            Encuentra aquí los recursos y contactos necesarios para obtener ayuda durante tu proyecto de MAP Assessment.
          </p>
        </CardContent>
      </Card>

      <Card className="border-fuchsia-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Users className="h-4 w-4 text-fuchsia-500" />
            Equipo de MAP Assessment – SoftwareONE
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-fuchsia-50">
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Rol</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Nombre</th>
                  <th className="text-left p-2 font-semibold text-fuchsia-800">Contacto</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { rol: 'Director de Práctica MAP', nombre: '[Nombre]', email: '[email]@softwareone.com' },
                  { rol: 'Gerente de Programa MAP', nombre: '[Nombre]', email: '[email]@softwareone.com' },
                  { rol: 'Arquitecto Principal AWS', nombre: '[Nombre]', email: '[email]@softwareone.com' },
                  { rol: 'Especialista en Herramientas', nombre: '[Nombre]', email: '[email]@softwareone.com' },
                ].map((row, i) => (
                  <tr key={row.rol} className={`border-t ${i % 2 === 1 ? 'bg-gray-50' : ''}`}>
                    <td className="p-2 text-gray-700 font-medium">{row.rol}</td>
                    <td className="p-2 text-gray-600">{row.nombre}</td>
                    <td className="p-2">
                      <span className="flex items-center gap-1 text-fuchsia-600 text-xs">
                        <Mail className="h-3 w-3" />
                        {row.email}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="border-fuchsia-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Soporte Técnico AWS</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <a
              href="https://aws.amazon.com/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-fuchsia-700 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              AWS Contact Us
            </a>
            <a
              href="https://console.aws.amazon.com/support/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-fuchsia-700 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              AWS Support Console
            </a>
          </CardContent>
        </Card>

        <Card className="border-fuchsia-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-800">Recursos de Apoyo</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <a
              href="https://aws.amazon.com/migration-acceleration-program/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-fuchsia-700 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Documentación Oficial MAP
            </a>
            <a
              href="https://aws.amazon.com/partners/programs/migration/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-fuchsia-700 hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              AWS Partner Migration Program
            </a>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-fuchsia-50 border-fuchsia-200">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="h-4 w-4 text-fuchsia-600" />
            <p className="text-sm font-semibold text-fuchsia-800">Línea de Soporte SoftwareONE</p>
          </div>
          <p className="text-sm text-fuchsia-700">
            Para soporte urgente durante la ejecución de un assessment, contacta al equipo de práctica MAP a través
            de los canales internos de comunicación de SoftwareONE.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
