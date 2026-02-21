import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApplicationTable } from '@/components/ApplicationTable';
import { ExcelData } from '@/types/assessment';
import { Database, Server, AppWindow, HardDrive } from 'lucide-react';


interface DiscoveryPlanningProps {
  excelData: ExcelData | null;
  totalStorageGB: number;
}

export function DiscoveryPlanning({ excelData, totalStorageGB }: DiscoveryPlanningProps) {
  if (!excelData) {
    return (
      <div className="text-center py-12 text-gray-400">
        <AppWindow className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No inventory data available</p>
        <p className="text-sm mt-1">Upload your MPA Excel file in the Assess phase</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Infrastructure Overview */}
      <Card className="bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
        <CardHeader>
          <CardTitle className="text-violet-900">Infrastructure Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border border-violet-100">
              <Server className="h-8 w-8 text-blue-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{excelData.servers.length}</p>
              <p className="text-sm text-gray-600">Servers</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-violet-100">
              <Database className="h-8 w-8 text-green-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{excelData.databases.length}</p>
              <p className="text-sm text-gray-600">Databases</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-violet-100">
              <AppWindow className="h-8 w-8 text-purple-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{excelData.applications.length}</p>
              <p className="text-sm text-gray-600">Applications</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-violet-100">
              <HardDrive className="h-8 w-8 text-orange-600 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{(totalStorageGB / 1024).toFixed(1)} TB</p>
              <p className="text-sm text-gray-600">Total Storage</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Portfolio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AppWindow className="h-5 w-5 text-violet-600" />
            Application Portfolio Detail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationTable applications={excelData.applications} />
        </CardContent>
      </Card>

      {/* OS Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Operating System Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const osGroups = excelData.servers.reduce((acc, server) => {
                const os = server.osName || 'Unknown';
                acc[os] = (acc[os] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              return Object.entries(osGroups).map(([os, count]) => (
                <div key={os} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm text-gray-700">{os}</span>
                  <span className="text-sm text-gray-500">{count} servers ({Math.round((count / excelData.servers.length) * 100)}%)</span>
                </div>
              ));
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
