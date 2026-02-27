import { useState, useMemo } from 'react';
import { Application } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AppWindow } from 'lucide-react';

interface ApplicationTableProps {
  applications: Application[];
}

export function ApplicationTable({ applications }: ApplicationTableProps) {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('all');

  // Get unique environments from applications
  const environments = useMemo(() => {
    const envSet = new Set<string>();
    applications.forEach(app => {
      if (app.environmentType) {
        envSet.add(app.environmentType);
      }
    });
    return Array.from(envSet).sort();
  }, [applications]);

  // Filter applications based on selected environment
  const filteredApplications = useMemo(() => {
    if (selectedEnvironment === 'all') {
      return applications;
    }
    return applications.filter(app => app.environmentType === selectedEnvironment);
  }, [applications, selectedEnvironment]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="h-5 w-5" />
            Aplicaciones ({filteredApplications.length})
          </CardTitle>
          <Select value={selectedEnvironment} onValueChange={setSelectedEnvironment}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filtrar por ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los Ambientes</SelectItem>
              {environments.map(env => (
                <SelectItem key={env} value={env}>
                  {env}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Nombre de Aplicación</th>
                <th className="text-left p-2 font-medium">Tipo</th>
                <th className="text-right p-2 font-medium">Conexiones Totales</th>
                <th className="text-right p-2 font-medium">Entrantes</th>
                <th className="text-right p-2 font-medium">Salientes</th>
                <th className="text-left p-2 font-medium">Ambiente</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((app, index) => (
                <tr key={app.appId || index} className="border-b hover:bg-muted/30">
                  <td className="p-2 font-medium">{app.name}</td>
                  <td className="p-2 text-muted-foreground">{app.type || '-'}</td>
                  <td className="p-2 text-right">{app.totalConnections || 0}</td>
                  <td className="p-2 text-right">{app.inboundConnections || 0}</td>
                  <td className="p-2 text-right">{app.outboundConnections || 0}</td>
                  <td className="p-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      app.environmentType?.toLowerCase().includes('prod')
                        ? 'bg-red-100 text-red-800'
                        : app.environmentType?.toLowerCase().includes('dev')
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {app.environmentType || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredApplications.length === 0 && (
            <p className="text-sm text-muted-foreground mt-2 text-center py-4">
              No se encontraron aplicaciones para el ambiente seleccionado
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
