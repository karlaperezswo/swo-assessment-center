import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OSDistributionTable } from './OSDistributionTable';
import { ResourceOptimizationTable } from './ResourceOptimizationTable';
import { MigrationStrategyTable } from './MigrationStrategyTable';
import { CarbonReportTable } from './CarbonReportTable';
import { SQLLicensingTable } from './SQLLicensingTable';
import { InstanceTypesChart } from './InstanceTypesChart';
import { NetworkTransferChart } from './NetworkTransferChart';
import { SupportRiskAnalysis } from './SupportRiskAnalysis';
import { TCOCostInput } from './TCOCostInput';
import { TCOChart } from './TCOChart';
import {
  BusinessCaseUploadResponse,
  BusinessCaseClientData,
  TCO1YearUploadResponse,
  CarbonReportUploadResponse,
} from '@/types/assessment';
import { TrendingUp, Briefcase, Leaf, Map as MapIcon, Paperclip, Calculator } from 'lucide-react';
import { AwsCalculator } from './AwsCalculator';

export interface BusinessCaseResultsProps {
  businessCaseData: BusinessCaseUploadResponse | null;
  tco1YearData: TCO1YearUploadResponse | null;
  carbonReportData: CarbonReportUploadResponse | null;
  clientData: BusinessCaseClientData;
  onDemandAsIs: number;
  oneYearOptimized: number;
  threeYearOptimized: number;
  onDemandAsIsRDS: number;
  oneYearOptimizedRDS: number;
  threeYearOptimizedRDS: number;
  enableRDSScenario: boolean;
  onFieldChange: <K extends
    | 'onDemandAsIs'
    | 'oneYearOptimized'
    | 'threeYearOptimized'
    | 'onDemandAsIsRDS'
    | 'oneYearOptimizedRDS'
    | 'threeYearOptimizedRDS'
    | 'enableRDSScenario'>(key: K, value: K extends 'enableRDSScenario' ? boolean : number) => void;
}

