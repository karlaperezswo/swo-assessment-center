import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResourceOptimization } from '@/types/assessment';
import { TrendingUp, Info } from 'lucide-react';
import { formatSpanishNumber } from '@/lib/numberFormat';

interface ResourceOptimizationTableProps {
  resourceOptimization: ResourceOptimization[];
}

export function ResourceOptimizationTable({ resourceOptimization }: ResourceOptimizationTableProps) {
  const formatNumber = (num: number): string => {
    // Use our utility function to ensure consistent Spanish formatting
    return formatSpanishNumber(num);
  };

  // Calculate average optimization (excluding NA values)
  const calculateAverageOptimization = (): string => {
    const validOptimizations = resourceOptimization
      .filter(r => r.optimizationPercent !== 'NA')
      .map(r => parseFloat(r.optimizationPercent.replace(',', '.')));
    
    if (validOptimizations.length === 0) return '0,00';
    
    const sum = validOptimizations.reduce((acc, val) => acc + val, 0);
    const average = sum / validOptimizations.length;
    
    return average.toFixed(2).replace('.', ',');
  };

  const averageOptimization = calculateAverageOptimization();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Optimización de Recursos
          </CardTitle>
          <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-green-800">Promedio de Optimización:</span>
            <span className="text-lg font-bold text-green-600">{averageOptimization}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Recurso</TableHead>
                <TableHead className="text-right font-bold">Observado</TableHead>
                <TableHead className="text-center font-bold" colSpan={4}>
                  Recomendado
                </TableHead>
                <TableHead className="text-right font-bold">% Optimización</TableHead>
              </TableRow>
              <TableRow className="bg-gray-50">
                <TableHead></TableHead>
                <TableHead></TableHead>
                <TableHead className="text-right text-xs">Prod</TableHead>
                <TableHead className="text-right text-xs">Dev</TableHead>
                <TableHead className="text-right text-xs">QA</TableHead>
                <TableHead className="text-right text-xs">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resourceOptimization.map((resource) => (
                <TableRow key={resource.resource}>
                  <TableCell className="font-medium">{resource.resource}</TableCell>
                  <TableCell className="text-right">{formatNumber(resource.observed)}</TableCell>
                  <TableCell className="text-right">{formatNumber(resource.recommendedProd)}</TableCell>
                  <TableCell className="text-right">{formatNumber(resource.recommendedDev)}</TableCell>
                  <TableCell className="text-right">{formatNumber(resource.recommendedQA)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatNumber(resource.recommendedTotal)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      resource.optimizationPercent === 'NA' 
                        ? 'text-gray-500' 
                        : parseFloat(resource.optimizationPercent) > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      {resource.optimizationPercent}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Observations Section */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Observaciones:</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Los recursos de RAM, Storage y Network se muestran en GB.</li>
                <li>• Las recomendaciones están en base a 1 año optimizado.</li>
                <li>• La información de red considera el total de datos transferidos por los servidores durante el tiempo de la ejecución del Assessment.</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
