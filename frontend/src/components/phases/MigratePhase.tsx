import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { PhaseWorkspace, PhaseFooterNav } from '@/components/layout/PhaseWorkspace';
import { StepGroup, StepStatus } from '@/components/ui/step-indicator';
import { PageHeader } from '@/components/ui/page-header';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { EC2Recommendations } from '@/components/migrate/EC2Recommendations';
import { RDSRecommendations } from '@/components/migrate/RDSRecommendations';
import { MigrationWaves } from '@/components/migrate/MigrationWaves';
import { CostOptimization } from '@/components/migrate/CostOptimization';
import { ModernizationRoadmap } from '@/components/migrate/ModernizationRoadmap';
import { Button } from '@/components/ui/button';
import { InfoBanner } from '@/components/ui/info-banner';
import {
  ExcelData,
  ClientFormData,
  CostBreakdown,
  PhaseStatus,
  MigrationWave,
  EC2Recommendation,
  DatabaseRecommendation,
  GenerateReportResponse,
} from '@/types/assessment';
import type {
  CloudProvider, ComputeRecommendation, CloudDatabaseRecommendation, MultiCloudCostBreakdown,
} from '@/types/clouds';
import {
  Server,
  Database,
  Waves,
  TrendingDown,
  Rocket,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface MigratePhaseProps {
  excelData: ExcelData | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  ec2Recommendations: EC2Recommendation[];
  dbRecommendations: DatabaseRecommendation[];
  recommendationsByCloud?: Partial<Record<CloudProvider, ComputeRecommendation[]>>;
  databasesByCloud?: Partial<Record<CloudProvider, CloudDatabaseRecommendation[]>>;
  multiCloudCost?: MultiCloudCostBreakdown;
  migrationWaves: MigrationWave[];
  onMigrationWavesChange: (waves: MigrationWave[]) => void;
  phaseStatus: PhaseStatus;
  onCompletePhase: () => void;
  reportResult: GenerateReportResponse | null;
  onGenerateReport: () => void;
  onDownloadReport: () => void;
  isGenerating: boolean;
}

const STEP_ORDER = [
  'ec2-recommendations',
  'rds-recommendations',
  'migration-waves',
  'cost-optimization',
  'modernization-roadmap',
] as const;

export function MigratePhase({
  excelData,
  clientData,
  estimatedCosts,
  ec2Recommendations,
  dbRecommendations,
  recommendationsByCloud,
  databasesByCloud,
  multiCloudCost,
  migrationWaves,
  onMigrationWavesChange,
  phaseStatus,
  onCompletePhase,
  reportResult,
  onGenerateReport,
  onDownloadReport,
  isGenerating,
}: MigratePhaseProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState<(typeof STEP_ORDER)[number]>('ec2-recommendations');

  const isCompleted = phaseStatus.migrate === 'completed';

  function statusOf(stepId: string): StepStatus {
    if (activeStep === stepId) return 'current';
    switch (stepId) {
      case 'ec2-recommendations':
        return ec2Recommendations.length > 0 ? 'done' : 'pending';
      case 'rds-recommendations':
        return dbRecommendations.length > 0 ? 'done' : 'pending';
      case 'migration-waves':
        return migrationWaves.length > 0 ? 'done' : 'pending';
      case 'cost-optimization':
        return estimatedCosts ? 'done' : 'pending';
      case 'modernization-roadmap':
        return 'pending';
      default:
        return 'pending';
    }
  }

  const groups: StepGroup[] = [
    {
      id: 'migrate',
      label: t('migrate.groups.migrate', { defaultValue: 'Migrar' }),
      description: t('migrate.groups.migrateDesc', {
        defaultValue: 'Recomendaciones técnicas de migración.',
      }),
      steps: [
        {
          id: 'ec2-recommendations',
          label: t('migrate.tabs.ec2'),
          description: t('migrate.steps.ec2Desc', { defaultValue: 'Right-sizing EC2.' }),
          status: statusOf('ec2-recommendations'),
          icon: <Server className="h-3.5 w-3.5" />,
        },
        {
          id: 'rds-recommendations',
          label: t('migrate.tabs.rds'),
          description: t('migrate.steps.rdsDesc', { defaultValue: 'Right-sizing RDS.' }),
          status: statusOf('rds-recommendations'),
          icon: <Database className="h-3.5 w-3.5" />,
        },
        {
          id: 'migration-waves',
          label: t('migrate.tabs.waves'),
          description: t('migrate.steps.wavesDesc', { defaultValue: 'Olas de migración.' }),
          status: statusOf('migration-waves'),
          icon: <Waves className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'optimize',
      label: t('migrate.groups.optimize', { defaultValue: 'Optimizar' }),
      description: t('migrate.groups.optimizeDesc', {
        defaultValue: 'Reducción de costos posterior.',
      }),
      steps: [
        {
          id: 'cost-optimization',
          label: t('migrate.tabs.costOptimization'),
          description: t('migrate.steps.costOptimizationDesc', {
            defaultValue: 'Estrategias para bajar el costo.',
          }),
          status: statusOf('cost-optimization'),
          icon: <TrendingDown className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'modernize',
      label: t('migrate.groups.modernize', { defaultValue: 'Modernizar' }),
      description: t('migrate.groups.modernizeDesc', {
        defaultValue: 'Roadmap de modernización.',
      }),
      steps: [
        {
          id: 'modernization-roadmap',
          label: t('migrate.tabs.modernizationRoadmap'),
          description: t('migrate.steps.modernizationRoadmapDesc', {
            defaultValue: 'Plan a 12-24 meses.',
          }),
          status: statusOf('modernization-roadmap'),
          icon: <Rocket className="h-3.5 w-3.5" />,
        },
      ],
    },
  ];

  const canComplete = !!(phaseStatus.mobilize === 'completed' && reportResult);
  const canGenerateReport = !!(excelData && clientData.clientName && !isGenerating);

  const idx = STEP_ORDER.indexOf(activeStep);
  const prevStep = idx > 0 ? STEP_ORDER[idx - 1] : undefined;
  const nextStep = idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : undefined;

  const overview = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t('migrate.overview.title', { defaultValue: 'Migrate & Modernize' })}
      </p>
      <p className="mt-0.5 font-semibold truncate">
        {clientData.clientName || t('assess.overview.noClient', { defaultValue: 'Sin nombre' })}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('migrate.overview.ec2', { defaultValue: 'EC2' })}</p>
          <p className="font-semibold text-foreground">{ec2Recommendations.length}</p>
        </div>
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('migrate.overview.rds', { defaultValue: 'RDS' })}</p>
          <p className="font-semibold text-foreground">{dbRecommendations.length}</p>
        </div>
      </div>
    </div>
  );

  // Final-report panel — primary CTA of the whole assessment
  const reportPanel = (
    <div
      className={`rounded-xl border bg-card shadow-elev-1 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
        reportResult ? 'border-success/30 bg-success/5' : ''
      }`}
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            reportResult ? 'bg-success/15 text-success' : 'bg-phase-migrate/10 text-phase-migrate'
          }`}
        >
          {reportResult ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
        </div>
        <div className="min-w-0">
          <p className="font-semibold leading-tight">
            {reportResult
              ? t('migrate.report.successMessage', { defaultValue: 'Reporte generado' })
              : t('migrate.report.title', { defaultValue: 'Generar reporte final' })}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {reportResult
              ? t('migrate.report.successDescription', {
                  defaultValue: 'Listo para descargar y compartir con el cliente.',
                })
              : t('migrate.report.description', {
                  defaultValue:
                    'Documento PDF/Excel con TCO, recomendaciones y plan de migración.',
                })}
          </p>
        </div>
      </div>
      {reportResult ? (
        <Button onClick={onDownloadReport}>
          <Download className="h-4 w-4 mr-2" />
          {t('migrate.report.buttonDownload', { defaultValue: 'Descargar' })}
        </Button>
      ) : (
        <Button onClick={onGenerateReport} disabled={!canGenerateReport}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('migrate.report.buttonGenerating', { defaultValue: 'Generando...' })}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              {t('migrate.report.buttonGenerate', { defaultValue: 'Generar reporte' })}
            </>
          )}
        </Button>
      )}
    </div>
  );

  const footer = (
    <div className="space-y-4">
      {reportPanel}
      <PhaseCompleteButton
        phaseLabel="Migrar & Modernizar"
        canComplete={canComplete}
        isCompleted={isCompleted}
        onComplete={onCompletePhase}
        completionRequirements={[
          t('migrate.requirements.mobilizePhase'),
          t('migrate.requirements.reportGeneration'),
        ]}
        accentColor="migrate"
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
      onStepChange={(id) => setActiveStep(id as (typeof STEP_ORDER)[number])}
      accent="migrate"
      overview={overview}
      footer={footer}
    >
      {activeStep === 'ec2-recommendations' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('migrate.groups.migrate', { defaultValue: 'Migrar' })}
            title={t('migrate.tabs.ec2')}
            description={t('migrate.steps.ec2Hero', {
              defaultValue: 'Recomendaciones EC2 con right-sizing por servidor.',
            })}
            icon={<Server className="h-5 w-5" />}
          />
          {ec2Recommendations.length === 0 && (
            <InfoBanner tone="info">
              {t('migrate.empty.ec2', {
                defaultValue: 'Las recomendaciones se calculan al cargar el MPA en Assess.',
              })}
            </InfoBanner>
          )}
          <EC2Recommendations
            servers={excelData?.servers || []}
            recommendations={ec2Recommendations}
            recommendationsByCloud={recommendationsByCloud}
          />
        </section>
      )}

      {activeStep === 'rds-recommendations' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('migrate.groups.migrate', { defaultValue: 'Migrar' })}
            title={t('migrate.tabs.rds')}
            description={t('migrate.steps.rdsHero', {
              defaultValue: 'Recomendaciones RDS por base de datos.',
            })}
            icon={<Database className="h-5 w-5" />}
          />
          <RDSRecommendations
            databases={excelData?.databases || []}
            recommendations={dbRecommendations}
            recommendationsByCloud={databasesByCloud}
          />
        </section>
      )}

      {activeStep === 'migration-waves' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('migrate.groups.migrate', { defaultValue: 'Migrar' })}
            title={t('migrate.tabs.waves')}
            description={t('migrate.steps.wavesHero', {
              defaultValue: 'Olas finales de ejecución de migración.',
            })}
            icon={<Waves className="h-5 w-5" />}
          />
          <MigrationWaves waves={migrationWaves} onWavesChange={onMigrationWavesChange} />
        </section>
      )}

      {activeStep === 'cost-optimization' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('migrate.groups.optimize', { defaultValue: 'Optimizar' })}
            title={t('migrate.tabs.costOptimization')}
            description={t('migrate.steps.costOptimizationHero', {
              defaultValue: 'Tácticas para reducir costos post-migración.',
            })}
            icon={<TrendingDown className="h-5 w-5" />}
          />
          <CostOptimization estimatedCosts={estimatedCosts} multiCloud={multiCloudCost} />
        </section>
      )}

      {activeStep === 'modernization-roadmap' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('migrate.groups.modernize', { defaultValue: 'Modernizar' })}
            title={t('migrate.tabs.modernizationRoadmap')}
            description={t('migrate.steps.modernizationRoadmapHero', {
              defaultValue: 'Plan de modernización a mediano plazo.',
            })}
            icon={<Rocket className="h-5 w-5" />}
          />
          <ModernizationRoadmap />
        </section>
      )}
    </PhaseWorkspace>
  );
}
