import { lazy, Suspense, useState, useCallback } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { SubTabLayout, SubTabGroup } from '@/components/layout/SubTabLayout';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { RapidDiscovery } from '@/components/assess/RapidDiscovery';
import { TCOReport } from '@/components/assess/TCOReport';
import { MigrationReadiness } from '@/components/assess/MigrationReadiness';
import { BriefingsWorkshops } from '@/components/assess/BriefingsWorkshops';
import { ImmersionDay } from '@/components/assess/ImmersionDay';
import { MigrationWaves } from '@/components/migrate/MigrationWaves';
import { OpportunityDashboard } from '@/components/opportunities/OpportunityDashboard';
import { SelectorPhase } from '@/components/phases/SelectorPhase';
import { BusinessCase } from '@/components/mobilize/BusinessCase';
import { ExecutiveSummary } from '@/components/ExecutiveSummary';

// DependencyMap pulls in d3 + vis-network (~2100 lines + ~400KB).
// Lazy-load it so the bundle stays lean on the first render.
const DependencyMap = lazy(() =>
  import('@/components/DependencyMap').then((m) => ({ default: m.DependencyMap }))
);
import {
  ExcelData, UploadSummary, ClientFormData, CostBreakdown,
  PhaseStatus, BriefingSession, ImmersionDayPlan, MigrationWave,
  BusinessCasePersistedState,
} from '@/types/assessment';

const DEFAULT_BUSINESS_CASE_STATE: BusinessCasePersistedState = {
  businessCaseData: null,
  tco1YearData: null,
  carbonReportData: null,
  businessCaseFileName: '',
  tco1YearFileName: '',
  carbonReportFileName: '',
  assessmentTool: '',
  clientData: {
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
  },
  onDemandAsIs: 0,
  oneYearOptimized: 0,
  threeYearOptimized: 0,
  onDemandAsIsRDS: 0,
  oneYearOptimizedRDS: 0,
  threeYearOptimizedRDS: 0,
  enableRDSScenario: false,
};
import { Upload, DollarSign, Gauge, Presentation, GraduationCap, Waves, Target, Briefcase, Network, BarChart2 } from 'lucide-react';

interface AssessPhaseProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  onDataLoaded: (data: ExcelData, summary: UploadSummary, dependencyData?: any, migrationWaves?: any) => void;
  onFormChange: (data: ClientFormData) => void;
  phaseStatus: PhaseStatus;
  onCompletePhase: () => void;
  briefingSessions: BriefingSession[];
  onBriefingSessionsChange: (sessions: BriefingSession[]) => void;
  immersionDays: ImmersionDayPlan[];
  onImmersionDaysChange: (plans: ImmersionDayPlan[]) => void;
  migrationWaves: MigrationWave[];
  onMigrationWavesChange: (waves: MigrationWave[]) => void;
  opportunitySessionId: string | null;
  onOpportunitySessionIdChange: (sessionId: string | null) => void;
  mraFile: File | null;
  onMRAFileChange: (file: File | null) => void;
  questionnaireFile: File | null;
  onQuestionnaireFileChange: (file: File | null) => void;
  dependencyData?: any;
}

