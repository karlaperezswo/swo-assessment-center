import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { SubTabLayout, SubTabGroup } from '@/components/layout/SubTabLayout';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { DiscoveryPlanning } from '@/components/mobilize/DiscoveryPlanning';
import { MigrationPlan } from '@/components/mobilize/MigrationPlan';
import { SkillsCoE } from '@/components/mobilize/SkillsCoE';
import { LandingZone } from '@/components/mobilize/LandingZone';
import { SecurityCompliance } from '@/components/mobilize/SecurityCompliance';
import { ArchitectureDiagram } from '@/components/mobilize/ArchitectureDiagram';
import {
  ExcelData, UploadSummary, ClientFormData, CostBreakdown,
  PhaseStatus, MigrationWave, SkillAssessment,
  LandingZoneChecklist, SecurityComplianceChecklist,
  GenerateReportResponse, EC2Recommendation, DatabaseRecommendation,
} from '@/types/assessment';
import {
  AppWindow, Waves, GraduationCap, Cloud, Shield, Network,
} from 'lucide-react';

interface MobilizePhaseProps {
  excelData: ExcelData | null;
  uploadSummary: UploadSummary | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  ec2Recommendations: EC2Recommendation[];
  dbRecommendations: DatabaseRecommendation[];
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

export function MobilizePhase({
  excelData, uploadSummary,
  migrationWaves, onMigrationWavesChange,
  skillAssessments, onSkillAssessmentsChange,
  landingZoneChecklist, onLandingZoneChange,
  securityChecklist, onSecurityChecklistChange,
  phaseStatus, onCompletePhase,
}: MobilizePhaseProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('discovery-planning');

  const groups: SubTabGroup[] = [
    {
      groupLabel: t('mobilize.groups.portfolio'),
      tabs: [
        { value: 'discovery-planning', label: t('mobilize.tabs.discoveryPlanning'), icon: <AppWindow className="h-4 w-4" /> },
        { value: 'migration-plan', label: t('mobilize.tabs.migrationPlan'), icon: <Waves className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: t('mobilize.groups.people'),
      tabs: [
        { value: 'skills-coe', label: t('mobilize.tabs.skills'), icon: <GraduationCap className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: t('mobilize.groups.platform'),
      tabs: [
        { value: 'landing-zone', label: t('mobilize.tabs.landingZone'), icon: <Cloud className="h-4 w-4" /> },
        { value: 'security-compliance', label: t('mobilize.tabs.security'), icon: <Shield className="h-4 w-4" /> },
        { value: 'architecture-diagram', label: t('mobilize.tabs.architecture'), icon: <Network className="h-4 w-4" /> },
      ],
    },
  ];

  const canComplete = !!(
    phaseStatus.assess === 'completed' &&
    migrationWaves.length > 0 &&
    landingZoneChecklist.accountStructure.some(item => item.completed)
  );

  return (
    <div>
      <SubTabLayout groups={groups} activeTab={activeTab} onTabChange={setActiveTab} phaseColor="violet">
        {activeTab === 'discovery-planning' && (
          <DiscoveryPlanning
            excelData={excelData}
            totalStorageGB={uploadSummary?.totalStorageGB || 0}
          />
        )}
        {activeTab === 'migration-plan' && (
          <MigrationPlan
            serverCount={excelData?.servers.length || 0}
            servers={excelData?.servers}
            waves={migrationWaves}
            onWavesChange={onMigrationWavesChange}
          />
        )}
        {activeTab === 'skills-coe' && (
          <SkillsCoE
            skills={skillAssessments}
            onSkillsChange={onSkillAssessmentsChange}
          />
        )}
        {activeTab === 'landing-zone' && (
          <LandingZone
            checklist={landingZoneChecklist}
            onChecklistChange={onLandingZoneChange}
          />
        )}
        {activeTab === 'security-compliance' && (
          <SecurityCompliance
            checklist={securityChecklist}
            onChecklistChange={onSecurityChecklistChange}
          />
        )}
        {activeTab === 'architecture-diagram' && (
          <ArchitectureDiagram
            landingZone={landingZoneChecklist}
            securityChecklist={securityChecklist}
          />
        )}
      </SubTabLayout>

      <PhaseCompleteButton
        phaseLabel="Mobilize"
        nextPhaseLabel="Migrate & Modernize"
        canComplete={canComplete}
        isCompleted={phaseStatus.mobilize === 'completed'}
        onComplete={onCompletePhase}
        completionRequirements={[
          t('mobilize.requirements.assessPhase'),
          t('mobilize.requirements.migrationWaves'),
          t('mobilize.requirements.landingZoneItems'),
        ]}
        accentColor="violet"
      />
    </div>
  );
}
