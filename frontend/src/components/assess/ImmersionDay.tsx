import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImmersionDayPlan } from '@/types/assessment';
import { GraduationCap, Plus, Trash2, CheckCircle, Clock, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImmersionDayProps {
  plans: ImmersionDayPlan[];
  onPlansChange: (plans: ImmersionDayPlan[]) => void;
}

const SUGGESTED_TOPICS = [
  { topic: 'AWS Cloud Foundation', duration: '4 hours', objectives: ['Understand AWS core services', 'Hands-on with EC2, S3, VPC'], deliverables: ['Cloud foundation knowledge baseline'] },
  { topic: 'Migration Strategies Deep Dive', duration: '4 hours', objectives: ['Learn 7Rs framework in depth', 'Assess application migration strategies'], deliverables: ['Application migration strategy matrix'] },
  { topic: 'Well-Architected Review', duration: '8 hours', objectives: ['Review 6 pillars of Well-Architected', 'Identify improvement areas'], deliverables: ['Well-Architected assessment report'] },
  { topic: 'Security & Compliance on AWS', duration: '4 hours', objectives: ['Shared responsibility model', 'IAM best practices', 'Compliance frameworks'], deliverables: ['Security baseline checklist'] },
  { topic: 'Database Migration Workshop', duration: '8 hours', objectives: ['AWS DMS hands-on', 'Schema conversion tool', 'Migration testing'], deliverables: ['Database migration plan'] },
  { topic: 'Container & Modernization', duration: '4 hours', objectives: ['Containerization strategies', 'ECS/EKS overview', 'Hands-on deployment'], deliverables: ['Containerization assessment'] },
];

const statusConfig = {
  planned: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50 border-yellow-200', label: 'Planned' },
  in_progress: { icon: Play, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-200', label: 'In Progress' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 border-green-200', label: 'Completed' },
};

export function ImmersionDay({ plans, onPlansChange }: ImmersionDayProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddSuggested = (suggestion: typeof SUGGESTED_TOPICS[0]) => {
    const plan: ImmersionDayPlan = {
      id: `id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      topic: suggestion.topic,
      date: '',
      duration: suggestion.duration,
      objectives: suggestion.objectives,
      status: 'planned',
      deliverables: suggestion.deliverables,
    };
    onPlansChange([...plans, plan]);
  };

  const handleRemove = (id: string) => {
    onPlansChange(plans.filter(p => p.id !== id));
  };

  const handleStatusChange = (id: string) => {
    onPlansChange(plans.map(p => {
      if (p.id !== id) return p;
      const next = p.status === 'planned' ? 'in_progress' : p.status === 'in_progress' ? 'completed' : 'planned';
      return { ...p, status: next };
    }));
  };

  const handleDateChange = (id: string, date: string) => {
    onPlansChange(plans.map(p => p.id === id ? { ...p, date } : p));
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card className="bg-gradient-to-r from-fuchsia-50 to-pink-50 border-fuchsia-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-6 w-6 text-fuchsia-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-fuchsia-900 text-lg">AWS Immersion Days</h3>
              <p className="text-sm text-fuchsia-700 mt-1">
                Plan hands-on technical sessions where your team can experience AWS services firsthand.
                Immersion Days accelerate cloud adoption by providing practical, guided experiences.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={() => setShowSuggestions(!showSuggestions)} variant="outline" className="border-fuchsia-300 text-fuchsia-700 hover:bg-fuchsia-50">
          <Plus className="h-4 w-4 mr-1" /> Add from Suggested Topics
        </Button>
      </div>

      {/* Suggested topics */}
      {showSuggestions && (
        <Card className="border-fuchsia-200">
          <CardHeader>
            <CardTitle className="text-sm text-fuchsia-700">Recommended Immersion Day Topics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUGGESTED_TOPICS.map((suggestion, i) => {
              const alreadyAdded = plans.some(p => p.topic === suggestion.topic);
              return (
                <button
                  key={i}
                  onClick={() => !alreadyAdded && handleAddSuggested(suggestion)}
                  disabled={alreadyAdded}
                  className={cn(
                    'text-left p-3 rounded-lg border transition-all',
                    alreadyAdded
                      ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-gray-200 hover:border-fuchsia-300 hover:bg-fuchsia-50'
                  )}
                >
                  <p className="font-medium text-sm">{suggestion.topic}</p>
                  <p className="text-xs text-gray-500 mt-1">{suggestion.duration} - {suggestion.objectives.length} objectives</p>
                  {alreadyAdded && <p className="text-xs text-green-600 mt-1">Already added</p>}
                </button>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Plans list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planned Immersion Days ({plans.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plans.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No immersion days planned yet. Add from suggested topics to get started.</p>
          )}

          {plans.map((plan) => {
            const config = statusConfig[plan.status];
            const StatusIcon = config.icon;
            return (
              <div key={plan.id} className={cn('rounded-lg border p-4', config.bg)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <button onClick={() => handleStatusChange(plan.id)} className="mt-0.5">
                      <StatusIcon className={cn('h-5 w-5', config.color)} />
                    </button>
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.topic}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{plan.duration} - {config.label}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Objectives:</p>
                        {plan.objectives.map((obj, i) => (
                          <p key={i} className="text-xs text-gray-500 pl-3">- {obj}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={plan.date}
                      onChange={(e) => handleDateChange(plan.id, e.target.value)}
                      className="w-36 text-xs"
                    />
                    <button onClick={() => handleRemove(plan.id)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
