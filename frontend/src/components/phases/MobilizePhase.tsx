import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { PhaseWorkspace, PhaseFooterNav } from '@/components/layout/PhaseWorkspace';
import { StepGroup, StepStatus } from '@/components/ui/step-indicator';
import { PageHeader } from '@/components/ui/page-header';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { DiscoveryPlanning } from '@/components/mobilize/DiscoveryPlanning';
import { MigrationPlan } from '@/components/mobilize/MigrationPlan';
import { SkillsCoE } from '@/components/mobilize/SkillsCoE';
import { LandingZone } from '@/components/mobilize/LandingZone';
import { SecurityCompliance } from '@/components/mobilize/SecurityCompliance';
import { ArchitectureDiagram } from '@/components/mobilize/ArchitectureDiagram';
import {
  ExcelData,
  UploadSummary,
  ClientFormData,
  CostBreakdown,
  PhaseStatus,
  MigrationWave,
  SkillAssessment,
  LandingZoneChecklist,
  SecurityComplianceChecklist,
  GenerateReportResponse,
  EC2Recommendation,
  DatabaseRecommendation,
} from '@/types/assessment';
import type {
  CloudProvider, ComputeRecommendation, CloudDatabaseRecommendation, MultiCloudCostBreakdown,
} from '@/types/clouds';
import {
  AppWindow,
  Waves,
  GraduationCap,
  Cloud,
  Shield,
  Network,
  Rocket,
} from 'lucide-react';

interface MobilizePhaseProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  ec2Recommendations: EC2Recommendation[];
  dbRecommendations: DatabaseRecommendation[];
  // Multi-cloud — present only when >1 provider was selected during /generate.
  recommendationsByCloud?: Partial<Record<CloudProvider, ComputeRecommendation[]>>;
  databasesByCloud?: Partial<Record<CloudProvider, CloudDatabaseRecommendation[]>>;
  multiCloudCost?: MultiCloudCostBreakdown;
  reportResult: GenerateReportResponse | null;
  migrationWaves: MigrationWave[];
  onMigrationWavesChange: (waves: MigrationWave[]) => void;
  skillAssessments: SkillAssessment[];
  onSkillAssessmentsChange: (skills: SkillAssessment[]) => void;
  landingZoneChecklist: LandingZoneChecklist;
  onLandingZoneChange: (checklist: LandingZoneChecklist) => void;
  securityChecklist: SecurityComplianceChecklist;
  onSecurityChecklistChange: (checklist: SecurityComplianceChecklist) => void;
  phaseStatus: PhaseStatus;
  onCompletePhase: () => void;
}

const STEP_ORDER = [
  'discovery-planning',
  'migration-plan',
  'skills-coe',
  'landing-zone',
  'security-compliance',
  'architecture-diagram',
] as const;

