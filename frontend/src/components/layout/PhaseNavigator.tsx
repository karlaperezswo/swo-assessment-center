import { MigrationPhase, PhaseStatus } from '@/types/assessment';
import { CheckCircle, Search, Rocket, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseNavigatorProps {
  currentPhase: MigrationPhase;
  onPhaseChange: (phase: MigrationPhase) => void;
  phaseStatus: PhaseStatus;
}

const phaseConfig = [
  {
    key: 'assess' as MigrationPhase,
    number: 1,
    label: 'EVALUAR',
    subtitle: 'Crear un caso de cambio',
    icon: Search,
    colors: {
      active: 'border-fuchsia-600 bg-gradient-to-br from-fuchsia-50 to-pink-50 text-fuchsia-900',
      completed: 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100',
      default: 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300',
      number: 'text-fuchsia-600 bg-fuchsia-100',
      borderBottom: 'bg-fuchsia-600',
    },
  },
  {
    key: 'mobilize' as MigrationPhase,
    number: 2,
    label: 'MOVILIZAR',
    subtitle: 'Construir preparación a través de experiencias',
    icon: Rocket,
    colors: {
      active: 'border-violet-600 bg-gradient-to-br from-violet-50 to-purple-50 text-violet-900',
      completed: 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100',
      default: 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300',
      number: 'text-violet-600 bg-violet-100',
      borderBottom: 'bg-violet-600',
    },
  },
  {
    key: 'migrate' as MigrationPhase,
    number: 3,
    label: 'MIGRAR Y MODERNIZAR',
    subtitle: 'Acelerar la transformación a escala',
    icon: Zap,
    colors: {
      active: 'border-amber-600 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-900',
      completed: 'border-green-500 bg-green-50 text-green-800 hover:bg-green-100',
      default: 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:border-gray-300',
      number: 'text-amber-600 bg-amber-100',
      borderBottom: 'bg-amber-600',
    },
  },
];

export function PhaseNavigator({ currentPhase, onPhaseChange, phaseStatus, children }: PhaseNavigatorProps & { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      {/* Phase tabs */}
      <div className="grid grid-cols-3 gap-2">
        {phaseConfig.map((phase) => {
          const status = phaseStatus[phase.key];
          const isActive = currentPhase === phase.key;
          const Icon = phase.icon;

          const canNavigate = status !== 'not_started' || phase.key === 'assess';

          return (
            <button
              key={phase.key}
              onClick={() => canNavigate && onPhaseChange(phase.key)}
              disabled={!canNavigate}
              className={cn(
                'relative p-4 rounded-xl border-2 transition-all text-left',
                isActive
                  ? phase.colors.active
                  : status === 'completed'
                  ? phase.colors.completed
                  : status === 'not_started'
                  ? 'border-gray-200 bg-gray-50 text-gray-300 cursor-not-allowed opacity-60'
                  : phase.colors.default
              )}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className={cn('absolute bottom-0 left-2 right-2 h-1 rounded-t-full', phase.colors.borderBottom)} />
              )}

              <div className="flex items-center gap-2 mb-1">
                {status === 'completed' ? (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : (
                  <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', isActive ? phase.colors.number : 'bg-gray-200 text-gray-400')}>
                    {phase.number}
                  </div>
                )}
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="font-bold text-sm truncate">{phase.label}</span>
              </div>
              <p className="text-[11px] opacity-70 pl-8 hidden md:block">{phase.subtitle}</p>
            </button>
          );
        })}
      </div>

      {/* Phase content */}
      {children}
    </div>
  );
}
