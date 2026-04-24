import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetworkTransferData } from '@/types/assessment';
import { Network, TrendingUp } from 'lucide-react';
import { formatSpanishNumber } from '@/lib/numberFormat';
import { useTranslation } from '@/i18n/useTranslation';

interface NetworkTransferChartProps {
  networkTransfer: NetworkTransferData[];
}

export function NetworkTransferChart({ networkTransfer }: NetworkTransferChartProps) {
  const { t } = useTranslation();
  const formatPercent = (num: number): string => {
    return `${num.toFixed(2).replace('.', ',')}%`;
  };

  // Find max transfer for scaling bars
  const maxTransfer = Math.max(...networkTransfer.map(n => n.transferGB));

  // Calculate total transfer
  const totalTransfer = networkTransfer.reduce((sum, n) => sum + n.transferGB, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-cyan-600" />
          {t('networkTransferChart.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-cyan-600" />
            <div>
              <p className="text-sm font-medium text-cyan-900">
                {t('networkTransferChart.totalLabel')}{' '}
                <span className="text-lg font-bold">{formatSpanishNumber(totalTransfer)} GB/mes</span>
                {totalTransfer >= 1000 && (
                  <span className="text-lg font-bold text-cyan-700">
                    {' '}({formatSpanishNumber(parseFloat((totalTransfer / 1024).toFixed(2)))} TB)
                  </span>
                )}
              </p>
              <p className="text-xs text-cyan-700 mt-1">
                {t('networkTransferChart.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="space-y-4">
          {networkTransfer.map((server, index) => (
            <div key={server.serverName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-semibold text-gray-700 w-6">
                    #{index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[300px]" title={server.serverName}>
                    {server.serverName}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-cyan-600 min-w-[120px] text-right">
                    {formatSpanishNumber(server.transferGB)} GB/mes
                    {server.transferGB >= 1000 && (
                      <span className="text-gray-500 font-normal">
                        {' '}({formatSpanishNumber(parseFloat((server.transferGB / 1024).toFixed(2)))} TB)
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-gray-600 min-w-[60px] text-right">
                    {formatPercent(server.percentage)}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-cyan-600 transition-all duration-500 ease-out flex items-center justify-end pr-3"
                  style={{ width: `${(server.transferGB / maxTransfer) * 100}%` }}
                >
                  {server.percentage > 5 && (
                    <span className="text-xs font-semibold text-white">
                      {formatPercent(server.percentage)}
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
            {t('networkTransferChart.noteLabel')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
