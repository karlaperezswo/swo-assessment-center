import { useState } from 'react';
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
import {
  ExcelData, UploadSummary, ClientFormData, CostBreakdown,
  PhaseStatus, BriefingSession, ImmersionDayPlan, MigrationWave,
} from '@/types/assessment';
import { Upload, DollarSign, Gauge, Presentation, GraduationCap, Waves, Target } from 'lucide-react';

interface AssessPhaseProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  onDataLoaded: (data: ExcelData, summary: UploadSummary) => void;
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
}: AssessPhaseProps) {
  const [activeTab, setActiveTab] = useState('rapid-discovery');

  const groups: SubTabGroup[] = [
    {
      tabs: [
        { value: 'rapid-discovery', label: 'Descubrimiento Rápido', icon: <Upload className="h-4 w-4" /> },
        { value: 'tco-report', label: 'Reporte TCO', icon: <DollarSign className="h-4 w-4" /> },
        { value: 'migration-readiness', label: 'Preparación para Migración', icon: <Gauge className="h-4 w-4" /> },
        { value: 'opportunities', label: 'Oportunidades de Venta', icon: <Target className="h-4 w-4" /> },
        { value: 'wave-planning', label: 'Planificación de Olas', icon: <Waves className="h-4 w-4" /> },
        { value: 'briefings-workshops', label: 'Briefings y Talleres', icon: <Presentation className="h-4 w-4" /> },
        { value: 'immersion-day', label: 'Día de Inmersión', icon: <GraduationCap className="h-4 w-4" /> },
        { value: 'selector', label: 'Selector', icon: <Target className="h-4 w-4" /> },
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
      </SubTabLayout>

      <PhaseCompleteButton
        phaseLabel="Assess"
        nextPhaseLabel="Mobilize"
        canComplete={canComplete}
        isCompleted={phaseStatus.assess === 'completed'}
        onComplete={onCompletePhase}
        completionRequirements={[
          'Cargar archivo Excel MPA',
          'Ingresar nombre del cliente',
          'Ingresar costo anual on-premises',
        ]}
        accentColor="fuchsia"
      />
    </div>
  );
}
