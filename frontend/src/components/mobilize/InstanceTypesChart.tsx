import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstanceTypeData } from '@/types/assessment';
import { Server, TrendingUp } from 'lucide-react';
import { formatSpanishNumber } from '@/lib/numberFormat';

interface InstanceTypesChartProps {
  instanceTypes: InstanceTypeData[];
}

export function InstanceTypesChart({ instanceTypes }: InstanceTypesChartProps) {
  const formatPercent = (num: number): string => {
    return `${num.toFixed(2).replace('.', ',')}%`;
  };

  // Find max count for scaling bars
  const maxCount = Math.max(...instanceTypes.map(i => i.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5 text-indigo-600" />
          Top 10 Tipos de Instancias Recomendadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-indigo-900">
                Total de instancias analizadas: <span className="text-lg font-bold">{formatSpanishNumber(instanceTypes.reduce((sum, i) => sum + i.count, 0))}</span>
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                Mostrando las 10 instancias más recomendadas
              </p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {instanceTypes.map((instance, index) => (
            <div key={instance.instanceType} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-semibold text-gray-700 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 min-w-[120px]">
                    {instance.instanceType}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-indigo-600 min-w-[80px] text-right">
                    {formatSpanishNumber(instance.count)} servidores
                  </span>
                  <span className="text-sm font-medium text-gray-600 min-w-[60px] text-right">
                    {formatPercent(instance.percentage)}
                  </span>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${(instance.count / maxCount) * 100}%` }}
                >
                  {instance.percentage > 5 && (
                    <span className="text-xs font-semibold text-white">
                      {formatPercent(instance.percentage)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Nota:</span> Las instancias recomendadas se basan en el análisis de Cloudamize 
            considerando los recursos observados (vCPU, RAM, Storage) y las características de carga de trabajo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
