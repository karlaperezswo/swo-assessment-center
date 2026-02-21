import { Database, DatabaseRecommendation } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Database as DatabaseIcon } from 'lucide-react';

interface DatabaseTableProps {
  databases: Database[];
  recommendations?: DatabaseRecommendation[];
}

export function DatabaseTable({ databases, recommendations }: DatabaseTableProps) {
  const getRecommendation = (dbName: string) => {
    return recommendations?.find(r => r.dbName === dbName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="h-5 w-5" />
          Databases ({databases.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-2 font-medium">Database Name</th>
                <th className="text-left p-2 font-medium">Engine</th>
                <th className="text-left p-2 font-medium">Edition</th>
                <th className="text-right p-2 font-medium">Size (GB)</th>
                {recommendations && (
                  <>
                    <th className="text-left p-2 font-medium">Target Service</th>
                    <th className="text-left p-2 font-medium">Instance Class</th>
                    <th className="text-right p-2 font-medium">Est. Cost</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {databases.slice(0, 30).map((db, index) => {
                const rec = getRecommendation(db.dbName);

                return (
                  <tr key={db.databaseId || index} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{db.dbName}</td>
                    <td className="p-2 text-muted-foreground">{db.engineType}</td>
                    <td className="p-2 text-muted-foreground">{db.engineEdition || '-'}</td>
                    <td className="p-2 text-right">{db.totalSize?.toFixed(0) || 0}</td>
                    {recommendations && (
                      <>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {rec?.targetEngine || '-'}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {rec?.instanceClass || '-'}
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
          {databases.length > 30 && (
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Showing 30 of {databases.length} databases
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
