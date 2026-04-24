import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OSDistribution } from '@/types/assessment';
import { Monitor } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface OSDistributionTableProps {
  osDistribution: OSDistribution[];
}

export function OSDistributionTable({ osDistribution }: OSDistributionTableProps) {
  const { t } = useTranslation();

  const totals = osDistribution.reduce(
      (acc, os) => ({
        prod: acc.prod + os.prod,
        dev: acc.dev + os.dev,
        qa: acc.qa + os.qa,
        total: acc.total + os.total,
      }),
      { prod: 0, dev: 0, qa: 0, total: 0 }
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          {t('discoveryPlanning.osDistributionTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="text-left p-3 font-semibold text-gray-700">{t('discoveryPlanning.osColumn')}</th>
                <th className="text-center p-3 font-semibold text-gray-700">Prod</th>
                <th className="text-center p-3 font-semibold text-gray-700">Dev</th>
                <th className="text-center p-3 font-semibold text-gray-700">QA</th>
                <th className="text-center p-3 font-semibold text-gray-700">{t('costs.total')}</th>
              </tr>
            </thead>
            <tbody>
              {osDistribution.map((os, index) => {
                const isSQLRow = os.osVersion.includes(' with SQL ');
                return (
                  <tr
                    key={index}
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${isSQLRow ? 'bg-orange-50/40' : ''}`}
                  >
                    <td className={`p-3 ${isSQLRow ? 'pl-6 text-orange-800 italic' : 'text-gray-900'}`}>
                      {os.osVersion}
                    </td>
                    <td className="p-3 text-center text-gray-700">{os.prod}</td>
                    <td className="p-3 text-center text-gray-700">{os.dev}</td>
                    <td className="p-3 text-center text-gray-700">{os.qa}</td>
                    <td className="p-3 text-center font-semibold text-gray-900">{os.total}</td>
                  </tr>
                );
              })}
              <tr className="bg-blue-50 border-t-2 border-blue-300 font-bold">
                <td className="p-3 text-blue-900">{t('costs.total')}</td>
                <td className="p-3 text-center text-blue-900">{totals.prod}</td>
                <td className="p-3 text-center text-blue-900">{totals.dev}</td>
                <td className="p-3 text-center text-blue-900">{totals.qa}</td>
                <td className="p-3 text-center text-blue-900">{totals.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
