import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SQLLicensingData, SQLLicensingSummary, DEFAULT_SQL_PRICES } from '@/types/assessment';
import { Database, RefreshCw, Info, DollarSign } from 'lucide-react';
import { formatSpanishNumber, parseSpanishNumber, formatInputValue, formatOnBlur } from '@/lib/numberFormat';

interface SQLLicensingTableProps {
  sqlLicensing: SQLLicensingData[];
  sqlLicensingSummary: SQLLicensingSummary;
}

export function SQLLicensingTable({ sqlLicensing, sqlLicensingSummary }: SQLLicensingTableProps) {
  // State for editable prices
  const [prices, setPrices] = useState<{ [key: string]: number }>({});
  const [priceDisplays, setPriceDisplays] = useState<{ [key: string]: string }>({});
  
  // State for recalculated data
  const [recalculatedData, setRecalculatedData] = useState<SQLLicensingData[]>(sqlLicensing);
  const [recalculatedSummary, setRecalculatedSummary] = useState<SQLLicensingSummary>(sqlLicensingSummary);

  // Initialize prices from data
  useEffect(() => {
    const initialPrices: { [key: string]: number } = {};
    const initialDisplays: { [key: string]: string } = {};
    
    sqlLicensing.forEach(item => {
      initialPrices[item.edition] = item.listPrice;
      initialDisplays[item.edition] = formatSpanishNumber(item.listPrice);
    });
    
    setPrices(initialPrices);
    setPriceDisplays(initialDisplays);
  }, [sqlLicensing]);

  // Recalculate costs when prices change
  useEffect(() => {
    const newData = sqlLicensing.map(item => {
      const listPrice = prices[item.edition] || item.listPrice;
      const observedCost = (item.observedVCPUs / 2) * listPrice;
      const recommendedCost = (item.recommendedVCPUs / 2) * listPrice;
      const savings = observedCost - recommendedCost;
      const savingsPercent = observedCost > 0 ? ((savings / observedCost) * 100) : 0;

      return {
        ...item,
        listPrice,
        observedCost,
        recommendedCost,
        savings,
        savingsPercent
      };
    });

    // Recalculate summary
    const totalObservedCost = newData.reduce((sum, item) => sum + item.observedCost, 0);
    const totalRecommendedCost = newData.reduce((sum, item) => sum + item.recommendedCost, 0);
    const totalSavings = totalObservedCost - totalRecommendedCost;
    const totalSavingsPercent = totalObservedCost > 0 ? ((totalSavings / totalObservedCost) * 100) : 0;

    setRecalculatedData(newData);
    setRecalculatedSummary({
      ...sqlLicensingSummary,
      totalObservedCost,
      totalRecommendedCost,
      totalSavings,
      totalSavingsPercent
    });
  }, [prices, sqlLicensing, sqlLicensingSummary]);

  const handlePriceChange = (edition: string, value: string) => {
    const formatted = formatInputValue(value);
    setPriceDisplays(prev => ({ ...prev, [edition]: formatted }));
    const numValue = parseSpanishNumber(formatted);
    setPrices(prev => ({ ...prev, [edition]: numValue }));
  };

  const handlePriceBlur = (edition: string, value: string) => {
    const formatted = formatOnBlur(value);
    setPriceDisplays(prev => ({ ...prev, [edition]: formatted }));
    const numValue = parseSpanishNumber(formatted);
    setPrices(prev => ({ ...prev, [edition]: numValue }));
  };

  const handleRestoreOfficialPrices = () => {
    const officialPrices: { [key: string]: number } = {};
    const officialDisplays: { [key: string]: string } = {};
    
    sqlLicensing.forEach(item => {
      const editionLower = item.edition.toLowerCase();
      let officialPrice = DEFAULT_SQL_PRICES['Standard']; // Default
      
      if (editionLower.includes('enterprise')) {
        officialPrice = DEFAULT_SQL_PRICES['Enterprise'];
      } else if (editionLower.includes('standard')) {
        officialPrice = DEFAULT_SQL_PRICES['Standard'];
      } else if (editionLower.includes('web')) {
        officialPrice = DEFAULT_SQL_PRICES['Web'];
      } else if (editionLower.includes('developer')) {
        officialPrice = DEFAULT_SQL_PRICES['Developer'];
      } else if (editionLower.includes('express')) {
        officialPrice = DEFAULT_SQL_PRICES['Express'];
      }
      
      officialPrices[item.edition] = officialPrice;
      officialDisplays[item.edition] = formatSpanishNumber(officialPrice);
    });
    
    setPrices(officialPrices);
    setPriceDisplays(officialDisplays);
  };

  const formatNumber = (num: number): string => {
    return formatSpanishNumber(num);
  };

  const formatCurrency = (num: number): string => {
    return `$${formatSpanishNumber(num)}`;
  };

  const formatPercent = (num: number): string => {
    return `${num.toFixed(2).replace('.', ',')}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Optimización de Licenciamiento SQL Server
          </CardTitle>
          <Button
            onClick={handleRestoreOfficialPrices}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Restaurar Precios Oficiales
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Server Count Summary */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Resumen de Servidores SQL Server</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total SQL Servers</p>
                <p className="text-xl font-bold text-blue-600">{sqlLicensingSummary.totalSQLServers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Developer Edition</p>
                <p className="text-xl font-bold text-green-600">{sqlLicensingSummary.totalDeveloperServers}</p>
                <p className="text-xs text-gray-500">(Gratis)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Express Edition</p>
                <p className="text-xl font-bold text-purple-600">{sqlLicensingSummary.totalExpressServers}</p>
                <p className="text-xs text-gray-500">(Gratis)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Costo Observado</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(recalculatedSummary.totalObservedCost)}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {formatNumber(recalculatedSummary.totalObservedVCPUs)} vCPUs
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Costo Recomendado</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(recalculatedSummary.totalRecommendedCost)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                {formatNumber(recalculatedSummary.totalRecommendedVCPUs)} vCPUs
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">Ahorro Total</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(recalculatedSummary.totalSavings)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {formatPercent(recalculatedSummary.totalSavingsPercent)} de ahorro
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">Edición SQL</TableHead>
                <TableHead className="text-right font-bold">vCPUs Observados</TableHead>
                <TableHead className="text-right font-bold">vCPUs Recomendados</TableHead>
                <TableHead className="text-right font-bold">% Optimización</TableHead>
                <TableHead className="text-right font-bold">Precio Lista (USD/2 cores)</TableHead>
                <TableHead className="text-right font-bold">Costo Observado</TableHead>
                <TableHead className="text-right font-bold">Costo Recomendado</TableHead>
                <TableHead className="text-right font-bold">Ahorro</TableHead>
                <TableHead className="text-right font-bold">% Ahorro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recalculatedData.map((item) => (
                <TableRow 
                  key={item.edition}
                  className={item.isOutOfSupport ? 'bg-red-50' : ''}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.edition}
                      {item.isOutOfSupport && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">
                          Fuera de Soporte
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(item.observedVCPUs)}</TableCell>
                  <TableCell className="text-right">{formatNumber(item.recommendedVCPUs)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      item.optimizationPercent > 0 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {formatPercent(item.optimizationPercent)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="text"
                      value={priceDisplays[item.edition] || ''}
                      onChange={(e) => handlePriceChange(item.edition, e.target.value)}
                      onBlur={(e) => handlePriceBlur(item.edition, e.target.value)}
                      className={`w-32 text-right ${item.isOutOfSupport ? 'bg-red-100 border-red-300' : ''}`}
                      disabled={item.isOutOfSupport}
                    />
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.observedCost)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(item.recommendedCost)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(item.savings)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-green-600">
                      {formatPercent(item.savingsPercent)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Totals Row */}
              <TableRow className="bg-gray-100 font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">{formatNumber(recalculatedSummary.totalObservedVCPUs)}</TableCell>
                <TableCell className="text-right">{formatNumber(recalculatedSummary.totalRecommendedVCPUs)}</TableCell>
                <TableCell className="text-right">
                  <span className="text-green-600">
                    {formatPercent(recalculatedSummary.totalOptimizationPercent)}
                  </span>
                </TableCell>
                <TableCell></TableCell>
                <TableCell className="text-right">{formatCurrency(recalculatedSummary.totalObservedCost)}</TableCell>
                <TableCell className="text-right">{formatCurrency(recalculatedSummary.totalRecommendedCost)}</TableCell>
                <TableCell className="text-right text-green-600">
                  {formatCurrency(recalculatedSummary.totalSavings)}
                </TableCell>
                <TableCell className="text-right text-green-600">
                  {formatPercent(recalculatedSummary.totalSavingsPercent)}
                </TableCell>
              </TableRow>
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
                <li>• Los precios de lista son por cada 2 cores (licenciamiento Microsoft).</li>
                <li>• Los costos se calculan usando la fórmula: (vCPUs / 2) × Precio de Lista.</li>
                <li>• Puedes editar los precios de lista para reflejar negociaciones específicas.</li>
                <li>
                  • Los precios oficiales de Microsoft para <span className="font-semibold">SQL Server 2022</span> son: 
                  Enterprise $15.123, Standard $3.945 (USD). 
                  <a 
                    href="https://www.microsoft.com/es-cl/sql-server/sql-server-2022-pricing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Ver precios oficiales →
                  </a>
                </li>
                <li>• Web Edition requiere consulta con hosting partner, Developer y Express son gratuitas.</li>
                <li className="pt-2 font-semibold text-blue-900">
                  • No se pueden comprar versiones de SQL Server que ya no tienen soporte oficial de Microsoft.
                </li>
                <li>
                  • Las versiones marcadas en <span className="font-semibold text-red-600">ROJO</span> están fuera de soporte y no se pueden adquirir licencias nuevas.
                </li>
                <li>
                  • Al comprar la última versión de SQL Server, puedes hacer downgrade a versiones anteriores soportadas. 
                  <a 
                    href="https://www.microsoft.com/licensing/guidance/Downgrade-rights" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Ver derechos de downgrade →
                  </a>
                </li>
                <li>
                  • Para productos fuera de soporte, consulta la lista oficial de Microsoft: 
                  <a 
                    href="https://www.microsoft.com/en-us/licensing/licensing-programs/isvr-deleted-products-sql-server" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Productos SQL Server eliminados →
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Warning for out of support versions */}
        {recalculatedData.some(item => item.isOutOfSupport) && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Advertencia: Versiones Fuera de Soporte</h4>
                <p className="text-sm text-red-800">
                  Se detectaron versiones de SQL Server que ya no tienen soporte oficial de Microsoft. 
                  Estas versiones están marcadas en rojo y <span className="font-semibold">NO se pueden comprar licencias nuevas</span> para ellas. 
                  Se recomienda planificar la migración a versiones soportadas (SQL Server 2017 o posterior).
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
