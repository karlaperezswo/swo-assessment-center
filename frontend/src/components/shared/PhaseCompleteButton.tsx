import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhaseCompleteButtonProps {
  phaseLabel: string;
  nextPhaseLabel?: string;
  canComplete: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  completionRequirements: string[];
  accentColor: 'fuchsia' | 'violet' | 'amber';
}

const buttonStyles = {
  fuchsia: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
  violet: 'bg-violet-600 hover:bg-violet-700 text-white',
  amber: 'bg-amber-600 hover:bg-amber-700 text-white',
};

export function PhaseCompleteButton({
  phaseLabel,
  nextPhaseLabel,
  canComplete,
  isCompleted,
  onComplete,
  completionRequirements,
  accentColor,
}: PhaseCompleteButtonProps) {
  if (isCompleted) {
    return (
      <div className="flex items-center justify-center gap-3 py-6">
        <div className="flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-lg border border-green-300">
          <CheckCircle className="h-5 w-5" />
          <span className="font-semibold">{phaseLabel} Phase Completard</span>
        </div>
      </div>
    );
  }

  // const unmetRequirements = completionRequirements.filter((_, i) => !canComplete && i >= 0);

  return (
    <div className="border-t pt-6 mt-8">
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={onComplete}
          disabled={!canComplete}
          size="lg"
          className={cn(
            'px-8 py-6 text-lg font-semibold rounded-xl shadow-lg transition-all',
            canComplete ? buttonStyles[accentColor] : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          )}
        >
          {canComplete ? (
            <>
              Completar {phaseLabel} Phase
              {nextPhaseLabel && <ArrowRight className="h-5 w-5 ml-2" />}
            </>
          ) : (
            <>
              <Lock className="h-5 w-5 mr-2" />
              Completar {phaseLabel} Phase
            </>
          )}
        </Button>
        {!canComplete && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Requisitos para completar esta fase:</p>
            <ul className="text-sm text-gray-400 space-y-1">
              {completionRequirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
