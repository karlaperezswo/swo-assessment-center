import { useTranslation } from '@/i18n/useTranslation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Container, Zap, Brain, CheckCircle } from 'lucide-react';

const complexityColors = {
  Low: 'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function ModernizationRoadmap() {
  const { t } = useTranslation();

  const MODERNIZATION_PATHS = [
    {
      phase: t('modernization.phase1.title'),
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      initiatives: [
        { title: t('modernization.phase1.init1.title'), description: t('modernization.phase1.init1.description'), complexity: 'Low' },
        { title: t('modernization.phase1.init2.title'), description: t('modernization.phase1.init2.description'), complexity: 'Medium' },
        { title: t('modernization.phase1.init3.title'), description: t('modernization.phase1.init3.description'), complexity: 'Medium' },
      ],
    },
    {
      phase: t('modernization.phase2.title'),
      icon: Container,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      initiatives: [
        { title: t('modernization.phase2.init1.title'), description: t('modernization.phase2.init1.description'), complexity: 'High' },
        { title: t('modernization.phase2.init2.title'), description: t('modernization.phase2.init2.description'), complexity: 'Medium' },
        { title: t('modernization.phase2.init3.title'), description: t('modernization.phase2.init3.description'), complexity: 'High' },
      ],
    },
    {
      phase: t('modernization.phase3.title'),
      icon: Brain,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      initiatives: [
        { title: t('modernization.phase3.init1.title'), description: t('modernization.phase3.init1.description'), complexity: 'High' },
        { title: t('modernization.phase3.init2.title'), description: t('modernization.phase3.init2.description'), complexity: 'Medium' },
        { title: t('modernization.phase3.init3.title'), description: t('modernization.phase3.init3.description'), complexity: 'High' },
      ],
    },
    {
      phase: t('modernization.phase4.title'),
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      initiatives: [
        { title: t('modernization.phase4.init1.title'), description: t('modernization.phase4.init1.description'), complexity: 'High' },
        { title: t('modernization.phase4.init2.title'), description: t('modernization.phase4.init2.description'), complexity: 'Medium' },
        { title: t('modernization.phase4.init3.title'), description: t('modernization.phase4.init3.description'), complexity: 'High' },
      ],
    },
  ];
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">{t('modernization.title')}</h3>
              <p className="text-sm text-amber-700 mt-1">
                {t('modernization.description')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('modernization.benefits.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Rocket className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-sm text-blue-900">{t('modernization.benefits.innovation.title')}</h4>
              <p className="text-xs text-blue-700 mt-1">{t('modernization.benefits.innovation.description')}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Zap className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-sm text-purple-900">{t('modernization.benefits.performance.title')}</h4>
              <p className="text-xs text-purple-700 mt-1">{t('modernization.benefits.performance.description')}</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Brain className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-sm text-green-900">{t('modernization.benefits.capabilities.title')}</h4>
              <p className="text-xs text-green-700 mt-1">{t('modernization.benefits.capabilities.description')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Phases */}
      {MODERNIZATION_PATHS.map((path) => {
        const Icon = path.icon;
        return (
          <Card key={path.phase} className={`border ${path.borderColor}`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon className={`h-5 w-5 ${path.color}`} />
                <CardTitle className="text-lg">{path.phase}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {path.initiatives.map((initiative, i) => (
                <div key={i} className={`p-4 rounded-lg border ${path.bgColor} ${path.borderColor}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900">{initiative.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">{initiative.description}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex-shrink-0 ${complexityColors[initiative.complexity as keyof typeof complexityColors]}`}>
                      {initiative.complexity}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Success Metrics */}
      <Card className="bg-gradient-to-br from-gray-50 to-white">
        <CardHeader>
          <CardTitle>{t('modernization.metrics.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↓ 60%</p>
              <p className="text-xs text-gray-600 mt-1">{t('modernization.metrics.deploymentTime')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↑ 3x</p>
              <p className="text-xs text-gray-600 mt-1">{t('modernization.metrics.releaseFrequency')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↓ 40%</p>
              <p className="text-xs text-gray-600 mt-1">{t('modernization.metrics.opsCost')}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↑ 99.99%</p>
              <p className="text-xs text-gray-600 mt-1">{t('modernization.metrics.availability')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
