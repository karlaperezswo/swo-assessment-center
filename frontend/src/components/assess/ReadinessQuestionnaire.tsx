import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  READINESS_QUESTIONS,
  QuestionAnswer,
  applyAnswersToChecklist,
  computeProgress,
} from '@/lib/readinessQuestionnaire';
import { useReadinessChecklist, useReadinessAnswers } from '@/lib/readinessStore';
import { ClipboardList, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ReadinessQuestionnaireProps {
  /** When true, render collapsed by default with just progress + toggle. */
  defaultCollapsed?: boolean;
}

const answerButtonStyles: Record<QuestionAnswer, string> = {
  yes: 'bg-green-600 text-white hover:bg-green-700',
  partial: 'bg-amber-500 text-white hover:bg-amber-600',
  no: 'bg-red-600 text-white hover:bg-red-700',
  unknown: 'bg-gray-400 text-white hover:bg-gray-500',
};

const answerLabels: Record<QuestionAnswer, string> = {
  yes: 'Sí',
  partial: 'Parcial',
  no: 'No',
  unknown: 'No sé',
};

export function ReadinessQuestionnaire({ defaultCollapsed = false }: ReadinessQuestionnaireProps) {
  const [answers, setAnswers] = useReadinessAnswers();
  const [, setChecklist] = useReadinessChecklist();
  const [expanded, setExpanded] = useState(!defaultCollapsed);

  const progress = computeProgress(answers);

  const handleAnswer = (questionId: string, answer: QuestionAnswer) => {
    const nextAnswers = { ...answers, [questionId]: answer };
    setAnswers(nextAnswers);
    setChecklist((currentChecklist) => applyAnswersToChecklist(nextAnswers, currentChecklist));
  };

  const handleReset = () => {
    setAnswers({});
    toast.success('Respuestas del cuestionario borradas');
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-blue-600" />
            Cuestionario guiado de preparación
          </span>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              {progress.answered}/{progress.total} · {progress.percent}%
            </Badge>
            {progress.answered > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={handleReset} aria-label="Reset questionnaire answers">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Colapsar cuestionario' : 'Expandir cuestionario'}
              aria-expanded={expanded}
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Responde cada pregunta para marcar automáticamente los checks correspondientes en
          Preparación para Migración.
        </p>
      </CardHeader>
      {expanded && (
        <CardContent>
          <div className="w-full bg-blue-100 rounded-full h-1 mb-4 overflow-hidden">
            <div
              className="h-1 bg-blue-600 transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <ul className="space-y-4">
            {READINESS_QUESTIONS.map((q) => {
              const currentAnswer = answers[q.id];
              return (
                <li key={q.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[280px]">
                      <p className="text-sm text-gray-900">{q.label}</p>
                      {q.hint && <p className="text-xs text-gray-500 mt-0.5">{q.hint}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {(['yes', 'partial', 'no', 'unknown'] as QuestionAnswer[]).map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => handleAnswer(q.id, a)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                            currentAnswer === a
                              ? answerButtonStyles[a]
                              : 'bg-white border text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {answerLabels[a]}
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
