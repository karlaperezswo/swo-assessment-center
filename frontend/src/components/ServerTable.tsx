import { Server, EC2Recommendation } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Server as ServerIcon } from 'lucide-react';

interface ServerTableProps {
  servers: Server[];
  recommendations?: EC2Recommendation[];
}

export function ServerTable({ servers, recommendations }: ServerTableProps) {
  const getRecommendation = (hostname: string) => {
    return recommendations?.find(r => r.hostname === hostname);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ServerIcon className="h-5 w-5" />
          Servers ({servers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Hostname</th>
                <th className="text-left p-2 font-medium">OS</th>
                <th className="text-right p-2 font-medium">vCPUs</th>
                <th className="text-right p-2 font-medium">RAM (GB)</th>
                <th className="text-right p-2 font-medium">Storage (GB)</th>
                <th className="text-right p-2 font-medium">Avg CPU %</th>
                <th className="text-right p-2 font-medium">Avg RAM %</th>
                {recommendations && (
                  <>
                    <th className="text-left p-2 font-medium">Recommended</th>
                    <th className="text-right p-2 font-medium">Est. Cost</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {servers.slice(0, 50).map((server, index) => {
                const rec = getRecommendation(server.hostname);
                const vcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);

                return (
                  <tr key={server.serverId || index} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{server.hostname}</td>
                    <td className="p-2 text-muted-foreground">
                      {server.osName?.substring(0, 20)}
                      {server.osName?.length > 20 ? '...' : ''}
                    </td>
                    <td className="p-2 text-right">{vcpus}</td>
                    <td className="p-2 text-right">{server.totalRAM?.toFixed(0) || 0}</td>
                    <td className="p-2 text-right">{server.totalDiskSize?.toFixed(0) || 0}</td>
                    <td className="p-2 text-right">
                      <span className={server.avgCpuUsage > 80 ? 'text-red-500' : ''}>
                        {server.avgCpuUsage?.toFixed(1) || '-'}
                      </span>
                    </td>
                    <td className="p-2 text-right">
                      <span className={server.avgRamUsage > 80 ? 'text-red-500' : ''}>
                        {server.avgRamUsage?.toFixed(1) || '-'}
                      </span>
                    </td>
                    {recommendations && (
                      <>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {rec?.recommendedInstance || '-'}
                          </span>
                        </td>
                        <td className="p-2 text-right font-medium">
                          ${rec?.monthlyEstimate?.toFixed(2) || '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {servers.length > 50 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Showing 50 of {servers.length} servers
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
