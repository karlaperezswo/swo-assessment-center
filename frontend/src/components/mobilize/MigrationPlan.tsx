import { SevenRsChart } from '@/components/SevenRsChart';
import { MigrationWaves } from '@/components/migrate/MigrationWaves';
import { MigrationWave, Server } from '@/types/assessment';
import { BarChart3, Waves } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface MigrationPlanProps {
  serverCount: number;
  servers?: Server[];
  waves: MigrationWave[];
  onWavesChange: (waves: MigrationWave[]) => void;
}

export function MigrationPlan({ serverCount, servers, waves, onWavesChange }: MigrationPlanProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* 7Rs Strategy Distribution */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-6 w-6 text-violet-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('migrationPlan.strategyTitle')}</h2>
        </div>
        <SevenRsChart serverCount={serverCount} servers={servers} />
      </section>

      {/* Migration Waves Management */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Waves className="h-6 w-6 text-violet-600" />
          <h2 className="text-xl font-bold text-gray-900">{t('migrationPlan.wavesTitle')}</h2>
        </div>
        <MigrationWaves waves={waves} onWavesChange={onWavesChange} />
      </section>
    </div>
  );
}
