import { useState, useEffect } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
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
  const { t } = useTranslation();
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
            {t('sqlLicensingTable.title')}
          </CardTitle>
          <Button
            onClick={handleRestoreOfficialPrices}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            {t('sqlLicensingTable.restoreBtn')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Server Count Summary */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">{t('sqlLicensingTable.serverSummaryTitle')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sqlLicensingTable.totalSQLServers')}</p>
                <p className="text-xl font-bold text-blue-600">{sqlLicensingSummary.totalSQLServers}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sqlLicensingTable.developerEdition')}</p>
                <p className="text-xl font-bold text-green-600">{sqlLicensingSummary.totalDeveloperServers}</p>
                <p className="text-xs text-gray-500">{t('sqlLicensingTable.free')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sqlLicensingTable.expressEdition')}</p>
                <p className="text-xl font-bold text-purple-600">{sqlLicensingSummary.totalExpressServers}</p>
                <p className="text-xs text-gray-500">{t('sqlLicensingTable.free')}</p>
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
                <p className="text-sm font-medium text-blue-900">{t('sqlLicensingTable.observedCost')}</p>
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
                <p className="text-sm font-medium text-green-900">{t('sqlLicensingTable.recommendedCost')}</p>
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
                <p className="text-sm font-medium text-purple-900">{t('sqlLicensingTable.totalSavings')}</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(recalculatedSummary.totalSavings)}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {t('sqlLicensingTable.savingsLabel', { pct: formatPercent(recalculatedSummary.totalSavingsPercent) })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold">{t('sqlLicensingTable.colEdition')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colObservedVCPU')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colRecommendedVCPU')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colOptimPct')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colListPrice')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colObservedCost')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colRecommendedCost')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colSavings')}</TableHead>
                <TableHead className="text-right font-bold">{t('sqlLicensingTable.colSavingsPct')}</TableHead>
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
                          {t('sqlLicensingTable.outOfSupport')}
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
                <TableCell>{t('sqlLicensingTable.total')}</TableCell>
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
              <h4 className="font-semibold text-blue-900 mb-2">{t('sqlLicensingTable.obsTitle')}</h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>{t('sqlLicensingTable.obs1')}</li>
                <li>{t('sqlLicensingTable.obs2')}</li>
                <li>{t('sqlLicensingTable.obs3')}</li>
                <li>
                  {t('sqlLicensingTable.obs4')}
                  <a
                    href="https://www.microsoft.com/es-cl/sql-server/sql-server-2022-pricing"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {t('sqlLicensingTable.obs4Link')}
                  </a>
                </li>
                <li>{t('sqlLicensingTable.obs5')}</li>
                <li>{t('sqlLicensingTable.obs6')}</li>
                <li>
                  {t('sqlLicensingTable.obs7')}
                  <a
                    href="https://www.microsoft.com/licensing/guidance/Downgrade-rights"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {t('sqlLicensingTable.obs7Link')}
                  </a>
                </li>
                <li>
                  {t('sqlLicensingTable.obs8')}
                  <a
                    href="https://www.microsoft.com/en-us/licensing/licensing-programs/isvr-deleted-products-sql-server"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    {t('sqlLicensingTable.obs8Link')}
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
                <h4 className="font-semibold text-red-900 mb-2">{t('sqlLicensingTable.warnTitle')}</h4>
                <p className="text-sm text-red-800">
                  {t('sqlLicensingTable.warnText')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
