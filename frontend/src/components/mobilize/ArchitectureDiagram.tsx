import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LandingZoneChecklist, SecurityComplianceChecklist } from '@/types/assessment';
import {
  Shield, Zap, Target, DollarSign, Leaf, Settings,
  CheckCircle2, Network, Cloud,
  BarChart3, FileText, Building2, AlertCircle
} from 'lucide-react';

interface ArchitectureDiagramProps {
  landingZone: LandingZoneChecklist;
  securityChecklist: SecurityComplianceChecklist;
}

// AWS Account Types
interface AWSAccount {
  id: string;
  name: string;
  description: string;
  type: 'essential' | 'recommended' | 'optional';
  disabled?: boolean;
}

const AWS_ACCOUNTS: AWSAccount[] = [
  {
    id: 'management',
    name: 'Management Account',
    description: 'Cuenta raíz de AWS Organizations. Gestiona billing consolidado y políticas centralizadas.',
    type: 'essential',
    disabled: true // Cannot be disabled
  },
  {
    id: 'security',
    name: 'Security Account',
    description: 'Centraliza GuardDuty, Security Hub, IAM Identity Center y herramientas de seguridad.',
    type: 'essential'
  },
  {
    id: 'log-archive',
    name: 'Log Archive Account',
    description: 'Almacena CloudTrail, CloudWatch Logs y logs de auditoría en modo write-only.',
    type: 'recommended'
  },
  {
    id: 'production',
    name: 'Production Account',
    description: 'Ejecuta workloads de producción con controles estrictos de acceso.',
    type: 'essential'
  },
  {
    id: 'staging',
    name: 'Staging Account',
    description: 'Pre-producción para testing y validación antes de deploy a producción.',
    type: 'recommended'
  },
  {
    id: 'development',
    name: 'Development Account',
    description: 'Desarrollo y experimentación con costos controlados.',
    type: 'recommended'
  },
  {
    id: 'network',
    name: 'Network Account',
    description: 'Centraliza Transit Gateway, VPC compartidas y conectividad hybrid.',
    type: 'optional'
  },
  {
    id: 'shared-services',
    name: 'Shared Services Account',
    description: 'Active Directory, DNS, herramientas de CI/CD y servicios compartidos.',
    type: 'optional'
  }
];

// AWS Well-Architected Framework Pillars
const PILLARS = [
  {
    name: 'Excelencia Operacional',
    icon: Settings,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Ejecutar y monitorear sistemas para entregar valor empresarial',
    practices: ['Automatización de operaciones', 'Documentación de procedimientos', 'Mejora continua']
  },
  {
    name: 'Seguridad',
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Proteger información, sistemas y activos',
    practices: ['IAM y gestión de identidades', 'Detección de amenazas', 'Protección de datos']
  },
  {
    name: 'Confiabilidad',
    icon: Target,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'Garantizar que una carga de trabajo funcione correctamente',
    practices: ['Alta disponibilidad multi-AZ', 'Recuperación ante desastres', 'Backup automatizado']
  },
  {
    name: 'Eficiencia de Rendimiento',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: 'Usar recursos de TI de manera eficiente',
    practices: ['Selección de instancias optimizadas', 'Auto Scaling', 'Monitoreo de rendimiento']
  },
  {
    name: 'Optimización de Costos',
    icon: DollarSign,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: 'Ejecutar sistemas para entregar valor al menor precio',
    practices: ['Reserved Instances y Savings Plans', 'Rightsizing', 'Cost allocation tags']
  },
  {
    name: 'Sostenibilidad',
    icon: Leaf,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'Minimizar el impacto ambiental',
    practices: ['Instancias eficientes energéticamente', 'Optimización de almacenamiento', 'Regiones sostenibles']
  }
];

