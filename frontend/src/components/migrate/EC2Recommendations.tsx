import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerTable } from '@/components/ServerTable';
import { Server, EC2Recommendation } from '@/types/assessment';
import { Server as ServerIcon } from 'lucide-react';

interface EC2RecommendationsProps {
  servers: Server[];
  recommendations: EC2Recommendation[];
}

export function EC2Recommendations({ servers, recommendations }: EC2RecommendationsProps) {
  if (!servers || servers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ServerIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No server data available</p>
        <p className="text-sm mt-1">Upload your MPA Excel file in the Assess phase</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ServerIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">EC2 Instance Recommendations</h3>
              <p className="text-sm text-amber-700 mt-1">
                Optimized EC2 instance recommendations based on your current server specifications, utilization patterns, and workload requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Server Table */}
      <Card>
        <CardHeader>
          <CardTitle>Server Migration Recommendations ({servers.length} servers)</CardTitle>
        </CardHeader>
        <CardContent>
          <ServerTable servers={servers} recommendations={recommendations} />
        </CardContent>
      </Card>
    </div>
  );
}
