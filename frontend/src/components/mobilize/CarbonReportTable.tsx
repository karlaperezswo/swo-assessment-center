import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CarbonReportData } from '@/types/assessment';
import { Leaf } from 'lucide-react';
import { formatSpanishNumber } from '@/lib/numberFormat';

interface CarbonReportTableProps {
  carbonData: CarbonReportData;
}

export function CarbonReportTable({ carbonData }: CarbonReportTableProps) {
  const formatCarbon = (value: number): string => {
    return formatSpanishNumber(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2).replace('.', ',')}%`;
  };

  // Pie chart: only "Uso en AWS" + "Ahorro de Carbono" (they sum to currentUsage)
  const total = carbonData.awsUsage + carbonData.savings;
  const awsAngle = total > 0 ? (carbonData.awsUsage / total) * 360 : 0;

  // SVG donut helpers — 30% larger: 160 → 208, r: 60 → 78, innerR: 36 → 47
  const cx = 104, cy = 104, r = 78, innerR = 47;
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const polarToXY = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(toRad(angle)),
    y: cy + radius * Math.sin(toRad(angle)),
  });

  const describeSlice = (startAngle: number, endAngle: number) => {
    const outerStart = polarToXY(startAngle, r);
    const outerEnd = polarToXY(endAngle, r);
    const innerStart = polarToXY(startAngle, innerR);
    const innerEnd = polarToXY(endAngle, innerR);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ');
  };

  const awsSlice = describeSlice(0, awsAngle);
  const savingsSlice = describeSlice(awsAngle, 360);
  const savingsPct = total > 0 ? (carbonData.savings / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-green-600" />
          Reporte de Carbonización
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-gray-200 bg-gray-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-800">Uso Actual</p>
                <p className="text-2xl font-bold text-gray-600">{formatCarbon(carbonData.currentUsage)}</p>
                <p className="text-xs text-gray-600 mt-1">kgCO2eq</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-blue-800">Uso en AWS</p>
                <p className="text-2xl font-bold text-blue-600">{formatCarbon(carbonData.awsUsage)}</p>
                <p className="text-xs text-blue-700 mt-1">kgCO2eq</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="text-center">
                <p className="text-sm font-medium text-green-800">Ahorro</p>
                <p className="text-2xl font-bold text-green-600">{formatCarbon(carbonData.savings)}</p>
                <p className="text-xs text-green-700 mt-1">
                  kgCO2eq ({formatPercent(carbonData.savingsPercent)})
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Métrica</TableHead>
                <TableHead className="text-right font-bold">Valor (kgCO2eq)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Uso Actual (On-Premises)</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCarbon(carbonData.currentUsage)} (100,00%)
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Uso en AWS</TableCell>
                <TableCell className="text-right font-semibold text-blue-600">
                  {formatCarbon(carbonData.awsUsage)} ({formatPercent(total > 0 ? (carbonData.awsUsage / total) * 100 : 0)})
                </TableCell>
              </TableRow>
              <TableRow className="bg-green-50">
                <TableCell className="font-bold text-green-800">Ahorro de Carbono</TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  {formatCarbon(carbonData.savings)} ({formatPercent(carbonData.savingsPercent)})
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Pie Chart */}
        <div className="flex flex-col items-center gap-4 my-6">
          <svg width="208" height="208" viewBox="0 0 208 208">
            {/* Savings slice (green) */}
            <path d={savingsSlice} fill="#22c55e" />
            {/* AWS slice (blue) */}
            <path d={awsSlice} fill="#3b82f6" />
            {/* Center label */}
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#166534">
              Ahorro
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#166534">
              {formatPercent(savingsPct)}
            </text>
          </svg>
          {/* Legend */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">Uso en AWS</span>
              <span className="font-semibold text-blue-700">
                {formatCarbon(carbonData.awsUsage)} kgCO2eq ({formatPercent(total > 0 ? (carbonData.awsUsage / total) * 100 : 0)})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-700">Ahorro de Carbono</span>
              <span className="font-semibold text-green-700">
                {formatCarbon(carbonData.savings)} kgCO2eq ({formatPercent(savingsPct)})
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Leaf className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm text-green-800">
              <p className="font-semibold">Impacto Ambiental:</p>
              <p>
                La migración a AWS reduce las emisiones de carbono en <span className="font-bold">{formatCarbon(carbonData.savings)} kgCO2eq</span>,
                lo que representa una reducción del <span className="font-bold">{formatPercent(carbonData.savingsPercent)}</span> en comparación con la infraestructura actual.
              </p>
              <p className="text-xs text-green-700 mt-2">
                * kgCO2eq = Kilogramos de dióxido de carbono equivalente
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
