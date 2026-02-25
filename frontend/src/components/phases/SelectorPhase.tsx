import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, CheckCircle2, CloudOff } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  id: string;
  text: string;
  type: 'boolean' | 'multiple';
  options: string[];
  helpText?: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
  questions: Question[];
}

interface Answer {
  questionId: string;
  answer: string;
  timestamp: string;
}

interface ToolResult {
  tool: string;
  absoluteScore: number;
  percentageScore: number;
  rank: number;
}

interface CalculationResult {
  recommendedTool: string;
  confidence: string;
  confidencePercentage: number;
  results: ToolResult[];
  decisiveFactors: any[];
}

export function SelectorPhase() {
  const [clientName, setClientName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  // Auto-save effect: saves session 500ms after last answer change
  useEffect(() => {
    if (!sessionId || answers.length === 0) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set saving status immediately
    setSaveStatus('saving');

    // Debounce: wait 500ms before saving
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const session = {
          sessionId,
          clientName,
          answers,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completed: false
        };

        const response = await fetch('http://localhost:4000/api/selector/session/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session })
        });

        const data = await response.json();
        
        if (data.success) {
          setSaveStatus('saved');
          // Reset to idle after 2 seconds
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('error');
          console.error('Save failed:', data.error);
        }
      } catch (error) {
        setSaveStatus('error');
        console.error('Error auto-saving session:', error);
      }
    }, 500);

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [answers, sessionId, clientName]);

  const loadQuestions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/selector/questions');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Error al cargar las preguntas');
    }
  };

  const handleStartSession = async () => {
    if (!clientName) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:4000/api/selector/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName })
      });
      const data = await response.json();
      if (data.success) {
        setSessionId(data.data.sessionId);
        toast.success('Sesión creada exitosamente');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Error al crear la sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    const newAnswers = answers.filter(a => a.questionId !== questionId);
    newAnswers.push({
      questionId,
      answer,
      timestamp: new Date().toISOString()
    });
    setAnswers(newAnswers);
    
    // Clear validation state when user answers
    if (showValidation) {
      setShowValidation(false);
    }
  };

  const getAllQuestions = () => {
    return categories.flatMap(cat => cat.questions);
  };

  const getUnansweredQuestions = () => {
    const allQuestions = getAllQuestions();
    const answeredIds = new Set(answers.map(a => a.questionId));
    return allQuestions.filter(q => !answeredIds.has(q.id));
  };

  const handleCalculate = async () => {
    const totalQuestions = getAllQuestions().length;
    const unanswered = getUnansweredQuestions();

    // Validation: check if all questions are answered
    if (unanswered.length > 0) {
      setShowValidation(true);
      toast.error(`Debes responder todas las preguntas (${unanswered.length} faltan)`);
      
      // Scroll to first unanswered question
      const firstUnanswered = unanswered[0];
      const element = questionRefs.current[firstUnanswered.id];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // All questions answered, proceed with calculation
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/selector/session/${sessionId}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: {
            sessionId,
            clientName,
            answers,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completed: true
          }
        })
      });
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        toast.success('Recomendación calculada exitosamente');
      }
    } catch (error) {
      console.error('Error calculating:', error);
      toast.error('Error al calcular la recomendación');
    } finally {
      setLoading(false);
    }
  };

  const isQuestionAnswered = (questionId: string) => {
    return answers.some(a => a.questionId === questionId);
  };

  // Start session screen
  if (!sessionId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Selector de Herramienta MAP</CardTitle>
            <CardDescription>
              Responde 28 preguntas para obtener la recomendación de herramienta ideal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="clientName">Nombre del Cliente</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Acme Corp"
              />
            </div>
            <Button onClick={handleStartSession} disabled={!clientName || loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Comenzar Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (result) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultado del Assessment</CardTitle>
            <CardDescription>Cliente: {clientName}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <h3 className="text-2xl font-bold mb-2">Herramienta Recomendada</h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">
                {result.recommendedTool}
              </p>
              <Badge variant={result.confidence === 'high' ? 'default' : 'secondary'}>
                Confianza: {result.confidence} ({result.confidencePercentage.toFixed(1)}%)
              </Badge>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Scores de Todas las Herramientas</h4>
              <div className="space-y-2">
                {result.results.map((tool) => (
                  <div key={tool.tool} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{tool.rank}</Badge>
                      <span className="font-medium">{tool.tool}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600">
                        {tool.absoluteScore} pts
                      </span>
                      <span className="font-semibold">
                        {tool.percentageScore.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => { setResult(null); setSessionId(''); setAnswers([]); setShowValidation(false); }}>
              Nuevo Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Questionnaire screen (single page with all questions)
  const totalQuestions = getAllQuestions().length;
  const unansweredCount = getUnansweredQuestions().length;
  const progress = (answers.length / totalQuestions) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <h3 className="text-lg font-semibold">Assessment: {clientName}</h3>
              <p className="text-sm text-gray-600">
                Responde todas las preguntas para obtener tu recomendación
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Save status indicator */}
              {saveStatus === 'saving' && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Guardando...</span>
                </div>
              )}
              {saveStatus === 'saved' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Guardado</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <CloudOff className="h-4 w-4" />
                  <span>Error al guardar</span>
                </div>
              )}
              <Badge variant={answers.length === totalQuestions ? 'default' : 'secondary'} className="text-base px-3 py-1">
                {answers.length} / {totalQuestions} respondidas
              </Badge>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-in-out" 
              style={{ width: `${progress}%` }} 
            />
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-8 pt-6">
          {/* All categories and questions in single scrollable view */}
          {categories.map((category) => (
            <div key={category.id} className="space-y-4">
              {/* Category header */}
              <div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-900">{category.name}</h3>
                <p className="text-sm text-blue-700">{category.description}</p>
              </div>

              {/* Questions in this category */}
              {category.questions.map((question) => {
                const currentAnswer = answers.find(a => a.questionId === question.id);
                const isAnswered = isQuestionAnswered(question.id);
                const showError = showValidation && !isAnswered;

                return (
                  <div
                    key={question.id}
                    ref={(el) => (questionRefs.current[question.id] = el)}
                    className={`border rounded-lg p-4 transition-all ${
                      showError ? 'border-red-500 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {showError && (
                        <AlertCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <Label className={`text-base font-medium ${showError ? 'text-red-900' : ''}`}>
                          {question.text}
                        </Label>
                        {question.helpText && (
                          <p className="text-sm text-gray-600 mt-1">{question.helpText}</p>
                        )}
                        {showError && (
                          <p className="text-sm text-red-600 mt-1 font-medium">
                             Esta pregunta es obligatoria
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-8">
                      {question.options.map((option) => (
                        <Button
                          key={option}
                          variant={currentAnswer?.answer === option ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleAnswer(question.id, option)}
                          className={showError && !isAnswered ? 'border-red-300' : ''}
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Calculate button at the bottom */}
          <div className="pt-6 border-t">
            {showValidation && unansweredCount > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900">
                    Debes responder todas las preguntas
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Faltan {unansweredCount} pregunta{unansweredCount !== 1 ? 's' : ''} por responder
                  </p>
                </div>
              </div>
            )}
            <Button 
              onClick={handleCalculate} 
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Calcular Recomendación
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