export function BusinessCaseResults(props: BusinessCaseResultsProps) {
  const {
    businessCaseData,
    tco1YearData,
    carbonReportData,
    clientData,
    onDemandAsIs,
    oneYearOptimized,
    threeYearOptimized,
    onDemandAsIsRDS,
    oneYearOptimizedRDS,
    threeYearOptimizedRDS,
    enableRDSScenario,
    onFieldChange,
  } = props;

  const hasSummary = !!businessCaseData;
  const hasStrategy =
    !!tco1YearData &&
    !!tco1YearData.tco1YearData.migrationStrategies &&
    !!tco1YearData.tco1YearData.migrationSummary;
  const hasCarbon = !!carbonReportData;
  const hasAnexos =
    !!tco1YearData &&
    (!!tco1YearData.tco1YearData.sqlLicensing ||
      !!tco1YearData.tco1YearData.instanceTypes ||
      !!tco1YearData.tco1YearData.networkTransfer ||
      !!tco1YearData.tco1YearData.supportRisk);

  // Pick the first available tab so deep-links land somewhere real.
  const firstTab = hasSummary
    ? 'summary'
    : tco1YearData
    ? 'tco'
    : hasCarbon
    ? 'carbon'
    : hasAnexos
    ? 'anexos'
    : 'tco';

  return (
    <Tabs defaultValue={firstTab} className="w-full">
      <TabsList className="flex flex-wrap h-auto gap-1 justify-start">
        <TabsTrigger value="summary" disabled={!hasSummary} className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Resumen
        </TabsTrigger>
        <TabsTrigger value="tco" className="flex items-center gap-1.5">
          <Briefcase className="h-3.5 w-3.5" />
          TCO
        </TabsTrigger>
        <TabsTrigger value="strategy" disabled={!hasStrategy} className="flex items-center gap-1.5">
          <MapIcon className="h-3.5 w-3.5" />
          Estrategia
        </TabsTrigger>
        <TabsTrigger value="carbon" disabled={!hasCarbon} className="flex items-center gap-1.5">
          <Leaf className="h-3.5 w-3.5" />
          Carbono
        </TabsTrigger>
        <TabsTrigger value="anexos" disabled={!hasAnexos} className="flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5" />
          Anexos
        </TabsTrigger>
        <TabsTrigger value="calculadora" className="flex items-center gap-1.5">
          <Calculator className="h-3.5 w-3.5" />
          Calculadora AWS
        </TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="space-y-6">
        {businessCaseData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryStat
                label="Total Servidores"
                value={businessCaseData.summary.totalServers}
                color="blue"
              />
              <SummaryStat
                label="Producción"
                value={businessCaseData.summary.prodServers}
                color="green"
              />
              <SummaryStat
                label="Desarrollo"
                value={businessCaseData.summary.devServers}
                color="yellow"
              />
              <SummaryStat label="QA" value={businessCaseData.summary.qaServers} color="purple" />
            </div>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Distribución de Sistemas Operativos
                </h3>
                <OSDistributionTable osDistribution={businessCaseData.businessCaseData.osDistribution} />
              </CardContent>
            </Card>

            {tco1YearData && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Optimización de Recursos
                  </h3>
                  <ResourceOptimizationTable
                    resourceOptimization={tco1YearData.tco1YearData.resourceOptimization}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="tco" className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TCOCostInput
                title={enableRDSScenario ? 'Costos Anuales AWS - EC2 (USD)' : 'Costos Anuales AWS (USD)'}
                onDemandAsIs={onDemandAsIs}
                oneYearOptimized={oneYearOptimized}
                threeYearOptimized={threeYearOptimized}
                onOnDemandAsIsChange={(v) => onFieldChange('onDemandAsIs', v)}
                onOneYearOptimizedChange={(v) => onFieldChange('oneYearOptimized', v)}
                onThreeYearOptimizedChange={(v) => onFieldChange('threeYearOptimized', v)}
              />
              <TCOChart
                title={enableRDSScenario ? 'Costo Anual EC2 en USD (ARR)' : 'Costo Anual en USD (ARR)'}
                onPremisesCost={clientData.onPremisesCost}
                onDemandAsIs={onDemandAsIs}
                oneYearOptimized={oneYearOptimized}
                threeYearOptimized={threeYearOptimized}
              />
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <input
                type="checkbox"
                id="enableRDS"
                checked={enableRDSScenario}
                onChange={(e) => onFieldChange('enableRDSScenario', e.target.checked)}
                className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="enableRDS" className="text-sm font-medium text-blue-900 cursor-pointer">
                Incluir escenario con RDS (bases de datos)
              </label>
            </div>

            {enableRDSScenario && (
              <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  TCO - RDS
                </h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TCOCostInput
                    title="Costos Anuales AWS - RDS (USD)"
                    onDemandAsIs={onDemandAsIsRDS}
                    oneYearOptimized={oneYearOptimizedRDS}
                    threeYearOptimized={threeYearOptimizedRDS}
                    onOnDemandAsIsChange={(v) => onFieldChange('onDemandAsIsRDS', v)}
                    onOneYearOptimizedChange={(v) => onFieldChange('oneYearOptimizedRDS', v)}
                    onThreeYearOptimizedChange={(v) => onFieldChange('threeYearOptimizedRDS', v)}
                  />
                  <TCOChart
                    title="Costo Anual RDS en USD (ARR)"
                    onPremisesCost={clientData.onPremisesCost}
                    onDemandAsIs={onDemandAsIsRDS}
                    oneYearOptimized={oneYearOptimizedRDS}
                    threeYearOptimized={threeYearOptimizedRDS}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="strategy">
        {hasStrategy && tco1YearData && (
          <Card>
            <CardContent className="pt-6">
              <MigrationStrategyTable
                migrationStrategies={tco1YearData.tco1YearData.migrationStrategies!}
                migrationSummary={tco1YearData.tco1YearData.migrationSummary!}
              />
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="carbon">
        {carbonReportData && (
          <Card>
            <CardContent className="pt-6">
              <CarbonReportTable carbonData={carbonReportData.carbonData} />
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="anexos" className="space-y-4">
        {tco1YearData?.tco1YearData.sqlLicensing && tco1YearData.tco1YearData.sqlLicensingSummary && (
          <Card className="border-2 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Optimización de Licenciamiento SQL Server
              </h3>
              <SQLLicensingTable
                sqlLicensing={tco1YearData.tco1YearData.sqlLicensing}
                sqlLicensingSummary={tco1YearData.tco1YearData.sqlLicensingSummary}
              />
            </CardContent>
          </Card>
        )}
        {tco1YearData?.tco1YearData.instanceTypes && tco1YearData.tco1YearData.instanceTypes.length > 0 && (
          <Card className="border-2 border-indigo-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Tipos de Instancias
              </h3>
              <InstanceTypesChart instanceTypes={tco1YearData.tco1YearData.instanceTypes} />
            </CardContent>
          </Card>
        )}
        {tco1YearData?.tco1YearData.networkTransfer && tco1YearData.tco1YearData.networkTransfer.length > 0 && (
          <Card className="border-2 border-cyan-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-cyan-600" />
                Transferencia de Datos de Red
              </h3>
              <NetworkTransferChart networkTransfer={tco1YearData.tco1YearData.networkTransfer} />
            </CardContent>
          </Card>
        )}
        {tco1YearData?.tco1YearData.supportRisk && (
          <Card className="border-2 border-red-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-600" />
                Riesgo de Soporte
              </h3>
              <SupportRiskAnalysis supportRisk={tco1YearData.tco1YearData.supportRisk} />
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="calculadora">
        <AwsCalculator
          businessCaseData={businessCaseData}
          tco1YearData={tco1YearData}
          clientData={clientData}
        />
      </TabsContent>
    </Tabs>
  );
}

function SummaryStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const colors = {
    blue: 'border-blue-200 text-blue-600',
    green: 'border-green-200 text-green-600',
    yellow: 'border-yellow-200 text-yellow-600',
    purple: 'border-purple-200 text-purple-600',
  };
  return (
    <Card className={`border-2 ${colors[color]}`}>
      <CardContent className="pt-6 text-center">
        <TrendingUp className={`h-8 w-8 mx-auto mb-2 ${colors[color]}`} />
        <p className="text-sm text-gray-600 font-medium">{label}</p>
        <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
