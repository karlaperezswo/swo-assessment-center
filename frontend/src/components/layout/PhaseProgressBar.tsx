import { PhaseStatus, MigrationPhase } from '@/types/assessment';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseProgressBarProps {
  phaseStatus: PhaseStatus;
  currentPhase: MigrationPhase;
}

const phases: { key: MigrationPhase; label: string; subtitle: string }[] = [
  { key: 'assess', label: 'Evaluar', subtitle: 'Crear un caso de cambio' },
  { key: 'mobilize', label: 'Movilizar', subtitle: 'Construir preparación' },
  { key: 'migrate', label: 'Migrar y Modernizar', subtitle: 'Acelerar la transformación' },
];

const phaseColors = {
  assess: { circle: 'bg-fuchsia-600', ring: 'ring-fuchsia-300', text: 'text-fuchsia-700' },
  mobilize: { circle: 'bg-violet-600', ring: 'ring-violet-300', text: 'text-violet-700' },
  migrate: { circle: 'bg-amber-600', ring: 'ring-amber-300', text: 'text-amber-700' },
};

export function PhaseProgressBar({ phaseStatus, currentPhase }: PhaseProgressBarProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-3xl mx-auto py-4">
      {phases.map((phase, index) => {
        const status = phaseStatus[phase.key];
        const isActive = currentPhase === phase.key;
        const colors = phaseColors[phase.key];

        return (
          <div key={phase.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  status === 'completed'
                    ? 'bg-green-500 text-white'
                    : status === 'in_progress'
                    ? cn(colors.circle, 'text-white ring-4', colors.ring, 'animate-pulse')
                    : 'bg-gray-200 text-gray-400'
                )}
              >
                {status === 'completed' ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  'text-xs font-semibold mt-2 text-center',
                  isActive ? colors.text : status === 'completed' ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {phase.label}
              </span>
              <span className="text-[10px] text-gray-400 text-center hidden sm:block">
                {phase.subtitle}
              </span>
            </div>
            {/* Connector line */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-3 transition-all duration-500',
                  status === 'completed' ? 'bg-green-400' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
