import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExcelData } from '@/types/assessment';
import { RiskRule, evaluateRisks, summarizeRisks, DEFAULT_RISK_RULES } from '@/lib/riskRules';
import { usePersistedState } from '@/lib/usePersistedState';
import { AlertTriangle, Settings, Plus, RotateCcw, Trash2 } from 'lucide-react';

interface RiskRulesEditorProps {
  excelData: ExcelData | null;
}

const severityColor = {
  low: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  medium: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  high: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export function RiskRulesEditor({ excelData }: RiskRulesEditorProps) {
  const [rules, setRules] = usePersistedState<RiskRule[]>('riskRules', DEFAULT_RISK_RULES);
  const [showEditor, setShowEditor] = useState(false);
  const [newRule, setNewRule] = useState<Omit<RiskRule, 'id'>>({
    label: '',
    pattern: '',
    severity: 'medium',
    enabled: true,
    category: 'os',
  });

  const matches = useMemo(() => evaluateRisks(excelData, rules), [excelData, rules]);
  const summary = useMemo(() => summarizeRisks(matches), [matches]);

  const toggleRule = (id: string) =>
    setRules(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));

  const removeRule = (id: string) => setRules(rules.filter((r) => r.id !== id));

  const addRule = () => {
    if (!newRule.label || !newRule.pattern) return;
    try {
      new RegExp(newRule.pattern);
    } catch {
      return;
    }
    setRules([
      ...rules,
      { ...newRule, id: `custom-${Date.now()}` },
    ]);
    setNewRule({ label: '', pattern: '', severity: 'medium', enabled: true, category: 'os' });
  };

  const resetRules = () => setRules(DEFAULT_RISK_RULES);

  return (
    <Card className="border-l-4 border-l-amber-500 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Riesgos detectados
          </span>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800">{summary.high} alto</Badge>
            <Badge className="bg-amber-100 text-amber-800">{summary.medium} medio</Badge>
            <Badge className="bg-blue-100 text-blue-800">{summary.low} bajo</Badge>
            <Button variant="outline" size="sm" onClick={() => setShowEditor(!showEditor)}>
              <Settings className="h-3 w-3 mr-1" />
              Reglas
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-sm text-gray-500">
            No se detectaron riesgos con las reglas activas.
          </p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(summary.byRule)
              .sort((a, b) => b[1] - a[1])
              .map(([label, count]) => {
                const rule = rules.find((r) => r.label === label);
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {rule && (
                        <Badge className={severityColor[rule.severity]} variant="outline">
                          {rule.severity}
                        </Badge>
                      )}
                      <span className="text-gray-700">{label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                );
              })}
          </div>
        )}

        {showEditor && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-600">Reglas configurables</p>
              <Button variant="ghost" size="sm" onClick={resetRules}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 p-2 border rounded text-sm"
                >
                  <Checkbox
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <Badge className={severityColor[rule.severity]} variant="outline">
                    {rule.severity}
                  </Badge>
                  <span className="text-xs text-gray-500 w-20">{rule.category}</span>
                  <span className="font-medium text-gray-800 flex-1">{rule.label}</span>
                  <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {rule.pattern}
                  </code>
                  {rule.id.startsWith('custom-') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-600 hover:text-red-700 h-7 w-7 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t">
              <p className="text-xs font-semibold text-gray-600 mb-2">Nueva regla</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Etiqueta</Label>
                  <Input
                    value={newRule.label}
                    onChange={(e) => setNewRule({ ...newRule, label: e.target.value })}
                    placeholder="e.g. Solaris 10"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Patrón (regex)</Label>
                  <Input
                    value={newRule.pattern}
                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                    placeholder="e.g. solaris.*10"
                    className="text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Severidad</Label>
                  <select
                    value={newRule.severity}
                    onChange={(e) =>
                      setNewRule({ ...newRule, severity: e.target.value as RiskRule['severity'] })
                    }
                    className="w-full text-sm border rounded px-2 py-1.5"
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Categoría</Label>
                  <select
                    value={newRule.category}
                    onChange={(e) =>
                      setNewRule({
                        ...newRule,
                        category: e.target.value as RiskRule['category'],
                      })
                    }
                    className="w-full text-sm border rounded px-2 py-1.5"
                  >
                    <option value="os">os</option>
                    <option value="database">database</option>
                    <option value="hardware">hardware</option>
                  </select>
                </div>
              </div>
              <Button size="sm" onClick={addRule} className="mt-2" disabled={!newRule.label || !newRule.pattern}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar regla
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
