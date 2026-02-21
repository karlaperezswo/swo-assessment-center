import { useState } from 'react';
import { SubTabLayout, SubTabGroup } from '@/components/layout/SubTabLayout';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { DiscoveryPlanning } from '@/components/mobilize/DiscoveryPlanning';
import { MigrationPlan } from '@/components/mobilize/MigrationPlan';
import { BusinessCase } from '@/components/mobilize/BusinessCase';
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
  AppWindow, Waves, Sparkles, GraduationCap, Cloud, Shield, Network,
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
  excelData, uploadSummary, clientData, estimatedCosts, reportResult,
  migrationWaves, onMigrationWavesChange,
  skillAssessments, onSkillAssessmentsChange,
  landingZoneChecklist, onLandingZoneChange,
  securityChecklist, onSecurityChecklistChange,
  phaseStatus, onCompletePhase,
}: MobilizePhaseProps) {
  const [activeTab, setActiveTab] = useState('business-case');

  const groups: SubTabGroup[] = [
    {
      groupLabel: 'Portafolio',
      tabs: [
        { value: 'discovery-planning', label: 'Descubrimiento y Planificación', icon: <AppWindow className="h-4 w-4" /> },
        { value: 'migration-plan', label: 'Plan de Migración', icon: <Waves className="h-4 w-4" /> },
        { value: 'business-case', label: 'Caso de Negocio', icon: <Sparkles className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: 'Personas',
      tabs: [
        { value: 'skills-coe', label: 'Habilidades y CoE', icon: <GraduationCap className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: 'Plataforma',
      tabs: [
        { value: 'landing-zone', label: 'Landing Zone', icon: <Cloud className="h-4 w-4" /> },
        { value: 'security-compliance', label: 'Seguridad y Cumplimiento', icon: <Shield className="h-4 w-4" /> },
        { value: 'architecture-diagram', label: 'Diagrama de Arquitectura', icon: <Network className="h-4 w-4" /> },
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
        {activeTab === 'business-case' && (
          <BusinessCase
            clientData={clientData}
            estimatedCosts={estimatedCosts}
            totalServers={excelData?.servers.length || 0}
            migrationReadiness={clientData.migrationReadiness}
            calculatorLinks={reportResult?.calculatorLinks}
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
          'Completar fase de Evaluación',
          'Definir al menos 1 ola de migración',
          'Iniciar configuración de Landing Zone (marcar al menos 1 item)',
        ]}
        accentColor="violet"
      />
    </div>
  );
}
