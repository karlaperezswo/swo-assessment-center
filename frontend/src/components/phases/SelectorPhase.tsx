import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

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
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/selector/questions');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
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
      }
    } catch (error) {
      console.error('Error creating session:', error);
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
  };

  const handleCalculate = async () => {
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
      }
    } catch (error) {
      console.error('Error calculating:', error);
    } finally {
      setLoading(false);
    }
  };

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

            <Button onClick={() => { setResult(null); setSessionId(''); setAnswers([]); }}>
              Nuevo Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentCategory = categories[currentCategoryIndex];
  const totalQuestions = categories.reduce((sum, cat) => sum + cat.questions.length, 0);
  const progress = (answers.length / totalQuestions) * 100;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Assessment: {clientName}</CardTitle>
              <CardDescription>
                Categoría {currentCategoryIndex + 1} de {categories.length}: {currentCategory?.name}
              </CardDescription>
            </div>
            <Badge>{answers.length} / {totalQuestions} respondidas</Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentCategory?.questions.map((question) => {
            const currentAnswer = answers.find(a => a.questionId === question.id);
            return (
              <div key={question.id} className="border-b pb-4">
                <div className="flex items-start gap-2 mb-3">
                  {currentAnswer ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 mt-1" />
                  )}
                  <div className="flex-1">
                    <Label className="text-base font-medium">{question.text}</Label>
                    {question.helpText && (
                      <p className="text-sm text-gray-600 mt-1">{question.helpText}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {question.options.map((option) => (
                    <Button
                      key={option}
                      variant={currentAnswer?.answer === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleAnswer(question.id, option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentCategoryIndex(Math.max(0, currentCategoryIndex - 1))}
              disabled={currentCategoryIndex === 0}
            >
              Anterior
            </Button>
            {currentCategoryIndex < categories.length - 1 ? (
              <Button onClick={() => setCurrentCategoryIndex(currentCategoryIndex + 1)}>
                Siguiente Categoría
              </Button>
            ) : (
              <Button onClick={handleCalculate} disabled={answers.length < totalQuestions || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Calcular Recomendación
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
