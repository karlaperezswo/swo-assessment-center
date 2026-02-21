import { BusinessCaseMetrics } from '@/components/BusinessCaseMetrics';
import { Card, CardContent } from '@/components/ui/card';
import { ExcelData, UploadSummary } from '@/types/assessment';
import { Gauge, Info } from 'lucide-react';

interface MigrationReadinessProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  migrationReadiness: string;
}

export function MigrationReadiness({ excelData, uploadSummary, migrationReadiness }: MigrationReadinessProps) {
  if (!excelData) {
    return (
      <Card className="border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-white">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Gauge className="h-12 w-12 text-fuchsia-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Migration Readiness Assessment</h3>
          <p className="text-sm text-gray-500">Upload your MPA data first to assess migration readiness.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* MRA Intro */}
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900">Migration Readiness Assessment (MRA)</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                The MRA evaluates your organization's readiness across infrastructure complexity, team capabilities,
                and operational requirements to determine the optimal migration approach and timeline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing BusinessCaseMetrics component */}
      <BusinessCaseMetrics
        serverCount={excelData.servers.length}
        databaseCount={excelData.databases.length}
        applicationCount={excelData.applications.length}
        totalStorageGB={uploadSummary?.totalStorageGB || 0}
        migrationReadiness={migrationReadiness}
      />
    </div>
  );
}
