import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessCaseUploader } from './BusinessCaseUploader';
import { BusinessCaseTCO1YearUploader } from './BusinessCaseTCO1YearUploader';
import { CarbonReportUploader } from './CarbonReportUploader';
import { MatildaUploader } from './MatildaUploader';
import { BusinessCaseClientForm } from './BusinessCaseClientForm';
import { BusinessCaseResults } from './BusinessCaseResults';
import {
  BusinessCaseUploadResponse,
  BusinessCaseClientData,
  TCO1YearUploadResponse,
  CarbonReportUploadResponse,
  BusinessCasePersistedState,
} from '@/types/assessment';
import { Briefcase, TrendingUp, Upload, Building2 } from 'lucide-react';

interface BusinessCaseProps {
  businessCaseState: BusinessCasePersistedState;
  onBusinessCaseStateChange: (updater: (prev: BusinessCasePersistedState) => BusinessCasePersistedState) => void;
}

export function BusinessCase({ businessCaseState, onBusinessCaseStateChange }: BusinessCaseProps) {
  const {
    businessCaseData,
    tco1YearData,
    carbonReportData,
    assessmentTool,
    clientData,
    onDemandAsIs,
    oneYearOptimized,
    threeYearOptimized,
    onDemandAsIsRDS,
    oneYearOptimizedRDS,
    threeYearOptimizedRDS,
    enableRDSScenario,
  } = businessCaseState;

  const set = <K extends keyof BusinessCasePersistedState>(key: K, value: BusinessCasePersistedState[K]) =>
    onBusinessCaseStateChange((prev) => ({ ...prev, [key]: value }));

  const handleDataLoaded = (data: BusinessCaseUploadResponse, fileName?: string) => {
    onBusinessCaseStateChange((prev) => ({
      ...prev,
      businessCaseData: data,
      ...(fileName ? { businessCaseFileName: fileName } : {}),
    }));
  };
  const handleTCO1YearLoaded = (data: TCO1YearUploadResponse, fileName?: string) => {
    onBusinessCaseStateChange((prev) => ({
      ...prev,
      tco1YearData: data,
      ...(fileName ? { tco1YearFileName: fileName } : {}),
    }));
  };
  const handleCarbonReportLoaded = (data: CarbonReportUploadResponse, fileName?: string) => {
    onBusinessCaseStateChange((prev) => ({
      ...prev,
      carbonReportData: data,
      ...(fileName ? { carbonReportFileName: fileName } : {}),
    }));
  };
  const handleClientDataChange = (data: BusinessCaseClientData) => set('clientData', data);

  const handleToolChange = (tool: string) => {
    onBusinessCaseStateChange((prev) => ({
      ...prev,
      assessmentTool: tool,
      clientData: { ...prev.clientData, assessmentTool: tool as any },
    }));
  };

  const hasAnyResults = !!(businessCaseData || tco1YearData);

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
      {hasAnyResults && (
        <div className="flex flex-wrap gap-3 items-center">
          {businessCaseData && (
            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-sm font-medium">
              <TrendingUp className="h-4 w-4" />
              Datos cargados ({businessCaseData.summary.totalServers} servidores,{' '}
              {businessCaseData.summary.osDistributionCount} sistemas operativos)
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

      {/* Assessment Tool Selection */}
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

      {/* Upload & Form */}
      {assessmentTool && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Upload className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Data Upload</h3>
            </div>
            <div className="space-y-4">
              {assessmentTool === 'Matilda' ? (
                <MatildaUploader
                  onBusinessCaseLoaded={handleDataLoaded}
                  onTCO1YearLoaded={handleTCO1YearLoaded}
                  clientData={clientData}
                />
              ) : (
                <>
                  <BusinessCaseUploader
                    onDataLoaded={handleDataLoaded}
                    clientData={clientData}
                    alreadyLoaded={!!businessCaseData}
                    loadedFileName={businessCaseState.businessCaseFileName}
                  />
                  <BusinessCaseTCO1YearUploader
                    onDataLoaded={handleTCO1YearLoaded}
                    alreadyLoaded={!!tco1YearData}
                    loadedFileName={businessCaseState.tco1YearFileName}
                  />
                  <CarbonReportUploader
                    onDataLoaded={handleCarbonReportLoaded}
                    alreadyLoaded={!!carbonReportData}
                    loadedFileName={businessCaseState.carbonReportFileName}
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
      {assessmentTool &&
        (hasAnyResults ? (
          <BusinessCaseResults
            businessCaseData={businessCaseData}
            tco1YearData={tco1YearData}
            carbonReportData={carbonReportData}
            clientData={clientData}
            onDemandAsIs={onDemandAsIs}
            oneYearOptimized={oneYearOptimized}
            threeYearOptimized={threeYearOptimized}
            onDemandAsIsRDS={onDemandAsIsRDS}
            oneYearOptimizedRDS={oneYearOptimizedRDS}
            threeYearOptimizedRDS={threeYearOptimizedRDS}
            enableRDSScenario={enableRDSScenario}
            onFieldChange={(key, value) => set(key, value as any)}
          />
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
        ))}
    </div>
  );
}
