import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('ec2-recommendations');

  const groups: SubTabGroup[] = [
    {
      groupLabel: 'Migrar',
      tabs: [
        { value: 'ec2-recommendations', label: 'Recomendaciones EC2', icon: <Server className="h-4 w-4" /> },
        { value: 'rds-recommendations', label: 'Recomendaciones RDS', icon: <Database className="h-4 w-4" /> },
        { value: 'migration-waves', label: 'Olas de Migración', icon: <Waves className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: 'Optimizar',
      tabs: [
        { value: 'cost-optimization', label: 'Optimización de Costos', icon: <TrendingDown className="h-4 w-4" /> },
      ],
    },
    {
      groupLabel: 'Modernizar',
      tabs: [
        { value: 'modernization-roadmap', label: 'Hoja de Ruta de Modernización', icon: <Rocket className="h-4 w-4" /> },
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
                  <h3 className="font-bold text-amber-900">Reporte de Evaluación Final</h3>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Generar un documento Word completo con todas las recomendaciones de migración
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
                    Generando...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Reporte
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
                  <p className="text-green-700 font-medium">¡Reporte generado exitosamente!</p>
                  <p className="text-sm text-green-600 mt-1">Haz clic en descargar para obtener tu documento Word</p>
                </div>
                <Button onClick={onDownloadReport} className="bg-green-600 hover:bg-green-700">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Reporte
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
          'Completar fase de Movilización',
          'Generar reporte de evaluación final',
        ]}
        accentColor="amber"
      />
    </div>
  );
}