export function AssessPhase({
  excelData, uploadSummary, clientData, estimatedCosts,
  onDataLoaded, onFormChange, phaseStatus, onCompletePhase,
  briefingSessions, onBriefingSessionsChange,
  immersionDays, onImmersionDaysChange,
  migrationWaves, onMigrationWavesChange,
  opportunitySessionId, onOpportunitySessionIdChange,
  mraFile, onMRAFileChange,
  questionnaireFile, onQuestionnaireFileChange,
  dependencyData,
}: AssessPhaseProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('rapid-discovery');
  const [businessCaseState, setBusinessCaseState] = useState<BusinessCasePersistedState>(DEFAULT_BUSINESS_CASE_STATE);
  const handleBusinessCaseStateChange = useCallback(
    (updater: (prev: BusinessCasePersistedState) => BusinessCasePersistedState) =>
      setBusinessCaseState(updater),
    []
  );

  const hasMpa = !!excelData;
  const hasDeps = !!(dependencyData && dependencyData.dependencies?.length);
  const hasCosts = !!estimatedCosts;
  const hasOpportunities = !!opportunitySessionId;

  const prereqMsgMpa = t('assess.prereq.mpa', { defaultValue: 'Sube primero el MPA en Descubrimiento Rápido' });
  const prereqMsgDeps = t('assess.prereq.deps', { defaultValue: 'Requiere datos de dependencias del MPA' });
  const prereqMsgOpps = t('assess.prereq.opps', { defaultValue: 'Completa la fase Assess para correr el análisis de oportunidades' });

  const groups: SubTabGroup[] = [
    {
      tabs: [
        { value: 'rapid-discovery', label: t('assess.tabs.rapidDiscovery'), icon: <Upload className="h-4 w-4" /> },
        { value: 'executive-summary', label: t('assess.tabs.executiveSummary', { defaultValue: 'Executive Summary' }), icon: <BarChart2 className="h-4 w-4" />, prerequisiteMet: hasCosts, prerequisiteMessage: prereqMsgMpa },
        { value: 'dependency-map', label: t('assess.tabs.dependencyMap'), icon: <Network className="h-4 w-4" />, prerequisiteMet: hasDeps, prerequisiteMessage: prereqMsgDeps },
        { value: 'tco-report', label: t('assess.tabs.tcoReport'), icon: <DollarSign className="h-4 w-4" />, prerequisiteMet: hasCosts, prerequisiteMessage: prereqMsgMpa },
        { value: 'migration-readiness', label: t('assess.tabs.migrationReadiness'), icon: <Gauge className="h-4 w-4" />, prerequisiteMet: hasMpa, prerequisiteMessage: prereqMsgMpa },
        { value: 'opportunities', label: t('assess.tabs.opportunities'), icon: <Target className="h-4 w-4" />, prerequisiteMet: hasOpportunities, prerequisiteMessage: prereqMsgOpps },
        { value: 'wave-planning', label: t('assess.tabs.migrationWaves'), icon: <Waves className="h-4 w-4" /> },
        { value: 'briefings-workshops', label: t('assess.tabs.briefings'), icon: <Presentation className="h-4 w-4" /> },
        { value: 'immersion-day', label: t('assess.tabs.immersionDay'), icon: <GraduationCap className="h-4 w-4" /> },
        { value: 'selector', label: t('assess.tabs.selector'), icon: <Target className="h-4 w-4" /> },
        { value: 'business-case', label: t('assess.tabs.businessCase'), icon: <Briefcase className="h-4 w-4" /> },
      ],
    },
  ];

  const canComplete = !!(excelData && clientData.clientName && clientData.onPremisesCost > 0);

  return (
    <div>
      <SubTabLayout groups={groups} activeTab={activeTab} onTabChange={setActiveTab} phaseColor="fuchsia">
        {activeTab === 'rapid-discovery' && (
          <RapidDiscovery
            excelData={excelData}
            clientData={clientData}
            onDataLoaded={onDataLoaded}
            onFormChange={onFormChange}
            mraFile={mraFile}
            onMRAFileChange={onMRAFileChange}
            questionnaireFile={questionnaireFile}
            onQuestionnaireFileChange={onQuestionnaireFileChange}
          />
        )}
        {activeTab === 'executive-summary' && estimatedCosts && (
          <ExecutiveSummary
            clientName={clientData.clientName}
            onPremisesCost={clientData.onPremisesCost}
            estimatedCosts={estimatedCosts}
            totalServers={excelData?.servers.length ?? 0}
            migrationReadiness={clientData.migrationReadiness}
            excelData={excelData}
            dependencyData={dependencyData}
            migrationWaves={migrationWaves}
          />
        )}
        {activeTab === 'dependency-map' && (
          <Suspense fallback={<div className="p-6 text-sm text-gray-500">Cargando mapa de dependencias…</div>}>
            <DependencyMap dependencyData={dependencyData} />
          </Suspense>
        )}
        {activeTab === 'tco-report' && (
          <TCOReport
            excelData={excelData}
            estimatedCosts={estimatedCosts}
            clientData={clientData}
          />
        )}
        {activeTab === 'migration-readiness' && (
          <MigrationReadiness
            excelData={excelData}
            uploadSummary={uploadSummary}
            migrationReadiness={clientData.migrationReadiness}
          />
        )}
        {activeTab === 'opportunities' && (
          <OpportunityDashboard 
            sessionId={opportunitySessionId}
            onSessionIdChange={onOpportunitySessionIdChange}
          />
        )}
        {activeTab === 'wave-planning' && (
          <MigrationWaves
            waves={migrationWaves}
            onWavesChange={onMigrationWavesChange}
            dependencyData={dependencyData}
          />
        )}
        {activeTab === 'briefings-workshops' && (
          <BriefingsWorkshops
            sessions={briefingSessions}
            onSessionsChange={onBriefingSessionsChange}
          />
        )}
        {activeTab === 'immersion-day' && (
          <ImmersionDay
            plans={immersionDays}
            onPlansChange={onImmersionDaysChange}
          />
        )}
        {activeTab === 'selector' && (
          <SelectorPhase />
        )}
        {activeTab === 'business-case' && (
          <BusinessCase
            businessCaseState={businessCaseState}
            onBusinessCaseStateChange={handleBusinessCaseStateChange}
          />
        )}
      </SubTabLayout>

      <PhaseCompleteButton
        phaseLabel="Assess"
        nextPhaseLabel="Mobilize"
        canComplete={canComplete}
        isCompleted={phaseStatus.assess === 'completed'}
        onComplete={() => {
          setActiveTab('executive-summary');
          onCompletePhase();
        }}
        completionRequirements={[
          t('assess.requirements.excelFile'),
          t('assess.requirements.clientName'),
          t('assess.requirements.onPremisesCost'),
        ]}
        accentColor="fuchsia"
      />
    </div>
  );
}
