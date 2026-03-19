import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { SubTabLayout, SubTabGroup } from '@/components/layout/SubTabLayout';
import { PhaseCompleteButton } from '@/components/shared/PhaseCompleteButton';
import { EC2Recommendations } from '@/components/migrate/EC2Recommendations';
import { RDSRecommendations } from '@/components/migrate/RDSRecommendations';
import { MigrationWaves } from '@/components/migrate/MigrationWaves';
import { CostOptimization } from '@/components/migrate/CostOptimization';
import { ModernizationRoadmap } from '@/components/migrate/ModernizationRoadmap';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ExcelData, ClientFormData, CostBreakdown,
  PhaseStatus, MigrationWave, EC2Recommendation, DatabaseRecommendation,
  GenerateReportResponse,
} from '@/types/assessment';
import {
  Server, Database, Waves, TrendingDown, Rocket, FileText, Download, Loader2,
} from 'lucide-react';

interface MigratePhaseProps {
  excelData: ExcelData | null;
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  ec2Recommendations: EC2Recommendation[];
  dbRecommendations: DatabaseRecommendation[];
  migrationWaves: MigrationWave[];
  onMigrationWavesChange: (waves: MigrationWave[]) => void;
  phaseStatus: PhaseStatus;
  onCompletePhase: () => void;
  reportResult: GenerateReportResponse | null;
  onGenerateReport: () => void;
  onDownloadReport: () => void;
  isGenerating: boolean;
}

export function MigratePhase({
  excelData, clientData, estimatedCosts,
  ec2Recommendations, dbRecommendations,
  migrationWaves, onMigrationWavesChange,
  phaseStatus, onCompletePhase,
  reportResult, onGenerateReport, onDownloadReport, isGenerating,
}: MigratePhaseProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('ec2-recommendations');

  const groups: SubTabGroup[] = [
    {
      groupLabel: t('migrate.groups.migrate'),
      tabs: [
        { value: 'ec2-recommendations', label: t('migrate.tabs.ec2'), icon: <Server className="h-4 w-4" /> },
        { value: 'rds-recommendations', label: t('migrate.tabs.rds'), icon: <Database className="h-4 w-4" /> },
        { value: 'migration-waves', label: t('migrate.tabs.waves'), icon: <Waves className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: t('migrate.groups.optimize'),
      tabs: [
        { value: 'cost-optimization', label: t('migrate.tabs.costOptimization'), icon: <TrendingDown className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: t('migrate.groups.modernize'),
      tabs: [
        { value: 'modernization-roadmap', label: t('migrate.tabs.modernizationRoadmap'), icon: <Rocket className="h-4 w-4" /> },
      ],
    },
  ];

  const canComplete = !!(phaseStatus.mobilize === 'completed' && reportResult);

  return (
    <div>
      <SubTabLayout groups={groups} activeTab={activeTab} onTabChange={setActiveTab} phaseColor="amber">
        {activeTab === 'ec2-recommendations' && (
          <EC2Recommendations
            servers={excelData?.servers || []}
            recommendations={ec2Recommendations}
          />
        )}
        {activeTab === 'rds-recommendations' && (
          <RDSRecommendations
            databases={excelData?.databases || []}
            recommendations={dbRecommendations}
          />
        )}
        {activeTab === 'migration-waves' && (
          <MigrationWaves
            waves={migrationWaves}
            onWavesChange={onMigrationWavesChange}
            
            
          />
        )}
        {activeTab === 'cost-optimization' && (
          <CostOptimization estimatedCosts={estimatedCosts} />
        )}
        {activeTab === 'modernization-roadmap' && (
          <ModernizationRoadmap />
        )}
      </SubTabLayout>

      {/* Report Generation Section */}
      <div className="mt-8 space-y-4">
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-amber-600" />
                <div>
                  <h3 className="font-bold text-amber-900">{t('migrate.report.title')}</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    {t('migrate.report.description')}
                  </p>
                </div>
              </div>
              <Button
                onClick={onGenerateReport}
                disabled={!excelData || !clientData.clientName || isGenerating}
                size="lg"
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('migrate.report.buttonGenerating')}
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    {t('migrate.report.buttonGenerate')}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {reportResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-700 font-medium">{t('migrate.report.successMessage')}</p>
                  <p className="text-sm text-green-600 mt-1">{t('migrate.report.successDescription')}</p>
                </div>
                <Button onClick={onDownloadReport} className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  {t('migrate.report.buttonDownload')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <PhaseCompleteButton
        phaseLabel="Migrar & Modernizar"
        canComplete={canComplete}
        isCompleted={phaseStatus.migrate === 'completed'}
        onComplete={onCompletePhase}
        completionRequirements={[
          t('migrate.requirements.mobilizePhase'),
          t('migrate.requirements.reportGeneration'),
        ]}
        accentColor="amber"
      />
    </div>
  );
}