export function ArchitectureDiagram({ landingZone, securityChecklist }: ArchitectureDiagramProps) {
  // Initialize with all essential and recommended accounts enabled by default
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(
    new Set(
      AWS_ACCOUNTS
        .filter(acc => acc.type === 'essential' || acc.type === 'recommended')
        .map(acc => acc.id)
    )
  );

  const handleAccountToggle = (accountId: string) => {
    const account = AWS_ACCOUNTS.find(acc => acc.id === accountId);
    if (account?.disabled) return;

    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Calculate implementation score
  const calculateScore = (items: any[]) => {
    const completed = items.filter(item => item.completed).length;
    return Math.round((completed / items.length) * 100);
  };

  const allItems = [
    ...landingZone.accountStructure,
    ...landingZone.networking,
    ...landingZone.security,
    ...landingZone.logging,
    ...landingZone.governance,
    ...securityChecklist.identityAccess,
    ...securityChecklist.dataProtection,
    ...securityChecklist.networkSecurity,
    ...securityChecklist.compliance,
    ...securityChecklist.incidentResponse
  ];

  const overallScore = calculateScore(allItems);

  // Check which components are enabled
  const hasVPC = landingZone.networking.some(item =>
    item.title.includes('VPC') && item.completed
  );
  const hasCloudTrail = landingZone.logging.some(item =>
    item.title.includes('CloudTrail') && item.completed
  );
  const hasGuardDuty = securityChecklist.identityAccess.some(item =>
    item.title.includes('GuardDuty') && item.completed
  );

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'essential': return 'destructive';
      case 'recommended': return 'default';
      case 'optional': return 'secondary';
      default: return 'default';
    }
  };

  const getBadgeLabel = (type: string) => {
    switch (type) {
      case 'essential': return 'Esencial';
      case 'recommended': return 'Recomendada';
      case 'optional': return 'Opcional';
      default: return type;
    }
  };

  // Get selected accounts list
  const enabledAccounts = AWS_ACCOUNTS.filter(acc => selectedAccounts.has(acc.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Diagrama de Arquitectura AWS</h2>
              <p className="text-white/90 text-sm max-w-3xl">
                Arquitectura multi-cuenta recomendada por AWS Well-Architected Framework.
                Personaliza las cuentas según las necesidades de tu organización.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg px-6 py-4 text-center">
              <p className="text-sm text-white/80 mb-1">Score de Implementación</p>
              <p className="text-4xl font-bold">{overallScore}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Selector */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-orange-600" />
            Selector de Cuentas AWS (Estrategia Multi-Cuenta)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">¿Por qué Multi-Cuenta?</p>
                <p className="text-blue-800">
                  AWS recomienda una estrategia multi-cuenta para mejorar seguridad, aislamiento de recursos,
                  límites de servicio independientes y mejor control de costos. Selecciona las cuentas que
                  necesita tu organización.
                </p>
              </div>
            </div>

            {/* Account Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AWS_ACCOUNTS.map((account) => (
                <div
                  key={account.id}
                  className={`
                    border-2 rounded-lg p-4 transition-all
                    ${selectedAccounts.has(account.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                    }
                    ${account.disabled ? 'opacity-75' : 'cursor-pointer hover:border-blue-300'}
                  `}
                  onClick={() => !account.disabled && handleAccountToggle(account.id)}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedAccounts.has(account.id)}
                      disabled={account.disabled}
                      onCheckedChange={() => handleAccountToggle(account.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{account.name}</h4>
                        <Badge variant={getBadgeVariant(account.type)} className="text-xs">
                          {getBadgeLabel(account.type)}
                        </Badge>
                        {account.disabled && (
                          <Badge variant="outline" className="text-xs">Obligatoria</Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{account.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">
                Cuentas seleccionadas: {selectedAccounts.size} de {AWS_ACCOUNTS.length}
              </span>
              <span className="text-xs text-gray-500">
                {AWS_ACCOUNTS.filter(acc => acc.type === 'essential' && selectedAccounts.has(acc.id)).length} esenciales •
                {' '}{AWS_ACCOUNTS.filter(acc => acc.type === 'recommended' && selectedAccounts.has(acc.id)).length} recomendadas •
                {' '}{AWS_ACCOUNTS.filter(acc => acc.type === 'optional' && selectedAccounts.has(acc.id)).length} opcionales
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AWS Well-Architected Framework Pillars */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            AWS Well-Architected Framework - 6 Pilares
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <Card key={index} className={`${pillar.borderColor} border-2`}>
                  <CardContent className="pt-6">
                    <div className={`${pillar.bgColor} rounded-lg p-3 mb-3 inline-flex`}>
                      <Icon className={`h-6 w-6 ${pillar.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{pillar.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{pillar.description}</p>
                    <div className="space-y-1">
                      {pillar.practices.map((practice, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={`h-4 w-4 ${pillar.color} flex-shrink-0 mt-0.5`} />
                          <span className="text-xs text-gray-700">{practice}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Diagrama de Arquitectura Propuesta ({enabledAccounts.length} cuentas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-8">
            <svg viewBox="0 0 1400 900" className="w-full h-auto">
              {/* AWS Cloud Border */}
              <rect x="50" y="50" width="1300" height="800" rx="10"
                    fill="white" stroke="#FF9900" strokeWidth="3" strokeDasharray="10,5" />
              <text x="80" y="85" fill="#232F3E" fontSize="24" fontWeight="bold">AWS Cloud - Multi-Account Architecture</text>

              {/* AWS Organizations Container */}
              <rect x="100" y="120" width="1200" height="700" rx="8"
                    fill="#E3F2FD" stroke="#1976D2" strokeWidth="2" />
              <text x="120" y="155" fill="#1565C0" fontSize="18" fontWeight="bold">
                AWS Organizations
              </text>

              {/* Dynamically render selected accounts */}
              {selectedAccounts.has('management') && (
                <>
                  <rect x="130" y="180" width="220" height="90" rx="6"
                        fill="white" stroke="#DD2C00" strokeWidth="3" />
                  <text x="160" y="210" fill="#232F3E" fontSize="15" fontWeight="bold">Management Account</text>
                  <text x="160" y="230" fill="#666" fontSize="12">• AWS Organizations</text>
                  <text x="160" y="248" fill="#666" fontSize="12">• Billing consolidado</text>
                  <text x="160" y="266" fill="#666" fontSize="12">• Control central</text>
                </>
              )}

              {selectedAccounts.has('security') && (
                <>
                  <rect x="380" y="180" width="220" height="90" rx="6"
                        fill="white" stroke="#C62828" strokeWidth="2" />
                  <text x="410" y="210" fill="#232F3E" fontSize="15" fontWeight="bold">Security Account</text>
                  <text x="410" y="230" fill="#666" fontSize="12">• GuardDuty Central</text>
                  <text x="410" y="248" fill="#666" fontSize="12">• Security Hub</text>
                  <text x="410" y="266" fill="#666" fontSize="12">• IAM Identity Center</text>
                </>
              )}

              {selectedAccounts.has('log-archive') && (
                <>
                  <rect x="630" y="180" width="220" height="90" rx="6"
                        fill="white" stroke="#F57C00" strokeWidth="2" />
                  <text x="660" y="210" fill="#232F3E" fontSize="15" fontWeight="bold">Log Archive Account</text>
                  <text x="660" y="230" fill="#666" fontSize="12">• CloudTrail logs</text>
                  <text x="660" y="248" fill="#666" fontSize="12">• CloudWatch logs</text>
                  <text x="660" y="266" fill="#666" fontSize="12">• S3 (write-only)</text>
                </>
              )}

              {selectedAccounts.has('network') && (
                <>
                  <rect x="880" y="180" width="220" height="90" rx="6"
                        fill="white" stroke="#7B1FA2" strokeWidth="2" />
                  <text x="910" y="210" fill="#232F3E" fontSize="15" fontWeight="bold">Network Account</text>
                  <text x="910" y="230" fill="#666" fontSize="12">• Transit Gateway</text>
                  <text x="910" y="248" fill="#666" fontSize="12">• VPC compartidas</text>
                  <text x="910" y="266" fill="#666" fontSize="12">• Direct Connect</text>
                </>
              )}

              {/* Production Environment */}
              {selectedAccounts.has('production') && (
                <>
                  <rect x="130" y="300" width="480" height="250" rx="6"
                        fill="#C8E6C9" stroke="#2E7D32" strokeWidth="3" />
                  <text x="160" y="330" fill="#1B5E20" fontSize="16" fontWeight="bold">
                    Production Account
                  </text>

                  {hasVPC && (
                    <>
                      {/* Production VPC */}
                      <rect x="160" y="350" width="420" height="180" rx="5"
                            fill="#F3E5F5" stroke="#7B1FA2" strokeWidth="2" />
                      <text x="180" y="375" fill="#6A1B9A" fontSize="13" fontWeight="bold">VPC Production</text>

                      {/* Public Subnet */}
                      <rect x="180" y="390" width="180" height="70" rx="4"
                            fill="#BBDEFB" stroke="#1976D2" strokeWidth="2" />
                      <text x="200" y="410" fill="#0D47A1" fontSize="11" fontWeight="bold">Public Subnet AZ-1</text>
                      <text x="200" y="428" fill="#666" fontSize="10">• ALB</text>
                      <text x="200" y="443" fill="#666" fontSize="10">• NAT Gateway</text>

                      {/* Private Subnet */}
                      <rect x="180" y="470" width="180" height="50" rx="4"
                            fill="#FFF9C4" stroke="#F57C00" strokeWidth="2" />
                      <text x="200" y="490" fill="#E65100" fontSize="11" fontWeight="bold">Private Subnet AZ-1</text>
                      <text x="200" y="508" fill="#666" fontSize="10">• EC2 • RDS</text>

                      {/* Public Subnet AZ2 */}
                      <rect x="380" y="390" width="180" height="70" rx="4"
                            fill="#BBDEFB" stroke="#1976D2" strokeWidth="2" />
                      <text x="400" y="410" fill="#0D47A1" fontSize="11" fontWeight="bold">Public Subnet AZ-2</text>

                      {/* Private Subnet AZ2 */}
                      <rect x="380" y="470" width="180" height="50" rx="4"
                            fill="#FFF9C4" stroke="#F57C00" strokeWidth="2" />
                      <text x="400" y="490" fill="#E65100" fontSize="11" fontWeight="bold">Private Subnet AZ-2</text>
                      <text x="400" y="508" fill="#666" fontSize="10">• EC2 • RDS Replica</text>
                    </>
                  )}
                </>
              )}

              {/* Staging Environment */}
              {selectedAccounts.has('staging') && (
                <>
                  <rect x="640" y="300" width="220" height="120" rx="6"
                        fill="white" stroke="#0288D1" strokeWidth="2" />
                  <text x="670" y="330" fill="#232F3E" fontSize="15" fontWeight="bold">Staging Account</text>
                  <text x="670" y="350" fill="#666" fontSize="12">Pre-producción</text>
                  <text x="670" y="370" fill="#666" fontSize="11">• Testing integración</text>
                  <text x="670" y="388" fill="#666" fontSize="11">• Validación deploy</text>
                  <text x="670" y="406" fill="#666" fontSize="11">• Performance testing</text>
                </>
              )}

              {/* Development Environment */}
              {selectedAccounts.has('development') && (
                <>
                  <rect x="640" y="440" width="220" height="110" rx="6"
                        fill="white" stroke="#00897B" strokeWidth="2" />
                  <text x="670" y="470" fill="#232F3E" fontSize="15" fontWeight="bold">Development Account</text>
                  <text x="670" y="490" fill="#666" fontSize="12">Desarrollo y testing</text>
                  <text x="670" y="510" fill="#666" fontSize="11">• Sandbox environments</text>
                  <text x="670" y="528" fill="#666" fontSize="11">• Feature branches</text>
                  <text x="670" y="546" fill="#666" fontSize="11">• Costos controlados</text>
                </>
              )}

              {/* Shared Services */}
              {selectedAccounts.has('shared-services') && (
                <>
                  <rect x="130" y="580" width="320" height="100" rx="6"
                        fill="white" stroke="#5E35B1" strokeWidth="2" />
                  <text x="160" y="610" fill="#232F3E" fontSize="15" fontWeight="bold">Shared Services Account</text>
                  <text x="160" y="632" fill="#666" fontSize="11">• Active Directory • DNS interno</text>
                  <text x="160" y="650" fill="#666" fontSize="11">• CI/CD pipelines (Jenkins, GitLab)</text>
                  <text x="160" y="668" fill="#666" fontSize="11">• Artifact repositories</text>
                </>
              )}

              {/* Security Services */}
              <rect x="900" y="300" width="380" height="380" rx="6"
                    fill="#FFEBEE" stroke="#C62828" strokeWidth="2" />
              <text x="930" y="330" fill="#B71C1C" fontSize="16" fontWeight="bold">
                Servicios Centralizados
              </text>

              {/* Security Tools */}
              {hasGuardDuty && (
                <rect x="930" y="350" width="150" height="60" rx="4"
                      fill="white" stroke="#DD2C00" strokeWidth="2" />
              )}
              {hasGuardDuty && (
                <>
                  <text x="950" y="373" fill="#232F3E" fontSize="12" fontWeight="bold">GuardDuty</text>
                  <text x="950" y="391" fill="#666" fontSize="10">Threat Detection</text>
                  <text x="950" y="404" fill="#666" fontSize="10">Multi-account</text>
                </>
              )}

              <rect x="1100" y="350" width="150" height="60" rx="4"
                    fill="white" stroke="#DD2C00" strokeWidth="2" />
              <text x="1120" y="373" fill="#232F3E" fontSize="12" fontWeight="bold">AWS IAM</text>
              <text x="1120" y="391" fill="#666" fontSize="10">Identity Center</text>
              <text x="1120" y="404" fill="#666" fontSize="10">SSO Federation</text>

              {hasCloudTrail && (
                <rect x="930" y="430" width="150" height="60" rx="4"
                      fill="white" stroke="#DD2C00" strokeWidth="2" />
              )}
              {hasCloudTrail && (
                <>
                  <text x="950" y="453" fill="#232F3E" fontSize="12" fontWeight="bold">CloudTrail</text>
                  <text x="950" y="471" fill="#666" fontSize="10">Audit Logging</text>
                  <text x="950" y="484" fill="#666" fontSize="10">Organization trail</text>
                </>
              )}

              <rect x="1100" y="430" width="150" height="60" rx="4"
                    fill="white" stroke="#DD2C00" strokeWidth="2" />
              <text x="1120" y="453" fill="#232F3E" fontSize="12" fontWeight="bold">CloudWatch</text>
              <text x="1120" y="471" fill="#666" fontSize="10">Centralized</text>
              <text x="1120" y="484" fill="#666" fontSize="10">Monitoring</text>

              <rect x="930" y="510" width="150" height="60" rx="4"
                    fill="white" stroke="#DD2C00" strokeWidth="2" />
              <text x="950" y="533" fill="#232F3E" fontSize="12" fontWeight="bold">AWS Config</text>
              <text x="950" y="551" fill="#666" fontSize="10">Compliance</text>
              <text x="950" y="564" fill="#666" fontSize="10">Monitoring</text>

              <rect x="1100" y="510" width="150" height="60" rx="4"
                    fill="white" stroke="#DD2C00" strokeWidth="2" />
              <text x="1120" y="533" fill="#232F3E" fontSize="12" fontWeight="bold">AWS Backup</text>
              <text x="1120" y="551" fill="#666" fontSize="10">Centralized</text>
              <text x="1120" y="564" fill="#666" fontSize="10">Backup policies</text>

              {/* S3 */}
              <rect x="930" y="590" width="320" height="70" rx="4"
                    fill="white" stroke="#0277BD" strokeWidth="2" />
              <text x="950" y="613" fill="#232F3E" fontSize="13" fontWeight="bold">Amazon S3</text>
              <text x="950" y="631" fill="#666" fontSize="11">Object Storage • Logs • Artifacts</text>
              <text x="950" y="649" fill="#666" fontSize="11">Cross-account access con SCPs</text>
            </svg>
          </div>

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-600 rounded"></div>
              <span className="text-sm text-gray-700">Management</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-700 rounded"></div>
              <span className="text-sm text-gray-700">Production</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-600 rounded"></div>
              <span className="text-sm text-gray-700">Staging/Dev</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-50 border-2 border-red-800 rounded"></div>
              <span className="text-sm text-gray-700">Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border-2 border-purple-600 rounded"></div>
              <span className="text-sm text-gray-700">Network/Shared</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Buenas Prácticas Multi-Cuenta Implementadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-600" />
                Seguridad y Aislamiento
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Aislamiento de blast radius entre entornos</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>SCPs para políticas de seguridad centralizadas</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Cuenta Security dedicada con herramientas centralizadas</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
                Gobernanza y Costos
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Billing consolidado con descuentos por volumen</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Cost allocation tags por cuenta</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Budgets y alertas independientes</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                Confiabilidad
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Límites de servicio independientes por cuenta</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Fallos aislados no afectan otras cuentas</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Disaster recovery simplificado</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                Operaciones
              </h4>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Separación de responsabilidades clara</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Auditoría y compliance simplificados</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Control Tower para automatización</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Progreso de Implementación por Área
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Estructura de Cuentas', items: landingZone.accountStructure, color: 'bg-blue-500' },
              { name: 'Networking', items: landingZone.networking, color: 'bg-purple-500' },
              { name: 'Seguridad Landing Zone', items: landingZone.security, color: 'bg-red-500' },
              { name: 'Logging y Monitoreo', items: landingZone.logging, color: 'bg-green-500' },
              { name: 'Gobernanza', items: landingZone.governance, color: 'bg-yellow-500' },
              { name: 'Identidad y Acceso', items: securityChecklist.identityAccess, color: 'bg-orange-500' },
            ].map((area, index) => {
              const score = calculateScore(area.items);
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{area.name}</span>
                    <span className="text-sm font-bold text-gray-900">{score}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${area.color} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Próximos Pasos Recomendados</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Implementar AWS Control Tower para automatizar configuración de cuentas</li>
                <li>• Configurar AWS SSO (IAM Identity Center) para acceso federado</li>
                <li>• Establecer Service Control Policies (SCPs) para governance</li>
                <li>• Implementar AWS Config Rules para compliance continuo</li>
                <li>• Configurar cross-account access roles para administración centralizada</li>
                <li>• Establecer procesos de onboarding para nuevas cuentas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
