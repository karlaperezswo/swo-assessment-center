import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, FileDown, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from 'recharts';

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
  // API URL from environment variable, fallback to localhost for development
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  
  const [clientName, setClientName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [exportLoading, setExportLoading] = useState<'pdf' | 'csv' | null>(null);
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/selector/questions`);
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
      const response = await fetch(`${API_URL}/api/selector/session`, {
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

  const handleExportPDF = async () => {
    if (!result) return;
    
    setExportLoading('pdf');
    try {
      const session = {
        sessionId,
        clientName,
        answers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: true
      };

      const response = await fetch(`${API_URL}/api/selector/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, result })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selector-${clientName}-${sessionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('PDF descargado exitosamente');
      } else {
        toast.error('Error al generar PDF');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportCSV = async () => {
    if (!result) return;
    
    setExportLoading('csv');
    try {
      const session = {
        sessionId,
        clientName,
        answers,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: true
      };

      const response = await fetch(`${API_URL}/api/selector/export/csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session, result })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `selector-${clientName}-${sessionId}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV descargado exitosamente');
      } else {
        toast.error('Error al generar CSV');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Error al exportar CSV');
    } finally {
      setExportLoading(null);
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

    // Auto-scroll to next unanswered question
    const allQuestions = getAllQuestions();
    const currentIndex = allQuestions.findIndex(q => q.id === questionId);
    const nextUnanswered = allQuestions
      .slice(currentIndex + 1)
      .find(q => !isQuestionAnswered(q.id));
    
    if (nextUnanswered) {
      setTimeout(() => {
        const element = questionRefs.current[nextUnanswered.id];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
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
      const response = await fetch(`${API_URL}/api/selector/session/${sessionId}/calculate`, {
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
        
        // Auto-scroll to top to show results
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
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

  // Start session screen (only shown when no sessionId)
  if (!sessionId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
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
              Comenzar Selector
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen (both for completed assessments and view-only mode)
  if (result) {
    // Prepare data for radar chart with absolute scores and winner flag
    const radarData = result.results.map(tool => ({
      tool: tool.tool,
      score: tool.percentageScore,
      absoluteScore: tool.absoluteScore,
      isWinner: tool.rank === 1
    }));

    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultado del Assessment</CardTitle>
                <CardDescription>Cliente: {clientName}</CardDescription>
              </div>
            </div>
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

            {/* Radar Chart */}
            <div>
              <h4 className="font-semibold mb-4">Comparación Visual de Herramientas</h4>
              <div className="bg-gray-50 rounded-lg p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis 
                      dataKey="tool" 
                      tick={{ fill: '#475569', fontSize: 14, fontWeight: 500 }}
                    />
                    <PolarRadiusAxis 
                      angle={90} 
                      domain={[0, 100]}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#2563eb"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      label={(props: any) => {
                        const { x, y, value, index } = props;
                        const dataPoint = radarData[index];
                        if (!dataPoint) return null;
                        
                        const isWinner = dataPoint.isWinner || false;
                        const absoluteScore = dataPoint.absoluteScore || 0;
                        
                        return (
                          <text
                            x={x}
                            y={y}
                            fill={isWinner ? '#2563eb' : '#1e40af'}
                            fontSize={isWinner ? 18 : 14}
                            fontWeight={isWinner ? 700 : 600}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            {`${value.toFixed(1)}% (${absoluteScore} pts)`}
                          </text>
                        );
                      }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Score']}
                      labelFormatter={(label: string) => `Herramienta: ${label}`}
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '2px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        fontWeight: 500
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                      formatter={() => 'Score (%)'}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Decisive Factors */}
            {result.decisiveFactors && result.decisiveFactors.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold">¿Por qué esta recomendación?</h4>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-900 mb-4">
                    Estas preguntas tuvieron mayor impacto en la recomendación de <span className="font-semibold">{result.recommendedTool}</span>:
                  </p>
                  <div className="space-y-3">
                    {result.decisiveFactors.slice(0, 5).map((factor: any, index: number) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-amber-100">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="mt-0.5 bg-amber-100 text-amber-900 border-amber-300">
                            #{index + 1}
                          </Badge>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 mb-1">
                              {factor.questionText || factor.questionId}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-gray-600">
                                Tu respuesta: <span className="font-medium text-gray-900">{factor.answer}</span>
                              </span>
                              <span className="text-amber-700">
                                Impacto: <span className="font-semibold">+{factor.impact.toFixed(1)} pts</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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

            {/* Export Buttons */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Exportar Resultados</h4>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleExportPDF}
                  disabled={exportLoading !== null}
                >
                  {exportLoading === 'pdf' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Exportar PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExportCSV}
                  disabled={exportLoading !== null}
                >
                  {exportLoading === 'csv' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Exportar CSV
                </Button>
              </div>
            </div>
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
              <div className="border-l-2 border-gray-200 pl-4 py-2 bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-400">{category.name}</h3>
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
                        <Label className={`text-base font-normal ${showError ? 'text-red-900' : ''}`}>
                          {question.text}
                        </Label>
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
