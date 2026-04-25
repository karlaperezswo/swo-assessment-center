import { lazy, Suspense, useState, useCallback } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { PhaseWorkspace, PhaseFooterNav } from '@/components/layout/PhaseWorkspace';
import { StepGroup, StepStatus } from '@/components/ui/step-indicator';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Button } from '@/components/ui/button';
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
import {
  Upload,
  DollarSign,
  Gauge,
  Presentation,
  GraduationCap,
  Waves,
  Target,
  Briefcase,
  Network,
  BarChart2,
  Search,
  Compass,
  ArrowRight,
} from 'lucide-react';

// DependencyMap pulls in d3 + vis-network (~2100 lines + ~400KB).
// Lazy-load it so the bundle stays lean on the first render.
const DependencyMap = lazy(() =>
  import('@/components/DependencyMap').then((m) => ({ default: m.DependencyMap }))
);
import {
  ExcelData,
  UploadSummary,
  ClientFormData,
  CostBreakdown,
  PhaseStatus,
  BriefingSession,
  ImmersionDayPlan,
  MigrationWave,
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

interface AssessPhaseProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  onDataLoaded: (
    data: ExcelData,
    summary: UploadSummary,
    dependencyData?: any,
    migrationWaves?: any
  ) => void;
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

const STEP_ORDER = [
  'rapid-discovery',
  'executive-summary',
  'dependency-map',
  'tco-report',
  'migration-readiness',
  'opportunities',
  'wave-planning',
  'briefings-workshops',
  'immersion-day',
  'business-case',
  'selector',
] as const;

export function AssessPhase({
  excelData,
  uploadSummary,
  clientData,
  estimatedCosts,
  onDataLoaded,
  onFormChange,
  phaseStatus,
  onCompletePhase,
  briefingSessions,
  onBriefingSessionsChange,
  immersionDays,
  onImmersionDaysChange,
  migrationWaves,
  onMigrationWavesChange,
  opportunitySessionId,
  onOpportunitySessionIdChange,
  mraFile,
  onMRAFileChange,
  questionnaireFile,
  onQuestionnaireFileChange,
  dependencyData,
}: AssessPhaseProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState<string>('rapid-discovery');
  const [businessCaseState, setBusinessCaseState] =
    useState<BusinessCasePersistedState>(DEFAULT_BUSINESS_CASE_STATE);
  const handleBusinessCaseStateChange = useCallback(
    (updater: (prev: BusinessCasePersistedState) => BusinessCasePersistedState) =>
      setBusinessCaseState(updater),
    []
  );

  const hasMpa = !!excelData;
  const hasDeps = !!(dependencyData && dependencyData.dependencies?.length);
  const hasCosts = !!estimatedCosts;
  const hasOpportunities = !!opportunitySessionId;
  const hasClientBasics = !!(clientData.clientName && clientData.onPremisesCost > 0);
  const assessCompleted = phaseStatus.assess === 'completed';

  // ---- Lock messages ----
  const msgNeedsMpa = t('assess.prereq.mpa', {
    defaultValue: 'Sube primero el archivo MPA en "Datos y archivos".',
  });
  const msgNeedsAssess = t('assess.prereq.opps', {
    defaultValue: 'Completa la fase Assess para correr el análisis de oportunidades.',
  });
  const msgNoDeps = t('assess.prereq.deps', {
    defaultValue: 'El MPA no incluye datos de dependencias.',
  });

  // ---- Per-step status ----
  function statusOf(stepId: string): StepStatus {
    if (activeStep === stepId) return 'current';
    switch (stepId) {
      case 'rapid-discovery':
        return hasMpa && hasClientBasics ? 'done' : 'pending';
      case 'executive-summary':
        return !hasCosts ? 'locked' : 'pending';
      case 'dependency-map':
        return !hasDeps ? 'locked' : 'pending';
      case 'tco-report':
        return !hasCosts ? 'locked' : 'pending';
      case 'migration-readiness':
        return !hasMpa ? 'locked' : 'pending';
      case 'opportunities':
        if (hasOpportunities) return 'done';
        return assessCompleted ? 'pending' : 'locked';
      case 'wave-planning':
        return migrationWaves.length > 0 ? 'done' : 'pending';
      case 'briefings-workshops':
        return briefingSessions.length > 0 ? 'done' : 'pending';
      case 'immersion-day':
        return immersionDays.length > 0 ? 'done' : 'pending';
      case 'business-case':
        return businessCaseState.businessCaseData ? 'done' : 'pending';
      case 'selector':
        return 'pending';
      default:
        return 'pending';
    }
  }

  function lockReason(stepId: string): string | undefined {
    switch (stepId) {
      case 'executive-summary':
      case 'tco-report':
      case 'migration-readiness':
        return msgNeedsMpa;
      case 'dependency-map':
        return hasMpa ? msgNoDeps : msgNeedsMpa;
      case 'opportunities':
        return msgNeedsAssess;
      default:
        return undefined;
    }
  }

  const groups: StepGroup[] = [
    {
      id: 'discovery',
      label: t('assess.groups.discovery', { defaultValue: 'Discovery' }),
      description: t('assess.groups.discoveryDesc', {
        defaultValue: 'Reúne los datos del cliente.',
      }),
      steps: [
        {
          id: 'rapid-discovery',
          label: t('assess.tabs.rapidDiscovery'),
          description: t('assess.steps.rapidDiscoveryDesc', {
            defaultValue: 'Datos del cliente y archivos MPA / MRA.',
          }),
          status: statusOf('rapid-discovery'),
          icon: <Upload className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'analysis',
      label: t('assess.groups.analysis', { defaultValue: 'Análisis' }),
      description: t('assess.groups.analysisDesc', {
        defaultValue: 'Lo que el sistema calculó con tus datos.',
      }),
      steps: [
        {
          id: 'executive-summary',
          label: t('assess.tabs.executiveSummary', { defaultValue: 'Resumen ejecutivo' }),
          description: t('assess.steps.executiveSummaryDesc', {
            defaultValue: 'KPIs, ahorros y ROI.',
          }),
          status: statusOf('executive-summary'),
          lockReason: lockReason('executive-summary'),
          icon: <BarChart2 className="h-3.5 w-3.5" />,
        },
        {
          id: 'dependency-map',
          label: t('assess.tabs.dependencyMap'),
          description: t('assess.steps.dependencyMapDesc', {
            defaultValue: 'Topología y dependencias detectadas.',
          }),
          status: statusOf('dependency-map'),
          lockReason: lockReason('dependency-map'),
          icon: <Network className="h-3.5 w-3.5" />,
        },
        {
          id: 'tco-report',
          label: t('assess.tabs.tcoReport'),
          description: t('assess.steps.tcoReportDesc', { defaultValue: 'TCO on-prem vs AWS.' }),
          status: statusOf('tco-report'),
          lockReason: lockReason('tco-report'),
          icon: <DollarSign className="h-3.5 w-3.5" />,
        },
        {
          id: 'migration-readiness',
          label: t('assess.tabs.migrationReadiness'),
          description: t('assess.steps.migrationReadinessDesc', {
            defaultValue: 'Cuestionario de madurez.',
          }),
          status: statusOf('migration-readiness'),
          lockReason: lockReason('migration-readiness'),
          icon: <Gauge className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'strategy',
      label: t('assess.groups.strategy', { defaultValue: 'Estrategia' }),
      description: t('assess.groups.strategyDesc', {
        defaultValue: 'Decide los siguientes pasos.',
      }),
      steps: [
        {
          id: 'opportunities',
          label: t('assess.tabs.opportunities'),
          description: t('assess.steps.opportunitiesDesc', {
            defaultValue: 'Oportunidades comerciales detectadas.',
          }),
          status: statusOf('opportunities'),
          lockReason: lockReason('opportunities'),
          icon: <Target className="h-3.5 w-3.5" />,
        },
        {
          id: 'wave-planning',
          label: t('assess.tabs.migrationWaves'),
          description: t('assess.steps.wavePlanningDesc', {
            defaultValue: 'Olas de migración inicial.',
          }),
          status: statusOf('wave-planning'),
          icon: <Waves className="h-3.5 w-3.5" />,
        },
        {
          id: 'briefings-workshops',
          label: t('assess.tabs.briefings'),
          description: t('assess.steps.briefingsDesc', {
            defaultValue: 'Sesiones y workshops planeados.',
          }),
          status: statusOf('briefings-workshops'),
          icon: <Presentation className="h-3.5 w-3.5" />,
        },
        {
          id: 'immersion-day',
          label: t('assess.tabs.immersionDay'),
          description: t('assess.steps.immersionDayDesc', {
            defaultValue: 'Plan de inmersión técnica.',
          }),
          status: statusOf('immersion-day'),
          icon: <GraduationCap className="h-3.5 w-3.5" />,
        },
        {
          id: 'business-case',
          label: t('assess.tabs.businessCase'),
          description: t('assess.steps.businessCaseDesc', {
            defaultValue: 'Caso de negocio del cliente.',
          }),
          status: statusOf('business-case'),
          icon: <Briefcase className="h-3.5 w-3.5" />,
        },
        {
          id: 'selector',
          label: t('assess.tabs.selector'),
          description: t('assess.steps.selectorDesc', {
            defaultValue: 'Selector de fase rápida.',
          }),
          status: statusOf('selector'),
          icon: <Compass className="h-3.5 w-3.5" />,
        },
      ],
    },
  ];

  // Annotate the current active step
  for (const g of groups) {
    for (const s of g.steps) {
      if (s.id === activeStep && s.status !== 'locked') s.status = 'current';
    }
  }

  const canComplete = !!(excelData && clientData.clientName && clientData.onPremisesCost > 0);

  // ---- Footer navigation: walks STEP_ORDER skipping locked steps ----
  const orderedAvailable = STEP_ORDER.filter((id) => statusOf(id) !== 'locked');
  const idx = orderedAvailable.indexOf(activeStep as (typeof STEP_ORDER)[number]);
  const prevStep = idx > 0 ? orderedAvailable[idx - 1] : undefined;
  const nextStep = idx >= 0 && idx < orderedAvailable.length - 1 ? orderedAvailable[idx + 1] : undefined;

  // ---- Sidebar overview: who's the client + a tiny progress hint ----
  const overview = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t('assess.overview.client', { defaultValue: 'Cliente' })}
      </p>
      <p className="mt-0.5 font-semibold truncate">
        {clientData.clientName || (
          <span className="text-muted-foreground font-normal italic">
            {t('assess.overview.noClient', { defaultValue: 'Sin nombre' })}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">
        {clientData.vertical} · {clientData.awsRegion}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('assess.overview.servers', { defaultValue: 'Servidores' })}</p>
          <p className="font-semibold text-foreground">{uploadSummary?.serverCount ?? 0}</p>
        </div>
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('assess.overview.dbs', { defaultValue: 'BBDD' })}</p>
          <p className="font-semibold text-foreground">{uploadSummary?.databaseCount ?? 0}</p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-4">
      <PhaseCompleteButton
        phaseLabel="Assess"
        nextPhaseLabel="Mobilize"
        canComplete={canComplete}
        isCompleted={assessCompleted}
        onComplete={() => {
          setActiveStep('executive-summary');
          onCompletePhase();
        }}
        completionRequirements={[
          t('assess.requirements.excelFile'),
          t('assess.requirements.clientName'),
          t('assess.requirements.onPremisesCost'),
        ]}
        accentColor="fuchsia"
      />
      <PhaseFooterNav
        onBack={prevStep ? () => setActiveStep(prevStep) : undefined}
        onNext={nextStep ? () => setActiveStep(nextStep) : undefined}
        backLabel={t('common.back', { defaultValue: 'Atrás' })}
        nextLabel={t('common.next', { defaultValue: 'Siguiente' })}
        hideBack={!prevStep}
        hideNext={!nextStep}
      />
    </div>
  );

  return (
    <PhaseWorkspace
      groups={groups}
      activeStepId={activeStep}
      onStepChange={setActiveStep}
      accent="assess"
      overview={overview}
      footer={footer}
    >
      {activeStep === 'rapid-discovery' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.discovery', { defaultValue: 'Discovery' })}
            title={t('assess.tabs.rapidDiscovery')}
            description={t('assess.steps.rapidDiscoveryHero', {
              defaultValue:
                'Carga el inventario, datos del cliente y archivos de evaluación para arrancar el análisis.',
            })}
            icon={<Search className="h-5 w-5" />}
          />
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
        </section>
      )}

      {activeStep === 'executive-summary' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.analysis', { defaultValue: 'Análisis' })}
            title={t('assess.tabs.executiveSummary', { defaultValue: 'Resumen ejecutivo' })}
            description={t('assess.steps.executiveSummaryHero', {
              defaultValue: 'Métricas clave del análisis: ahorro, ROI, payback y reducción de TCO.',
            })}
            icon={<BarChart2 className="h-5 w-5" />}
          />
          {estimatedCosts ? (
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
          ) : (
            <EmptyState
              icon={<BarChart2 className="h-7 w-7" />}
              title={t('assess.empty.executiveSummary.title', {
                defaultValue: 'Aún no hay métricas para mostrar',
              })}
              description={t('assess.empty.executiveSummary.desc', {
                defaultValue:
                  'Sube el archivo MPA en Discovery para que generemos los costos estimados y el resumen ejecutivo.',
              })}
              action={
                <Button onClick={() => setActiveStep('rapid-discovery')}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('assess.empty.goToDiscovery', { defaultValue: 'Ir a Discovery' })}
                </Button>
              }
            />
          )}
        </section>
      )}

      {activeStep === 'dependency-map' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.analysis', { defaultValue: 'Análisis' })}
            title={t('assess.tabs.dependencyMap')}
            description={t('assess.steps.dependencyMapHero', {
              defaultValue: 'Topología detectada entre servidores, aplicaciones y bases de datos.',
            })}
            icon={<Network className="h-5 w-5" />}
          />
          {hasDeps ? (
            <Suspense
              fallback={
                <div className="rounded-xl border bg-card shadow-elev-1 p-10 flex items-center justify-center">
                  <div className="h-64 w-full max-w-2xl skeleton-shimmer rounded-lg" />
                </div>
              }
            >
              <DependencyMap dependencyData={dependencyData} />
            </Suspense>
          ) : (
            <EmptyState
              icon={<Network className="h-7 w-7" />}
              title={t('assess.empty.depMap.title', {
                defaultValue: 'Sin datos de dependencias',
              })}
              description={t('assess.empty.depMap.desc', {
                defaultValue:
                  'El MPA no contiene la pestaña de dependencias o no fue cargado todavía.',
              })}
              action={
                <Button onClick={() => setActiveStep('rapid-discovery')}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('assess.empty.goToDiscovery', { defaultValue: 'Ir a Discovery' })}
                </Button>
              }
            />
          )}
        </section>
      )}

      {activeStep === 'tco-report' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.analysis', { defaultValue: 'Análisis' })}
            title={t('assess.tabs.tcoReport')}
            description={t('assess.steps.tcoReportHero', {
              defaultValue: 'Comparativa de costos on-prem contra escenarios en AWS.',
            })}
            icon={<DollarSign className="h-5 w-5" />}
          />
          {hasCosts ? (
            <TCOReport excelData={excelData} estimatedCosts={estimatedCosts} clientData={clientData} />
          ) : (
            <EmptyState
              icon={<DollarSign className="h-7 w-7" />}
              title={t('assess.empty.tco.title', { defaultValue: 'Sin TCO calculado' })}
              description={t('assess.empty.tco.desc', {
                defaultValue: 'Necesitamos los datos del MPA para estimar los costos.',
              })}
              action={
                <Button onClick={() => setActiveStep('rapid-discovery')}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('assess.empty.goToDiscovery', { defaultValue: 'Ir a Discovery' })}
                </Button>
              }
            />
          )}
        </section>
      )}

      {activeStep === 'migration-readiness' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.analysis', { defaultValue: 'Análisis' })}
            title={t('assess.tabs.migrationReadiness')}
            description={t('assess.steps.migrationReadinessHero', {
              defaultValue: 'Madurez del cliente para una migración a AWS.',
            })}
            icon={<Gauge className="h-5 w-5" />}
          />
          {hasMpa ? (
            <MigrationReadiness
              excelData={excelData}
              uploadSummary={uploadSummary}
              migrationReadiness={clientData.migrationReadiness}
            />
          ) : (
            <EmptyState
              icon={<Gauge className="h-7 w-7" />}
              title={t('assess.empty.readiness.title', {
                defaultValue: 'Sin datos para evaluar madurez',
              })}
              description={t('assess.empty.readiness.desc', {
                defaultValue: 'Carga el MPA en Discovery para evaluar el readiness.',
              })}
              action={
                <Button onClick={() => setActiveStep('rapid-discovery')}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  {t('assess.empty.goToDiscovery', { defaultValue: 'Ir a Discovery' })}
                </Button>
              }
            />
          )}
        </section>
      )}

      {activeStep === 'opportunities' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.opportunities')}
            description={t('assess.steps.opportunitiesHero', {
              defaultValue: 'Oportunidades de venta detectadas a partir del MPA y MRA.',
            })}
            icon={<Target className="h-5 w-5" />}
          />
          {!assessCompleted && (
            <InfoBanner
              tone="warning"
              title={t('assess.opportunities.lockedTitle', {
                defaultValue: 'Aún no se ha corrido el análisis',
              })}
            >
              {t('assess.opportunities.lockedDesc', {
                defaultValue:
                  'Carga MPA y MRA, después usa el botón "Completar Assess" para iniciar el análisis de oportunidades.',
              })}
            </InfoBanner>
          )}
          <OpportunityDashboard
            sessionId={opportunitySessionId}
            onSessionIdChange={onOpportunitySessionIdChange}
          />
        </section>
      )}

      {activeStep === 'wave-planning' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.migrationWaves')}
            description={t('assess.steps.wavePlanningHero', {
              defaultValue: 'Define cómo se agrupan los servidores en olas de migración.',
            })}
            icon={<Waves className="h-5 w-5" />}
          />
          <MigrationWaves
            waves={migrationWaves}
            onWavesChange={onMigrationWavesChange}
            dependencyData={dependencyData}
          />
        </section>
      )}

      {activeStep === 'briefings-workshops' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.briefings')}
            description={t('assess.steps.briefingsHero', {
              defaultValue: 'Workshops y sesiones de descubrimiento programadas.',
            })}
            icon={<Presentation className="h-5 w-5" />}
          />
          <BriefingsWorkshops sessions={briefingSessions} onSessionsChange={onBriefingSessionsChange} />
        </section>
      )}

      {activeStep === 'immersion-day' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.immersionDay')}
            description={t('assess.steps.immersionDayHero', {
              defaultValue: 'Agenda y materiales del día de inmersión.',
            })}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <ImmersionDay plans={immersionDays} onPlansChange={onImmersionDaysChange} />
        </section>
      )}

      {activeStep === 'business-case' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.businessCase')}
            description={t('assess.steps.businessCaseHero', {
              defaultValue: 'Caso de negocio cuantitativo para presentar al cliente.',
            })}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <BusinessCase
            businessCaseState={businessCaseState}
            onBusinessCaseStateChange={handleBusinessCaseStateChange}
          />
        </section>
      )}

      {activeStep === 'selector' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('assess.groups.strategy', { defaultValue: 'Estrategia' })}
            title={t('assess.tabs.selector')}
            description={t('assess.steps.selectorHero', {
              defaultValue: 'Selector rápido entre fases.',
            })}
            icon={<Compass className="h-5 w-5" />}
          />
          <SelectorPhase />
        </section>
      )}
    </PhaseWorkspace>
  );
}
