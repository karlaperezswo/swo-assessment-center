import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { SkillAssessment } from '@/types/assessment';
import { GraduationCap, TrendingUp, BookOpen, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SkillsCoEProps {
  skills: SkillAssessment[];
  onSkillsChange: (skills: SkillAssessment[]) => void;
}

const levelLabels = {
  none: 'None',
  basic: 'Basic',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  expert: 'Expert',
};

const levelColors = {
  none: 'bg-gray-100 text-gray-700',
  basic: 'bg-blue-100 text-blue-700',
  intermediate: 'bg-green-100 text-green-700',
  advanced: 'bg-purple-100 text-purple-700',
  expert: 'bg-orange-100 text-orange-700',
};

export function SkillsCoE({ skills, onSkillsChange }: SkillsCoEProps) {
  const handleLevelChange = (id: string, field: 'currentLevel' | 'targetLevel', value: string) => {
    onSkillsChange(skills.map(s => {
      if (s.id !== id) return s;
      const updated = { ...s, [field]: value };
      // Recalculate gap
      const levels = ['none', 'basic', 'intermediate', 'advanced', 'expert'];
      const currentIdx = levels.indexOf(updated.currentLevel);
      const targetIdx = levels.indexOf(updated.targetLevel);
      updated.gap = Math.max(0, (targetIdx - currentIdx) * 25);
      return updated;
    }));
  };

  const avgGap = skills.length > 0 ? Math.round(skills.reduce((sum, s) => sum + s.gap, 0) / skills.length) : 0;
  const criticalGaps = skills.filter(s => s.gap >= 50).length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <GraduationCap className="h-6 w-6 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-violet-900 text-lg">AWS Skills Assessment & Center of Excellence</h3>
              <p className="text-sm text-violet-700 mt-1">
                Assess your team's current AWS proficiency and create targeted training plans to build internal expertise.
                A strong Center of Excellence accelerates migration and reduces reliance on external consultants.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{avgGap}%</p>
            <p className="text-sm text-gray-600">Avg Skill Gap</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <BookOpen className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{criticalGaps}</p>
            <p className="text-sm text-gray-600">Critical Gaps (≥50%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Award className="h-8 w-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{skills.length}</p>
            <p className="text-sm text-gray-600">Skill Areas Tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Skill Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.id} className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{skill.skillArea}</h4>
                    <p className="text-xs text-gray-500 mt-1">{skill.trainingRecommendation}</p>

                    {/* Gap bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Skill Gap</span>
                        <span className="font-medium text-gray-900">{skill.gap}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all',
                            skill.gap >= 75 ? 'bg-red-500' :
                            skill.gap >= 50 ? 'bg-orange-500' :
                            skill.gap >= 25 ? 'bg-yellow-500' : 'bg-green-500'
                          )}
                          style={{ width: `${skill.gap}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Current</p>
                      <select
                        value={skill.currentLevel}
                        onChange={(e) => handleLevelChange(skill.id, 'currentLevel', e.target.value)}
                        className={cn('text-xs px-2 py-1 rounded-md border', levelColors[skill.currentLevel])}
                      >
                        {Object.entries(levelLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-gray-300">→</div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Target</p>
                      <select
                        value={skill.targetLevel}
                        onChange={(e) => handleLevelChange(skill.id, 'targetLevel', e.target.value)}
                        className={cn('text-xs px-2 py-1 rounded-md border', levelColors[skill.targetLevel])}
                      >
                        {Object.entries(levelLabels).filter(([k]) => k !== 'none').map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
