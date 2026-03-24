import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessCaseUploader } from './BusinessCaseUploader';
import { BusinessCaseTCO1YearUploader } from './BusinessCaseTCO1YearUploader';
import { CarbonReportUploader } from './CarbonReportUploader';
import { MatildaUploader } from './MatildaUploader';
import { BusinessCaseClientForm } from './BusinessCaseClientForm';
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
import { BusinessCaseUploadResponse, BusinessCaseClientData, TCO1YearUploadResponse, CarbonReportUploadResponse } from '@/types/assessment';
import { Briefcase, TrendingUp, Upload, Building2, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function BusinessCase() {
  const [businessCaseData, setBusinessCaseData] = useState<BusinessCaseUploadResponse | null>(null);
  const [tco1YearData, setTCO1YearData] = useState<TCO1YearUploadResponse | null>(null);
  const [carbonReportData, setCarbonReportData] = useState<CarbonReportUploadResponse | null>(null);
  const [assessmentTool, setAssessmentTool] = useState<string>(''); // Mandatory tool selection
  const [showOSDistribution, setShowOSDistribution] = useState<boolean>(true); // Accordion state
  const [showResourceOptimization, setShowResourceOptimization] = useState<boolean>(true); // Accordion state
  const [showTCOChart, setShowTCOChart] = useState<boolean>(true); // Accordion state for TCO
  const [showCarbonReport, setShowCarbonReport] = useState<boolean>(true); // Accordion state for Carbon Report
  const [showSQLLicensing, setShowSQLLicensing] = useState<boolean>(false); // Accordion state for SQL Licensing - CLOSED by default
  const [showInstanceTypes, setShowInstanceTypes] = useState<boolean>(false); // Accordion state for Instance Types - CLOSED by default
  const [showNetworkTransfer, setShowNetworkTransfer] = useState<boolean>(false); // Accordion state for Network Transfer - CLOSED by default
  const [showSupportRisk, setShowSupportRisk] = useState<boolean>(false); // Accordion state for Support Risk - CLOSED by default
  const [showMigrationStrategy, setShowMigrationStrategy] = useState<boolean>(true); // Accordion state for Migration Strategy
  const [enableRDSScenario, setEnableRDSScenario] = useState<boolean>(false); // Enable RDS scenario
  
  // TCO Cost states - EC2 Scenario
  const [onDemandAsIs, setOnDemandAsIs] = useState<number>(0);
  const [oneYearOptimized, setOneYearOptimized] = useState<number>(0);
  const [threeYearOptimized, setThreeYearOptimized] = useState<number>(0);
  
  // TCO Cost states - RDS Scenario
  const [onDemandAsIsRDS, setOnDemandAsIsRDS] = useState<number>(0);
  const [oneYearOptimizedRDS, setOneYearOptimizedRDS] = useState<number>(0);
  const [threeYearOptimizedRDS, setThreeYearOptimizedRDS] = useState<number>(0);
  
  const [clientData, setClientData] = useState<BusinessCaseClientData>({
    clientName: '',
    assessmentTool: 'Cloudamize',
    otherToolName: undefined,
    vertical: 'Technology',
    reportDate: new Date().toISOString().split('T')[0],
    awsRegion: 'us-east-1',
    totalServers: 0,
    onPremisesCost: 0,
    companyDescription: '',
    priorities: [],
    migrationReadiness: 'evaluating',
  });

  const handleDataLoaded = (data: BusinessCaseUploadResponse) => {
    setBusinessCaseData(data);
  };

  const handleTCO1YearLoaded = (data: TCO1YearUploadResponse) => {
    setTCO1YearData(data);
  };

  const handleCarbonReportLoaded = (data: CarbonReportUploadResponse) => {
    setCarbonReportData(data);
  };

  const handleClientDataChange = (data: BusinessCaseClientData) => {
    setClientData(data);
  };

  // Update assessment tool in client data when changed
  const handleToolChange = (tool: string) => {
    setAssessmentTool(tool);
    setClientData(prev => ({ ...prev, assessmentTool: tool as any }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-0">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-3">
            <Briefcase className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Caso de Negocio</h2>
              <p className="text-sm text-white/80 mt-1">
                Análisis de costos y beneficios para migración a AWS
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status indicators */}
      {(businessCaseData || tco1YearData) && (
        <div className="flex flex-wrap gap-3 items-center">
          {businessCaseData && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Datos cargados ({businessCaseData.summary.totalServers} servidores, {businessCaseData.summary.osDistributionCount} sistemas operativos)
            </div>
          )}
          {tco1YearData && (
            <div className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              TCO 1 Año cargado ({tco1YearData.summary.totalResources} recursos)
            </div>
          )}
          {clientData.clientName && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Cliente: {clientData.clientName}
            </div>
          )}
        </div>
      )}

      {/* Assessment Tool Selection - MANDATORY */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold">
                1
              </div>
            </div>
            <div className="flex-1">
              <Label htmlFor="assessmentTool" className="text-base font-semibold text-purple-900">
                Herramienta de Assessment *
              </Label>
              <p className="text-sm text-purple-700 mt-1">
                Selecciona la herramienta utilizada para el assessment (obligatorio)
              </p>
            </div>
            <div className="w-64">
              <Select value={assessmentTool} onValueChange={handleToolChange}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Seleccionar herramienta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cloudamize">Cloudamize</SelectItem>
                  <SelectItem value="Matilda">Matilda</SelectItem>
                  <SelectItem value="Concierto">Concierto</SelectItem>
                  <SelectItem value="AWS Migration Evaluator">AWS Migration Evaluator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {!assessmentTool && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium">
                ⚠️ Debes seleccionar una herramienta antes de continuar
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload & Form - 2 columns layout */}
      {assessmentTool && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Data Upload</h3>
            </div>
            <div className="space-y-4">
              {assessmentTool === 'Matilda' ? (
                // Matilda: Single uploader for everything
                <MatildaUploader 
                  onBusinessCaseLoaded={handleDataLoaded}
                  onTCO1YearLoaded={handleTCO1YearLoaded}
                  clientData={clientData}
                />
              ) : (
                // Cloudamize and others: Separate uploaders
                <>
                  <BusinessCaseUploader 
                    onDataLoaded={handleDataLoaded}
                    clientData={clientData}
                  />
                  <BusinessCaseTCO1YearUploader 
                    onDataLoaded={handleTCO1YearLoaded}
                  />
                  <CarbonReportUploader 
                    onDataLoaded={handleCarbonReportLoaded}
                  />
                </>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Client Information</h3>
            </div>
            <BusinessCaseClientForm 
              clientData={clientData}
              onClientDataChange={handleClientDataChange}
            />
          </div>
        </div>
      )}

      {/* Results Section */}
      {assessmentTool && (
        (businessCaseData || tco1YearData) ? (
          <div className="space-y-6">
          {/* Summary Cards - Only show if businessCaseData exists */}
          {businessCaseData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-2 border-blue-200">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Total Servidores</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {businessCaseData.summary.totalServers}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Producción</p>
                  <p className="text-3xl font-bold text-green-600">
                    {businessCaseData.summary.prodServers}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">Desarrollo</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {businessCaseData.summary.devServers}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardContent className="pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 font-medium">QA</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {businessCaseData.summary.qaServers}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* OS Distribution Table - Accordion */}
          {businessCaseData && (
            <Card>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowOSDistribution(!showOSDistribution)}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-800">Distribución de Sistemas Operativos</h3>
                </div>
                {showOSDistribution ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              {showOSDistribution && (
                <div className="px-4 pb-4">
                  <OSDistributionTable osDistribution={businessCaseData.businessCaseData.osDistribution} />
                </div>
              )}
            </Card>
          )}

          {/* Resource Optimization Table - Accordion */}
          {tco1YearData && (
            <Card>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowResourceOptimization(!showResourceOptimization)}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Optimización de Recursos</h3>
                </div>
                {showResourceOptimization ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              {showResourceOptimization && (
                <div className="px-4 pb-4">
                  <ResourceOptimizationTable resourceOptimization={tco1YearData.tco1YearData.resourceOptimization} />
                </div>
              )}
            </Card>
          )}

          {/* TCO Section - Accordion wrapping both Cost Input & Chart */}
          <Card>
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setShowTCOChart(!showTCOChart)}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">TCO</h3>
              </div>
              {showTCOChart ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </div>
            {showTCOChart && (
              <div className="px-4 pb-4 space-y-6">
                {/* Single scenario (EC2 only) or First scenario when RDS enabled */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TCOCostInput
                    title={enableRDSScenario ? "Costos Anuales AWS - EC2 (USD)" : "Costos Anuales AWS (USD)"}
                    onDemandAsIs={onDemandAsIs}
                    oneYearOptimized={oneYearOptimized}
                    threeYearOptimized={threeYearOptimized}
                    onOnDemandAsIsChange={setOnDemandAsIs}
                    onOneYearOptimizedChange={setOneYearOptimized}
                    onThreeYearOptimizedChange={setThreeYearOptimized}
                  />
                  
                  <TCOChart
                    title={enableRDSScenario ? "Costo Anual EC2 en USD (ARR)" : "Costo Anual en USD (ARR)"}
                    onPremisesCost={clientData.onPremisesCost}
                    onDemandAsIs={onDemandAsIs}
                    oneYearOptimized={oneYearOptimized}
                    threeYearOptimized={threeYearOptimized}
                  />
                </div>

                {/* Checkbox to enable RDS scenario - After first scenario */}
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <input
                    type="checkbox"
                    id="enableRDS"
                    checked={enableRDSScenario}
                    onChange={(e) => setEnableRDSScenario(e.target.checked)}
                    className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="enableRDS" className="text-sm font-medium text-blue-900 cursor-pointer">
                    Incluir escenario con RDS (bases de datos)
                  </label>
                </div>

                {/* RDS Scenario - Only shown when enabled */}
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
                        onOnDemandAsIsChange={setOnDemandAsIsRDS}
                        onOneYearOptimizedChange={setOneYearOptimizedRDS}
                        onThreeYearOptimizedChange={setThreeYearOptimizedRDS}
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
              </div>
            )}
          </Card>

          {/* Carbon Report Section - Accordion */}
          {carbonReportData && (
            <Card>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowCarbonReport(!showCarbonReport)}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-800">Reporte de Carbonización</h3>
                </div>
                {showCarbonReport ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              {showCarbonReport && (
                <div className="px-4 pb-4">
                  <CarbonReportTable carbonData={carbonReportData.carbonData} />
                </div>
              )}
            </Card>
          )}

          {/* Migration Strategy Section - Accordion */}
          {tco1YearData && tco1YearData.tco1YearData.migrationStrategies && tco1YearData.tco1YearData.migrationSummary && (
            <Card>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowMigrationStrategy(!showMigrationStrategy)}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-800">Estrategia de Migración</h3>
                </div>
                {showMigrationStrategy ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
              {showMigrationStrategy && (
                <div className="px-4 pb-4">
                  <MigrationStrategyTable 
                    migrationStrategies={tco1YearData.tco1YearData.migrationStrategies}
                    migrationSummary={tco1YearData.tco1YearData.migrationSummary}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Anexos Section - Only show if there's any annex data */}
          {tco1YearData && (tco1YearData.tco1YearData.sqlLicensing || tco1YearData.tco1YearData.instanceTypes || tco1YearData.tco1YearData.networkTransfer || tco1YearData.tco1YearData.supportRisk) && (
            <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <Briefcase className="h-7 w-7 text-orange-600" />
                  <div>
                    <h2 className="text-xl font-bold text-orange-900">Anexos</h2>
                    <p className="text-sm text-orange-700 mt-1">
                      Información adicional y análisis complementarios
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* SQL Licensing Section - Inside Anexos - PRIMERO */}
                  {tco1YearData.tco1YearData.sqlLicensing && tco1YearData.tco1YearData.sqlLicensingSummary && (
                    <Card className="border-2 border-blue-200">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowSQLLicensing(!showSQLLicensing)}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-gray-800">Optimización de Licenciamiento SQL Server</h3>
                        </div>
                        {showSQLLicensing ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {showSQLLicensing && (
                        <div className="px-4 pb-4">
                          <SQLLicensingTable 
                            sqlLicensing={tco1YearData.tco1YearData.sqlLicensing}
                            sqlLicensingSummary={tco1YearData.tco1YearData.sqlLicensingSummary}
                          />
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Instance Types Section - Inside Anexos - SEGUNDO */}
                  {tco1YearData.tco1YearData.instanceTypes && tco1YearData.tco1YearData.instanceTypes.length > 0 && (
                    <Card className="border-2 border-indigo-200">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowInstanceTypes(!showInstanceTypes)}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-indigo-600" />
                          <h3 className="font-semibold text-gray-800">Tipos de Instancias</h3>
                        </div>
                        {showInstanceTypes ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {showInstanceTypes && (
                        <div className="px-4 pb-4">
                          <InstanceTypesChart instanceTypes={tco1YearData.tco1YearData.instanceTypes} />
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Network Transfer Section - Inside Anexos - TERCERO */}
                  {tco1YearData.tco1YearData.networkTransfer && tco1YearData.tco1YearData.networkTransfer.length > 0 && (
                    <Card className="border-2 border-cyan-200">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowNetworkTransfer(!showNetworkTransfer)}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-cyan-600" />
                          <h3 className="font-semibold text-gray-800">Transferencia de Datos de Red</h3>
                        </div>
                        {showNetworkTransfer ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {showNetworkTransfer && (
                        <div className="px-4 pb-4">
                          <NetworkTransferChart networkTransfer={tco1YearData.tco1YearData.networkTransfer} />
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Support Risk Section - Inside Anexos - CUARTO */}
                  {tco1YearData.tco1YearData.supportRisk && (
                    <Card className="border-2 border-red-200">
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setShowSupportRisk(!showSupportRisk)}
                      >
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-red-600" />
                          <h3 className="font-semibold text-gray-800">Riesgo de Soporte</h3>
                        </div>
                        {showSupportRisk ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      {showSupportRisk && (
                        <div className="px-4 pb-4">
                          <SupportRiskAnalysis supportRisk={tco1YearData.tco1YearData.supportRisk} />
                        </div>
                      )}
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No hay datos cargados</p>
              <p className="text-sm mt-2">
                Sube un archivo Excel de {assessmentTool} para comenzar el análisis
              </p>
            </div>
          </CardContent>
        </Card>
      )
      )}
    </div>
  );
}
