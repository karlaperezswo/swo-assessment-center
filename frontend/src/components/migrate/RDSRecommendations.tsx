import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatabaseTable } from '@/components/DatabaseTable';
import { Database, DatabaseRecommendation } from '@/types/assessment';
import { Database as DatabaseIcon } from 'lucide-react';

interface RDSRecommendationsProps {
  databases: Database[];
  recommendations: DatabaseRecommendation[];
}

export function RDSRecommendations({ databases, recommendations }: RDSRecommendationsProps) {
  if (!databases || databases.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <DatabaseIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No database data available</p>
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
            <DatabaseIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Amazon RDS Recommendations</h3>
              <p className="text-sm text-amber-700 mt-1">
                Managed database recommendations with Amazon RDS, including instance sizing, storage, and licensing considerations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Table */}
      <Card>
        <CardHeader>
          <CardTitle>Database Migration Recommendations ({databases.length} databases)</CardTitle>
        </CardHeader>
        <CardContent>
          <DatabaseTable databases={databases} recommendations={recommendations} />
        </CardContent>
      </Card>
    </div>
  );
}
