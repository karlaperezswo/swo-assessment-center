import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SupportRiskSummary, OSSupportRiskData } from '@/types/assessment';
import { AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { formatSpanishNumber } from '@/lib/numberFormat';

interface SupportRiskAnalysisProps {
  supportRisk: SupportRiskSummary;
}

const TODAY = new Date('2026-03-23');
const ONE_YEAR_FROM_NOW = new Date(TODAY);
ONE_YEAR_FROM_NOW.setFullYear(ONE_YEAR_FROM_NOW.getFullYear() + 1);

/** Row highlight based on support status and end date */
function getRowHighlight(item: OSSupportRiskData): string {
  if (item.supportCycle === 'Unsupported') return 'bg-red-50 border-l-4 border-red-500';
  if (item.supportCycle === 'Extended Support') return 'bg-orange-50 border-l-4 border-orange-400';
  if (item.endOfSupport !== '---') {
    const end = new Date(item.endOfSupport);
    if (end <= ONE_YEAR_FROM_NOW) return 'bg-yellow-50 border-l-4 border-yellow-400';
  }
  return '';
}

/** Cycle badge color */
function getCycleBadge(cycle: string): string {
  if (cycle === 'Unsupported') return 'bg-red-100 text-red-800';
  if (cycle === 'Extended Support') return 'bg-orange-100 text-orange-800';
  if (cycle === 'Mainstream Support') return 'bg-green-100 text-green-800';
  return 'bg-blue-100 text-blue-800';
}

/** Determine required action key */
function getRequiredActionKey(item: OSSupportRiskData): { key: string; color: string } {
  if (item.supportCycle === 'Unsupported') {
    return { key: 'actionCannotMigrate', color: 'text-red-700 font-semibold' };
  }
  if (item.supportCycle === 'Extended Support') {
    return { key: 'actionPlanUpdate', color: 'text-orange-700 font-semibold' };
  }
  if (item.endOfSupport !== '---') {
    const end = new Date(item.endOfSupport);
    if (end <= ONE_YEAR_FROM_NOW) {
      return { key: 'actionUpdateFirst', color: 'text-yellow-700 font-semibold' };
    }
  }
  return { key: 'actionReady', color: 'text-green-700' };
}

export function SupportRiskAnalysis({ supportRisk }: SupportRiskAnalysisProps) {
  const { t } = useTranslation();
  const formatPercent = (num: number): string => {
    if (Number.isInteger(num)) return `${num}%`;
    return `${num.toFixed(2).replace('.', ',')}%`;
  };

  const getRiskBadge = (risk: string) => {
    const colors = {
      'High': 'bg-red-100 text-red-800 border-red-300',
      'Med':  'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Low':  'bg-green-100 text-green-800 border-green-300'
    };
    return colors[risk as keyof typeof colors] || colors['Med'];
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'High') return <AlertTriangle className="h-4 w-4" />;
    if (risk === 'Med')  return <Shield className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const renderCategorySection = (
    title: string,
    data: OSSupportRiskData[],
    color: string,
    icon: React.ReactNode
  ) => {
    if (data.length === 0) return null;

    const totalServers = data.reduce((sum, item) => sum + item.count, 0);
    const totalServersLabel = t('supportRiskAnalysis.totalServers', { count: formatSpanishNumber(totalServers) });

    const colors = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
      '#06b6d4', '#6366f1', '#f97316', '#14b8a6', '#a855f7'
    ];

    // SVG donut — starts at top (-90°), full circle
    const cx = 120, cy = 120, r = 100, innerR = 50;
    const toRad = (deg: number) => deg * (Math.PI / 180);

    const slices: { path: string; labelX: number; labelY: number; item: OSSupportRiskData; color: string }[] = [];
    let currentAngle = -90;

    data.forEach((item, index) => {
      const angle = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = cx + r * Math.cos(toRad(startAngle));
      const y1 = cy + r * Math.sin(toRad(startAngle));
      const x2 = cx + r * Math.cos(toRad(endAngle));
      const y2 = cy + r * Math.sin(toRad(endAngle));
      const xi1 = cx + innerR * Math.cos(toRad(startAngle));
      const yi1 = cy + innerR * Math.sin(toRad(startAngle));
      const xi2 = cx + innerR * Math.cos(toRad(endAngle));
      const yi2 = cy + innerR * Math.sin(toRad(endAngle));
      const largeArc = angle > 180 ? 1 : 0;

      const path = [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${xi2} ${yi2}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${xi1} ${yi1}`,
        'Z'
      ].join(' ');

      const midAngle = startAngle + angle / 2;
      const labelR = (r + innerR) / 2;
      const labelX = cx + labelR * Math.cos(toRad(midAngle));
      const labelY = cy + labelR * Math.sin(toRad(midAngle));

      slices.push({ path, labelX, labelY, item, color: colors[index % colors.length] });
    });

    return (
      <Card className={`border-2 border-${color}-200`}>
        <CardHeader className={`bg-${color}-50`}>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            {totalServersLabel}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Table */}
            <div className="lg:col-span-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">{t('supportRiskAnalysis.colVersion')}</TableHead>
                    <TableHead className="text-right font-bold">{t('supportRiskAnalysis.colCount')}</TableHead>
                    <TableHead className="font-bold">{t('supportRiskAnalysis.colSupportCycle')}</TableHead>
                    <TableHead className="font-bold">{t('supportRiskAnalysis.colEndOfSupport')}</TableHead>
                    <TableHead className="text-center font-bold">{t('supportRiskAnalysis.colRisk')}</TableHead>
                    <TableHead className="font-bold">{t('supportRiskAnalysis.colAction')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => {
                    const action = getRequiredActionKey(item);
                    return (
                      <TableRow key={item.version} className={getRowHighlight(item)}>
                        <TableCell className="font-medium">{item.version}</TableCell>
                        <TableCell className="text-right">{formatSpanishNumber(item.count)}</TableCell>
                        <TableCell>
                          <span className={`text-xs px-2 py-1 rounded ${getCycleBadge(item.supportCycle)}`}>
                            {item.supportCycle}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.endOfSupport === '---' ? '---' : new Date(item.endOfSupport).toLocaleDateString('es-ES')}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded border ${getRiskBadge(item.risk)}`}>
                            {getRiskIcon(item.risk)}
                            <span className="text-xs font-semibold">{item.risk}</span>
                          </div>
                        </TableCell>
                        <TableCell className={`text-xs ${action.color}`}>
                          {t(`supportRiskAnalysis.${action.key}`)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pie Chart */}
            <div className="flex flex-col items-center">
              <h4 className="font-semibold text-gray-800 mb-4">{t('supportRiskAnalysis.distByVersion')}</h4>
              <svg viewBox="0 0 240 240" className="w-52 h-52">
                {slices.map((s, index) => (
                  <g key={s.item.version} className="pie-slice-group">
                    <path
                      d={s.path}
                      fill={s.color}
                      stroke="white"
                      strokeWidth="3"
                      className="transition-all duration-300 hover:opacity-90 cursor-pointer"
                      style={{
                        transformOrigin: '120px 120px',
                        animation: `pieSliceIn 0.6s ease-out ${index * 0.1}s both`,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))'
                      }}
                    >
                      <title>{`${s.item.version}: ${formatPercent(s.item.percentage)} (${formatSpanishNumber(s.item.count)} servidores)`}</title>
                    </path>
                    <text
                      x={s.labelX}
                      y={s.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="white"
                      stroke="rgba(0,0,0,0.3)"
                      strokeWidth="2"
                      paintOrder="stroke fill"
                      style={{ animation: `fadeIn 0.4s ease-out ${index * 0.1 + 0.3}s both`, pointerEvents: 'none' }}
                    >
                      {formatPercent(s.item.percentage)}
                    </text>
                  </g>
                ))}
                {/* Center */}
                <circle cx="120" cy="120" r="50" fill="white"
                  style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.1))' }} />
                <text x="120" y="113" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="600"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.8s both' }}>Total</text>
                <text x="120" y="132" textAnchor="middle" fontSize="18" fill="#1f2937" fontWeight="bold"
                  style={{ animation: 'fadeIn 0.4s ease-out 0.9s both' }}>
                  {formatSpanishNumber(totalServers)}
                </text>
              </svg>

              {/* Legend */}
              <div className="mt-2 grid grid-cols-1 gap-2 w-full max-w-sm">
                {data.map((item, index) => (
                  <div
                    key={item.version}
                    className="flex items-center gap-3 text-sm hover:bg-gray-100 p-2 rounded-lg cursor-pointer border border-transparent hover:border-gray-300 transition-all"
                    style={{ animation: `slideInLeft 0.4s ease-out ${index * 0.05 + 0.5}s both` }}
                  >
                    <div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                    <span className="truncate flex-1 font-medium text-gray-700" title={item.version}>
                      {item.version.length > 30 ? item.version.substring(0, 30) + '...' : item.version}
                    </span>
                    <span className="font-bold text-gray-900 min-w-[60px] text-right">{formatPercent(item.percentage)}</span>
                    <span className="text-xs text-gray-500 min-w-[40px] text-right">({formatSpanishNumber(item.count)})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderCategorySection('Windows Server', supportRisk.windowsServers, 'blue',
        <Shield className="h-5 w-5 text-blue-600" />)}
      {renderCategorySection('SQL Server', supportRisk.sqlServers, 'purple',
        <Shield className="h-5 w-5 text-purple-600" />)}
      {renderCategorySection('Linux', supportRisk.linuxServers, 'green',
        <Shield className="h-5 w-5 text-green-600" />)}

      {/* Legend */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-2">{t('supportRiskAnalysis.legendTitle')}</p>
              <ul className="space-y-1 text-xs">
                <li>• {t('supportRiskAnalysis.legendRed')}</li>
                <li>• {t('supportRiskAnalysis.legendOrange')}</li>
                <li>• {t('supportRiskAnalysis.legendYellow')}</li>
                <li>• {t('supportRiskAnalysis.legendGreen')}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