export function MobilizePhase({
  excelData,
  uploadSummary,
  clientData,
  migrationWaves,
  onMigrationWavesChange,
  skillAssessments,
  onSkillAssessmentsChange,
  landingZoneChecklist,
  onLandingZoneChange,
  securityChecklist,
  onSecurityChecklistChange,
  phaseStatus,
  onCompletePhase,
}: MobilizePhaseProps) {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = useState<(typeof STEP_ORDER)[number]>('discovery-planning');

  const isCompleted = phaseStatus.mobilize === 'completed';

  function statusOf(stepId: string): StepStatus {
    if (activeStep === stepId) return 'current';
    switch (stepId) {
      case 'discovery-planning':
        return excelData ? 'done' : 'pending';
      case 'migration-plan':
        return migrationWaves.length > 0 ? 'done' : 'pending';
      case 'skills-coe':
        return skillAssessments.some((s) => s.currentLevel !== 'none') ? 'done' : 'pending';
      case 'landing-zone':
        return landingZoneChecklist.accountStructure.some((i) => i.completed)
          ? 'done'
          : 'pending';
      case 'security-compliance':
        return securityChecklist.identityAccess.some((i) => i.completed) ? 'done' : 'pending';
      case 'architecture-diagram':
        return 'pending';
      default:
        return 'pending';
    }
  }

  const groups: StepGroup[] = [
    {
      id: 'portfolio',
      label: t('mobilize.groups.portfolio', { defaultValue: 'Portafolio' }),
      description: t('mobilize.groups.portfolioDesc', {
        defaultValue: 'Inventario y plan de migración.',
      }),
      steps: [
        {
          id: 'discovery-planning',
          label: t('mobilize.tabs.discoveryPlanning'),
          description: t('mobilize.steps.discoveryPlanningDesc', {
            defaultValue: 'Inventario detallado.',
          }),
          status: statusOf('discovery-planning'),
          icon: <AppWindow className="h-3.5 w-3.5" />,
        },
        {
          id: 'migration-plan',
          label: t('mobilize.tabs.migrationPlan'),
          description: t('mobilize.steps.migrationPlanDesc', {
            defaultValue: 'Olas y estrategia 7Rs.',
          }),
          status: statusOf('migration-plan'),
          icon: <Waves className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'people',
      label: t('mobilize.groups.people', { defaultValue: 'Personas' }),
      description: t('mobilize.groups.peopleDesc', {
        defaultValue: 'Gente y centro de excelencia.',
      }),
      steps: [
        {
          id: 'skills-coe',
          label: t('mobilize.tabs.skills'),
          description: t('mobilize.steps.skillsDesc', {
            defaultValue: 'Capacidades técnicas y formación.',
          }),
          status: statusOf('skills-coe'),
          icon: <GraduationCap className="h-3.5 w-3.5" />,
        },
      ],
    },
    {
      id: 'platform',
      label: t('mobilize.groups.platform', { defaultValue: 'Plataforma' }),
      description: t('mobilize.groups.platformDesc', {
        defaultValue: 'Bases de la plataforma AWS.',
      }),
      steps: [
        {
          id: 'landing-zone',
          label: t('mobilize.tabs.landingZone'),
          description: t('mobilize.steps.landingZoneDesc', {
            defaultValue: 'Estructura de cuentas y red.',
          }),
          status: statusOf('landing-zone'),
          icon: <Cloud className="h-3.5 w-3.5" />,
        },
        {
          id: 'security-compliance',
          label: t('mobilize.tabs.security'),
          description: t('mobilize.steps.securityDesc', {
            defaultValue: 'Seguridad y cumplimiento.',
          }),
          status: statusOf('security-compliance'),
          icon: <Shield className="h-3.5 w-3.5" />,
        },
        {
          id: 'architecture-diagram',
          label: t('mobilize.tabs.architecture'),
          description: t('mobilize.steps.architectureDesc', {
            defaultValue: 'Diagrama de arquitectura.',
          }),
          status: statusOf('architecture-diagram'),
          icon: <Network className="h-3.5 w-3.5" />,
        },
      ],
    },
  ];

  const canComplete = !!(
    phaseStatus.assess === 'completed' &&
    migrationWaves.length > 0 &&
    landingZoneChecklist.accountStructure.some((item) => item.completed)
  );

  const idx = STEP_ORDER.indexOf(activeStep);
  const prevStep = idx > 0 ? STEP_ORDER[idx - 1] : undefined;
  const nextStep = idx < STEP_ORDER.length - 1 ? STEP_ORDER[idx + 1] : undefined;

  const overview = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {t('mobilize.overview.title', { defaultValue: 'Mobilize' })}
      </p>
      <p className="mt-0.5 font-semibold truncate">
        {clientData.clientName || t('assess.overview.noClient', { defaultValue: 'Sin nombre' })}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('mobilize.overview.waves', { defaultValue: 'Olas' })}</p>
          <p className="font-semibold text-foreground">{migrationWaves.length}</p>
        </div>
        <div className="rounded-md bg-surface-2 px-2 py-1.5">
          <p className="text-muted-foreground">{t('mobilize.overview.servers', { defaultValue: 'Servidores' })}</p>
          <p className="font-semibold text-foreground">
            {uploadSummary?.serverCount ?? excelData?.servers.length ?? 0}
          </p>
        </div>
      </div>
    </div>
  );

  const footer = (
    <div className="space-y-4">
      <PhaseCompleteButton
        phaseLabel="Mobilize"
        nextPhaseLabel="Migrate & Modernize"
        canComplete={canComplete}
        isCompleted={isCompleted}
        onComplete={onCompletePhase}
        completionRequirements={[
          t('mobilize.requirements.assessPhase'),
          t('mobilize.requirements.migrationWaves'),
          t('mobilize.requirements.landingZoneItems'),
        ]}
        accentColor="mobilize"
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
      accent="mobilize"
      overview={overview}
      footer={footer}
    >
      {activeStep === 'discovery-planning' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.portfolio', { defaultValue: 'Portafolio' })}
            title={t('mobilize.tabs.discoveryPlanning')}
            description={t('mobilize.steps.discoveryPlanningHero', {
              defaultValue: 'Detalle del inventario descubierto en Assess.',
            })}
            icon={<AppWindow className="h-5 w-5" />}
          />
          <DiscoveryPlanning
            excelData={excelData}
            totalStorageGB={uploadSummary?.totalStorageGB || 0}
          />
        </section>
      )}

      {activeStep === 'migration-plan' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.portfolio', { defaultValue: 'Portafolio' })}
            title={t('mobilize.tabs.migrationPlan')}
            description={t('mobilize.steps.migrationPlanHero', {
              defaultValue: 'Plan de migración con olas y estrategias 7Rs.',
            })}
            icon={<Rocket className="h-5 w-5" />}
          />
          <MigrationPlan
            serverCount={excelData?.servers.length || 0}
            servers={excelData?.servers}
            waves={migrationWaves}
            onWavesChange={onMigrationWavesChange}
          />
        </section>
      )}

      {activeStep === 'skills-coe' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.people', { defaultValue: 'Personas' })}
            title={t('mobilize.tabs.skills')}
            description={t('mobilize.steps.skillsHero', {
              defaultValue: 'Habilidades del equipo y plan de upskilling.',
            })}
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <SkillsCoE skills={skillAssessments} onSkillsChange={onSkillAssessmentsChange} />
        </section>
      )}

      {activeStep === 'landing-zone' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.platform', { defaultValue: 'Plataforma' })}
            title={t('mobilize.tabs.landingZone')}
            description={t('mobilize.steps.landingZoneHero', {
              defaultValue: 'Cuentas, redes y baseline de la Landing Zone.',
            })}
            icon={<Cloud className="h-5 w-5" />}
          />
          <LandingZone checklist={landingZoneChecklist} onChecklistChange={onLandingZoneChange} />
        </section>
      )}

      {activeStep === 'security-compliance' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.platform', { defaultValue: 'Plataforma' })}
            title={t('mobilize.tabs.security')}
            description={t('mobilize.steps.securityHero', {
              defaultValue: 'Controles IAM, redes y compliance baseline.',
            })}
            icon={<Shield className="h-5 w-5" />}
          />
          <SecurityCompliance
            checklist={securityChecklist}
            onChecklistChange={onSecurityChecklistChange}
          />
        </section>
      )}

      {activeStep === 'architecture-diagram' && (
        <section className="space-y-4">
          <PageHeader
            eyebrow={t('mobilize.groups.platform', { defaultValue: 'Plataforma' })}
            title={t('mobilize.tabs.architecture')}
            description={t('mobilize.steps.architectureHero', {
              defaultValue: 'Diagrama generado a partir de Landing Zone y seguridad.',
            })}
            icon={<Network className="h-5 w-5" />}
          />
          <ArchitectureDiagram
            landingZone={landingZoneChecklist}
            securityChecklist={securityChecklist}
            excelData={excelData ?? undefined}
          />
        </section>
      )}
    </PhaseWorkspace>
  );
}
