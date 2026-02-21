import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Container, Zap, Brain, CheckCircle } from 'lucide-react';

const MODERNIZATION_PATHS = [
  {
    phase: 'Phase 1: Foundation (Months 1-3)',
    icon: CheckCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    initiatives: [
      { title: 'Containerize stateless applications', description: 'Start with web frontends and API services using Amazon ECS/EKS', complexity: 'Low' },
      { title: 'Implement CI/CD pipelines', description: 'Set up CodePipeline, CodeBuild, and automated deployment', complexity: 'Medium' },
      { title: 'Adopt Infrastructure as Code', description: 'Convert manual infrastructure to CloudFormation or Terraform', complexity: 'Medium' },
    ],
  },
  {
    phase: 'Phase 2: Application Modernization (Months 4-9)',
    icon: Container,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    initiatives: [
      { title: 'Refactor monoliths to microservices', description: 'Break down tightly coupled applications into independent services', complexity: 'High' },
      { title: 'Adopt serverless for event-driven workloads', description: 'Use Lambda, API Gateway, EventBridge for async processing', complexity: 'Medium' },
      { title: 'Implement API Gateway & service mesh', description: 'Centralize API management and inter-service communication', complexity: 'High' },
    ],
  },
  {
    phase: 'Phase 3: Data Modernization (Months 6-12)',
    icon: Brain,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    initiatives: [
      { title: 'Adopt purpose-built databases', description: 'Move from relational-only to DynamoDB, ElastiCache, DocumentDB', complexity: 'High' },
      { title: 'Build data lake on S3', description: 'Centralize analytics data with S3, Glue, Athena, and Redshift', complexity: 'Medium' },
      { title: 'Implement real-time analytics', description: 'Use Kinesis, MSK, and Redshift Streaming for live insights', complexity: 'High' },
    ],
  },
  {
    phase: 'Phase 4: AI/ML & Innovation (Months 12+)',
    icon: Zap,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    initiatives: [
      { title: 'ML-powered insights with SageMaker', description: 'Build predictive models for customer behavior and operations', complexity: 'High' },
      { title: 'Intelligent automation with AI services', description: 'Use Rekognition, Comprehend, Textract for document processing', complexity: 'Medium' },
      { title: 'Edge computing with IoT', description: 'Deploy AWS IoT Core and Greengrass for edge analytics', complexity: 'High' },
    ],
  },
];

const complexityColors = {
  Low: 'bg-green-100 text-green-700 border-green-200',
  Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  High: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function ModernizationRoadmap() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Rocket className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Modernization Roadmap</h3>
              <p className="text-sm text-amber-700 mt-1">
                A phased approach to cloud-native transformation. After migrating workloads, continue the journey to unlock
                full cloud benefits through modernization, automation, and innovation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why Modernize?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Rocket className="h-8 w-8 text-blue-600 mb-2" />
              <h4 className="font-semibold text-sm text-blue-900">Faster Innovation</h4>
              <p className="text-xs text-blue-700 mt-1">Deploy features in hours, not weeks. Serverless and containers accelerate dev cycles.</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <Zap className="h-8 w-8 text-purple-600 mb-2" />
              <h4 className="font-semibold text-sm text-purple-900">Better Performance</h4>
              <p className="text-xs text-purple-700 mt-1">Auto-scaling, managed services, and edge delivery improve user experience.</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Brain className="h-8 w-8 text-green-600 mb-2" />
              <h4 className="font-semibold text-sm text-green-900">New Capabilities</h4>
              <p className="text-xs text-green-700 mt-1">AI/ML, IoT, and analytics unlock insights impossible with legacy systems.</p>
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
          <CardTitle>Success Metrics to Track</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↓ 60%</p>
              <p className="text-xs text-gray-600 mt-1">Deployment Time</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↑ 3x</p>
              <p className="text-xs text-gray-600 mt-1">Release Frequency</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↓ 40%</p>
              <p className="text-xs text-gray-600 mt-1">Ops Cost</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">↑ 99.99%</p>
              <p className="text-xs text-gray-600 mt-1">Availability</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
