import { useState } from 'react';
import apiClient from '@/lib/api';
import { useTranslation } from '@/i18n/useTranslation';
import { LanguageSelector } from '@/i18n/LanguageSelector';
import { PhaseNavigator } from '@/components/layout/PhaseNavigator';
import { PhaseProgressBar } from '@/components/layout/PhaseProgressBar';
import { AssessPhase } from '@/components/phases/AssessPhase';
import { MobilizePhase } from '@/components/phases/MobilizePhase';
import { MigratePhase } from '@/components/phases/MigratePhase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  createDefaultLandingZoneChecklist,
  createDefaultSecurityChecklist,
  createDefaultSkillAssessments,
} from '@/lib/defaults';
import {
  ExcelData,
  UploadSummary,
  ClientFormData,
  GenerateReportResponse,
  CostBreakdown,
  EC2Recommendation,
  DatabaseRecommendation,
  MigrationPhase,
  PhaseStatus,
  BriefingSession,
  ImmersionDayPlan,
  MigrationWave,
  SkillAssessment,
  LandingZoneChecklist,
  SecurityComplianceChecklist,
} from '@/types/assessment';
import { RefreshCw, Cloud } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { TechnicalMemory } from '@/components/techMemory/TechnicalMemory';

function App() {
  const { t } = useTranslation();
  const [excelData, setExcelData] = useState<ExcelData | null>(null);
  const [uploadSummary, setUploadSummary] = useState<UploadSummary | null>(null);
  const [clientData, setClientData] = useState<ClientFormData>({
    clientName: '',
    vertical: 'Technology',
    reportDate: new Date().toISOString().split('T')[0],
    awsRegion: 'us-east-1',
    totalServers: 0,
    onPremisesCost: 0,
    companyDescription: '',
    priorities: [],
    migrationReadiness: 'evaluating',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<GenerateReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Computed costs (simplified estimation before backend calculation)
  const [estimatedCosts, setEstimatedCosts] = useState<CostBreakdown | null>(null);
  const [ec2Recommendations, setEc2Recommendations] = useState<EC2Recommendation[]>([]);
  const [dbRecommendations, setDbRecommendations] = useState<DatabaseRecommendation[]>([]);

  // Phase navigation state
  const [currentPhase, setCurrentPhase] = useState<MigrationPhase>('assess');
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus>({
    assess: 'in_progress',
    mobilize: 'not_started',
    migrate: 'not_started',
    'tech-memory': 'not_started',
  });

  // Assess phase state
  const [briefingSessions, setBriefingSessions] = useState<BriefingSession[]>([]);
  const [immersionDays, setImmersionDays] = useState<ImmersionDayPlan[]>([]);
  const [opportunitySessionId, setOpportunitySessionId] = useState<string | null>(null);
  const [mraFile, setMraFile] = useState<File | null>(null);
  const [questionnaireFile, setQuestionnaireFile] = useState<File | null>(null);

  // Mobilize phase state
  const [migrationWaves, setMigrationWaves] = useState<MigrationWave[]>([]);
  const [skillAssessments, setSkillAssessments] = useState<SkillAssessment[]>(() =>
    createDefaultSkillAssessments()
  );
  const [landingZoneChecklist, setLandingZoneChecklist] = useState<LandingZoneChecklist>(() =>
    createDefaultLandingZoneChecklist()
  );
  const [securityChecklist, setSecurityChecklist] = useState<SecurityComplianceChecklist>(() =>
    createDefaultSecurityChecklist()
  );

  // Dependency and migration wave data
  const [dependencyData, setDependencyData] = useState<any>(null);
  const [_autoCalculatedWaves, setAutoCalculatedWaves] = useState<any>(null);

  const handleDataLoaded = (data: ExcelData, summary: UploadSummary, depData?: any, waves?: any) => {
    setExcelData(data);
    setUploadSummary(summary);
    setClientData(prev => ({
      ...prev,
      totalServers: summary.serverCount,
    }));
    setReportResult(null);
    setError(null);

    // Store dependency data
    if (depData) {
      setDependencyData(depData);
      console.log('✅ Dependencias cargadas:', depData.summary);
    }

    // Store and convert auto-calculated waves to MigrationWave format
    if (waves) {
      setAutoCalculatedWaves(waves);
      
      // Convert calculated waves to MigrationWave format
      const convertedWaves: MigrationWave[] = waves.waves.map((wave: any, _index: number) => ({
        id: `wave-auto-${wave.waveNumber}`,
        waveNumber: wave.waveNumber,
        name: `Wave ${wave.waveNumber}${wave.waveNumber === 1 ? ' - Base Infrastructure' : ''}`,
        startDate: '', // User can fill these later
        endDate: '',
        serverCount: wave.serverCount,
        applicationCount: 0,
        status: 'planned' as const,
        strategy: 'Rehost',
        notes: `Servidores: ${wave.servers.join(', ')}`,
        servers: wave.servers,
      }));
      
      setMigrationWaves(convertedWaves);
      console.log(`✅ ${waves.totalWaves} olas de migración generadas automáticamente`);
      
      toast.success(`Olas de migración calculadas automáticamente`, {
        description: `${waves.totalWaves} olas generadas para ${waves.totalServers} servidores`,
        duration: 5000
      });
    }

    // Generate simple cost estimate
    estimateCosts(data);
  };

  const estimateCosts = (data: ExcelData) => {
    // Simple cost estimation (backend does the real calculation)
    const serverCost = data.servers.reduce((sum, server) => {
      const vcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
      const ram = server.totalRAM || 8;

      // Simple instance pricing estimate
      let baseCost = 70; // m5.large base
      if (vcpus <= 2 && ram <= 4) baseCost = 30;
      else if (vcpus <= 4 && ram <= 16) baseCost = 70;
      else if (vcpus <= 8 && ram <= 32) baseCost = 140;
      else if (vcpus <= 16 && ram <= 64) baseCost = 280;
      else baseCost = 560;

      // Windows multiplier
      if (server.osName?.toLowerCase().includes('windows')) {
        baseCost *= 1.8;
      }

      return sum + baseCost;
    }, 0);

    const dbCost = data.databases.reduce((sum, db) => {
      let cost = 50;
      if (db.totalSize > 500) cost = 350;
      else if (db.totalSize > 200) cost = 180;
      else if (db.totalSize > 100) cost = 125;
      else if (db.totalSize > 50) cost = 100;

      // Add storage cost
      cost += db.totalSize * 0.08;

      return sum + cost;
    }, 0);

    const storageCost = data.servers.reduce((sum, s) => sum + (s.totalDiskSize || 0), 0) * 0.08;
    const networkingCost = (serverCost + dbCost) * 0.1;

    const totalOnDemand = serverCost + dbCost + storageCost + networkingCost;

    setEstimatedCosts({
      onDemand: {
        monthly: Math.round(totalOnDemand),
        annual: Math.round(totalOnDemand * 12),
        threeYear: Math.round(totalOnDemand * 36),
      },
      oneYearNuri: {
        monthly: Math.round(totalOnDemand * 0.64),
        annual: Math.round(totalOnDemand * 0.64 * 12),
        threeYear: Math.round(totalOnDemand * 0.64 * 36),
      },
      threeYearNuri: {
        monthly: Math.round(totalOnDemand * 0.4),
        annual: Math.round(totalOnDemand * 0.4 * 12),
        threeYear: Math.round(totalOnDemand * 0.4 * 36),
      },
    });

    // Generate simple recommendations for display
    const ec2Recs: EC2Recommendation[] = data.servers.map(server => {
      const vcpus = server.numCpus * server.numCoresPerCpu * (server.numThreadsPerCore || 1);
      const ram = server.totalRAM || 8;

      let instance = 'm5.large';
      let cost = 70;

      if (vcpus <= 2 && ram <= 4) { instance = 't3.medium'; cost = 30; }
      else if (vcpus <= 4 && ram <= 16) { instance = 'm5.xlarge'; cost = 140; }
      else if (vcpus <= 8 && ram <= 32) { instance = 'm5.2xlarge'; cost = 280; }
      else if (vcpus <= 16 && ram <= 64) { instance = 'm5.4xlarge'; cost = 560; }

      if (server.osName?.toLowerCase().includes('windows')) {
        cost *= 1.8;
      }

      return {
        hostname: server.hostname,
        originalSpecs: { vcpus, ram, storage: server.totalDiskSize || 0 },
        recommendedInstance: instance,
        instanceFamily: instance.split('.')[0],
        rightsizingNote: 'Direct match',
        monthlyEstimate: cost,
      };
    });

    const dbRecs: DatabaseRecommendation[] = data.databases.map(db => {
      let instanceClass = 'db.t3.medium';
      let cost = 50;

      if (db.totalSize > 500) { instanceClass = 'db.r5.2xlarge'; cost = 350; }
      else if (db.totalSize > 200) { instanceClass = 'db.r5.xlarge'; cost = 180; }
      else if (db.totalSize > 100) { instanceClass = 'db.m5.xlarge'; cost = 125; }
      else if (db.totalSize > 50) { instanceClass = 'db.m5.large'; cost = 100; }

      cost += db.totalSize * 0.08;

      return {
        dbName: db.dbName,
        sourceEngine: db.engineType,
        targetEngine: `Amazon RDS for ${db.engineType}`,
        instanceClass,
        storageGB: db.totalSize,
        monthlyEstimate: cost,
        licenseModel: db.licenseModel || 'license-included',
      };
    });

    setEc2Recommendations(ec2Recs);
    setDbRecommendations(dbRecs);
  };

  const handleFormChange = (data: ClientFormData) => {
    setClientData(data);
  };

  const handleGenerateReport = async () => {
    if (!excelData || !clientData.clientName) {
      const errorMsg = 'Please upload an Excel file and enter the client name';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsGenerating(true);
    setError(null);

    toast.loading('Generando reporte Word...', { id: 'generate-report' });

    try {
      const response = await apiClient.post('/api/report/generate', {
        ...clientData,
        excelData,
      });

      if (response.data.success) {
        setReportResult(response.data.data);

        // Update with actual backend calculations
        if (response.data.data.summary.estimatedCosts) {
          setEstimatedCosts(response.data.data.summary.estimatedCosts);
        }
        if (response.data.data.summary.ec2Recommendations) {
          setEc2Recommendations(response.data.data.summary.ec2Recommendations);
        }
        if (response.data.data.summary.databaseRecommendations) {
          setDbRecommendations(response.data.data.summary.databaseRecommendations);
        }
        toast.success('Reporte generado exitosamente', {
          id: 'generate-report',
          description: 'El reporte está listo para descargar',
          duration: 5000
        });
      } else {
        throw new Error(response.data.error || 'Failed to generate report');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate report';
      setError(errorMsg);
      toast.error('Error al generar reporte', {
        id: 'generate-report',
        description: errorMsg,
        duration: 7000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhaseComplete = async (phase: MigrationPhase) => {
    // If completing Assess phase and both MPA and MRA are available, analyze opportunities
    if (phase === 'assess' && excelData && mraFile) {
      const loadingToastId = toast.loading(
        t('opportunities.analyzing'),
        { duration: Infinity, description: t('opportunities.analyzing_description') }
      );

      try {
        // Step 1: Get presigned URLs
        const files: { filename: string; contentType: string }[] = [
          { filename: 'mpa-data.json', contentType: 'application/json' },
          { filename: mraFile.name, contentType: 'application/pdf' },
        ];
        if (questionnaireFile) {
          files.push({
            filename: questionnaireFile.name,
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          });
        }

        const urlResponse = await apiClient.post('/api/opportunities/get-upload-urls', { files });
        if (!urlResponse.data.success) {
          throw new Error(urlResponse.data.error || 'Failed to get upload URLs');
        }

        const { mpaUrl, mpaKey, mraUrl, mraKey, questionnaireUrl, questionnaireKey } = urlResponse.data.data;

        // Step 2: Upload files to S3 in parallel
        const excelBlob = new Blob([JSON.stringify(excelData)], { type: 'application/json' });
        const uploadPromises = [
          fetch(mpaUrl, { method: 'PUT', body: excelBlob, headers: { 'Content-Type': 'application/json' } }),
          fetch(mraUrl, { method: 'PUT', body: mraFile, headers: { 'Content-Type': 'application/pdf' } }),
        ];
        if (questionnaireFile && questionnaireUrl) {
          uploadPromises.push(
            fetch(questionnaireUrl, {
              method: 'PUT',
              body: questionnaireFile,
              headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
            })
          );
        }
        await Promise.all(uploadPromises);

        // Step 3: Analyze with S3 keys
        const analyzeBody: any = { mpaKey, mraKey };
        if (questionnaireKey) analyzeBody.questionnaireKey = questionnaireKey;

        const response = await apiClient.post('/api/opportunities/analyze', analyzeBody);

        if (response.status === 202 && response.data.jobId) {
          const { jobId } = response.data;
          toast.loading(t('opportunities.polling'), {
            id: loadingToastId,
            duration: Infinity,
            description: t('opportunities.polling_description')
          });

          let consecutiveFailures = 0;
          const maxFailures = 3;
          const pollingInterval = 5000;

          const pollJobStatus = async (): Promise<void> => {
            try {
              const statusResponse = await apiClient.get(`/api/opportunities/status/${jobId}`);
              consecutiveFailures = 0;
              const { status, progress } = statusResponse.data;

              if (status === 'completed') {
                const resultResponse = await apiClient.get(`/api/opportunities/result/${jobId}`);
                if (resultResponse.data.success && resultResponse.data.result) {
                  const { sessionId, opportunities } = resultResponse.data.result;
                  setOpportunitySessionId(sessionId);
                  toast.dismiss(loadingToastId);
                  toast.success(
                    `${t('opportunities.completed')} ${opportunities.length} ${t('opportunities.identified')}`,
                    { duration: 5000, description: t('opportunities.viewDetails') }
                  );
                }
              } else if (status === 'failed') {
                toast.dismiss(loadingToastId);
                toast.error(t('opportunities.error'), {
                  description: statusResponse.data.error || t('opportunities.failed'),
                  duration: 7000
                });
              } else if (status === 'processing' || status === 'pending') {
                const progressText = progress ? `${progress}%` : t('opportunities.polling');
                toast.loading(`${t('opportunities.polling')} ${progressText}...`, {
                  id: loadingToastId,
                  duration: Infinity,
                  description: t('opportunities.analyzing_description')
                });
                setTimeout(pollJobStatus, pollingInterval);
              }
            } catch (pollError: any) {
              console.error('Error polling job status:', pollError);
              consecutiveFailures++;
              if (consecutiveFailures >= maxFailures) {
                toast.dismiss(loadingToastId);
                toast.error(t('opportunities.polling_error'), {
                  description: t('opportunities.polling_error_description', { count: maxFailures }),
                  duration: 10000
                });
              } else {
                setTimeout(pollJobStatus, pollingInterval);
              }
            }
          };
          setTimeout(pollJobStatus, pollingInterval);

        } else if (response.data.success) {
          setOpportunitySessionId(response.data.data.sessionId);
          toast.dismiss(loadingToastId);
          toast.success(
            `¡Análisis completado! ${response.data.data.opportunities.length} oportunidades identificadas`,
            { duration: 5000, description: 'Ve a la pestaña "Oportunidades de Venta" para ver los detalles' }
          );
        }
      } catch (error: any) {
        console.error('Error analyzing opportunities:', error);
        toast.dismiss(loadingToastId);
        toast.error(t('opportunities.error'), {
          description: error.response?.data?.error || t('opportunities.retry'),
          duration: 7000
        });
      }
    }

    const phaseOrder: MigrationPhase[] = ['assess', 'mobilize', 'migrate'];
    const currentIndex = phaseOrder.indexOf(phase);

    setPhaseStatus((prev) => {
      const updated = { ...prev, [phase]: 'completed' as const };
      if (currentIndex < phaseOrder.length - 1) {
        const nextPhase = phaseOrder[currentIndex + 1];
        if (updated[nextPhase] === 'not_started') {
          updated[nextPhase] = 'in_progress';
        }
      }
      return updated;
    });

    if (currentIndex < phaseOrder.length - 1) {
      setCurrentPhase(phaseOrder[currentIndex + 1]);
    }
  };

  const handleReset = () => {
    setExcelData(null);
    setUploadSummary(null);
    setReportResult(null);
    setError(null);
    setEstimatedCosts(null);
    setEc2Recommendations([]);
    setDbRecommendations([]);
    setClientData({
      clientName: '',
      vertical: 'Technology',
      reportDate: new Date().toISOString().split('T')[0],
      awsRegion: 'us-east-1',
      totalServers: 0,
      onPremisesCost: 0,
      companyDescription: '',
      priorities: [],
      migrationReadiness: 'evaluating',
    });
    // Reset phase state
    setCurrentPhase('assess');
    setPhaseStatus({ assess: 'in_progress', mobilize: 'not_started', migrate: 'not_started', 'tech-memory': 'not_started' });
    setBriefingSessions([]);
    setImmersionDays([]);
    setOpportunitySessionId(null);
    setMraFile(null);
    setQuestionnaireFile(null);
    setMigrationWaves([]);
    setSkillAssessments(createDefaultSkillAssessments());
    setLandingZoneChecklist(createDefaultLandingZoneChecklist());
    setSecurityChecklist(createDefaultSecurityChecklist());
  };

  const handleDownload = () => {
    if (reportResult?.downloadUrl) {
      window.open(reportResult.downloadUrl, '_blank');
      toast.success('Iniciando descarga del reporte');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors closeButton />
      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Centro de Evaluación de Migración AWS
              </h1>
              <p className="text-sm text-gray-500">
                Evaluar → Movilizar → Migrar y Modernizar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <span className="text-sm text-gray-500">Desarrollado por</span>
            <span className="font-bold text-orange-500">SoftwareOne</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Phase Progress Bar */}
        <PhaseProgressBar phaseStatus={phaseStatus} currentPhase={currentPhase} />

        {/* Phase Navigator and Content */}
        <PhaseNavigator
          currentPhase={currentPhase}
          onPhaseChange={setCurrentPhase}
          phaseStatus={phaseStatus}
        >
          {currentPhase === 'assess' && (
            <AssessPhase
              excelData={excelData}
              uploadSummary={uploadSummary}
              clientData={clientData}
              estimatedCosts={estimatedCosts}
              onDataLoaded={handleDataLoaded}
              onFormChange={handleFormChange}
              phaseStatus={phaseStatus}
              onCompletePhase={() => handlePhaseComplete('assess')}
              briefingSessions={briefingSessions}
              onBriefingSessionsChange={setBriefingSessions}
              immersionDays={immersionDays}
              onImmersionDaysChange={setImmersionDays}
              migrationWaves={migrationWaves}
              onMigrationWavesChange={setMigrationWaves}
              opportunitySessionId={opportunitySessionId}
              onOpportunitySessionIdChange={setOpportunitySessionId}
              mraFile={mraFile}
              onMRAFileChange={setMraFile}
              questionnaireFile={questionnaireFile}
              onQuestionnaireFileChange={setQuestionnaireFile}
              dependencyData={dependencyData}
            />
          )}

          {currentPhase === 'mobilize' && (
            <MobilizePhase
              excelData={excelData}
              uploadSummary={uploadSummary}
              clientData={clientData}
              estimatedCosts={estimatedCosts}
              ec2Recommendations={ec2Recommendations}
              dbRecommendations={dbRecommendations}
              reportResult={reportResult}
              migrationWaves={migrationWaves}
              onMigrationWavesChange={setMigrationWaves}
              skillAssessments={skillAssessments}
              onSkillAssessmentsChange={setSkillAssessments}
              landingZoneChecklist={landingZoneChecklist}
              onLandingZoneChange={setLandingZoneChecklist}
              securityChecklist={securityChecklist}
              onSecurityChecklistChange={setSecurityChecklist}
              phaseStatus={phaseStatus}
              onCompletePhase={() => handlePhaseComplete('mobilize')}
            />
          )}

          {currentPhase === 'migrate' && (
            <MigratePhase
              excelData={excelData}
              clientData={clientData}
              estimatedCosts={estimatedCosts}
              ec2Recommendations={ec2Recommendations}
              dbRecommendations={dbRecommendations}
              migrationWaves={migrationWaves}
              onMigrationWavesChange={setMigrationWaves}
              phaseStatus={phaseStatus}
              onCompletePhase={() => handlePhaseComplete('migrate')}
              reportResult={reportResult}
              onGenerateReport={handleGenerateReport}
              onDownloadReport={handleDownload}
              isGenerating={isGenerating}
            />
          )}

          {currentPhase === 'tech-memory' && (
            <TechnicalMemory />
          )}
        </PhaseNavigator>

        {/* Error Message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Global Reset */}
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reiniciar Todo
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          AWS Assessment Report Generator &copy; {new Date().getFullYear()} SoftwareOne
        </div>
      </footer>
    </div>
  );
}

export default App;
