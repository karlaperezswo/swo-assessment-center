import { useState } from 'react';
import { ChecklistCard } from '@/components/shared/ChecklistCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { LandingZoneChecklist } from '@/types/assessment';
import {
  Cloud, Network, Shield, FileText, Scale, Download,
  Code, FileCode, BookOpen, Sparkles
} from 'lucide-react';
import {
  generateCloudFormationTemplate,
  generateTerraformTemplate,
  generateReadmeTemplate,
  defaultLandingZoneConfig,
  LandingZoneConfig,
} from '@/lib/landingZoneTemplates';

interface LandingZoneProps {
  checklist: LandingZoneChecklist;
  onChecklistChange: (checklist: LandingZoneChecklist) => void;
}

export function LandingZone({ checklist, onChecklistChange }: LandingZoneProps) {
  const [config, setConfig] = useState<LandingZoneConfig>(defaultLandingZoneConfig);
  const [showConfig, setShowConfig] = useState(false);

  const handleToggle = (category: keyof LandingZoneChecklist, id: string) => {
    onChecklistChange({
      ...checklist,
      [category]: checklist[category].map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleNotesChange = (category: keyof LandingZoneChecklist, id: string, notes: string) => {
    onChecklistChange({
      ...checklist,
      [category]: checklist[category].map(item =>
        item.id === id ? { ...item, notes } : item
      ),
    });
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCloudFormation = () => {
    const template = generateCloudFormationTemplate(config);
    downloadFile(template, `${config.organizationName}-landing-zone.yaml`, 'text/yaml');
  };

  const handleDownloadTerraform = () => {
    const template = generateTerraformTemplate(config);
    downloadFile(template, `${config.organizationName}-landing-zone.tf`, 'text/plain');
  };

  const handleDownloadReadme = () => {
    const readme = generateReadmeTemplate(config);
    downloadFile(readme, 'README.md', 'text/markdown');
  };

  const handleDownloadAll = () => {
    handleDownloadCloudFormation();
    setTimeout(handleDownloadTerraform, 300);
    setTimeout(handleDownloadReadme, 600);
  };

  return (
    <div className="space-y-6">
      {/* Template Generator Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-blue-900">Generador de Templates IaC</CardTitle>
                <p className="text-sm text-blue-700 mt-1">
                  Genera CloudFormation y Terraform listos para ejecutar con mejores prácticas de AWS
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
              className="border-blue-300"
            >
              {showConfig ? 'Ocultar Configuración' : 'Configurar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showConfig && (
            <div className="space-y-4 mb-6 p-4 bg-white rounded-lg border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orgName" className="text-sm font-medium">
                    Nombre de Organización
                  </Label>
                  <Input
                    id="orgName"
                    value={config.organizationName}
                    onChange={(e) => setConfig({ ...config, organizationName: e.target.value })}
                    placeholder="MyCompany"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="primaryRegion" className="text-sm font-medium">
                    Región Principal
                  </Label>
                  <select
                    id="primaryRegion"
                    value={config.primaryRegion}
                    onChange={(e) => setConfig({ ...config, primaryRegion: e.target.value })}
                    className="w-full mt-1 border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="eu-west-1">EU (Ireland)</option>
                    <option value="eu-central-1">EU (Frankfurt)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                    <option value="sa-east-1">South America (São Paulo)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="vpcCidr" className="text-sm font-medium">
                    VPC CIDR Block
                  </Label>
                  <Input
                    id="vpcCidr"
                    value={config.vpcCidr}
                    onChange={(e) => setConfig({ ...config, vpcCidr: e.target.value })}
                    placeholder="10.0.0.0/16"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="accountEmail" className="text-sm font-medium">
                    Email de Contacto
                  </Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    value={config.accountEmail}
                    onChange={(e) => setConfig({ ...config, accountEmail: e.target.value })}
                    placeholder="aws-admin@company.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Servicios de Seguridad</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cloudtrail"
                      checked={config.enableCloudTrail}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enableCloudTrail: checked as boolean })
                      }
                    />
                    <label htmlFor="cloudtrail" className="text-sm cursor-pointer">
                      CloudTrail
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="guardduty"
                      checked={config.enableGuardDuty}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enableGuardDuty: checked as boolean })
                      }
                    />
                    <label htmlFor="guardduty" className="text-sm cursor-pointer">
                      GuardDuty
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="securityhub"
                      checked={config.enableSecurityHub}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enableSecurityHub: checked as boolean })
                      }
                    />
                    <label htmlFor="securityhub" className="text-sm cursor-pointer">
                      Security Hub
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="config"
                      checked={config.enableConfig}
                      onCheckedChange={(checked) =>
                        setConfig({ ...config, enableConfig: checked as boolean })
                      }
                    />
                    <label htmlFor="config" className="text-sm cursor-pointer">
                      AWS Config
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              onClick={handleDownloadCloudFormation}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <FileCode className="h-4 w-4 mr-2" />
              CloudFormation (.yaml)
            </Button>

            <Button
              onClick={handleDownloadTerraform}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Code className="h-4 w-4 mr-2" />
              Terraform (.tf)
            </Button>

            <Button
              onClick={handleDownloadReadme}
              variant="outline"
              className="border-blue-300"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Guía README
            </Button>

            <Button
              onClick={handleDownloadAll}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Todo
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800">
              <strong>📌 Próximos pasos:</strong> Descarga los templates, revisa la configuración, y despliega usando AWS CLI o consola web.
              El README incluye comandos completos para el despliegue.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Intro */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Cloud className="h-6 w-6 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-violet-900 text-lg">Checklist de Landing Zone</h3>
              <p className="text-sm text-violet-700 mt-1">
                Utiliza este checklist para hacer seguimiento de las tareas de configuración de tu Landing Zone.
                Los templates generados arriba automatizan muchas de estas tareas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklists */}
      <div className="space-y-6">
        <ChecklistCard
          title="Account Structure"
          icon={<Scale className="h-5 w-5" />}
          items={checklist.accountStructure}
          onItemToggle={(id) => handleToggle('accountStructure', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('accountStructure', id, notes)}
          accentColor="violet"
        />

        <ChecklistCard
          title="Networking"
          icon={<Network className="h-5 w-5" />}
          items={checklist.networking}
          onItemToggle={(id) => handleToggle('networking', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('networking', id, notes)}
          accentColor="blue"
        />

        <ChecklistCard
          title="Security"
          icon={<Shield className="h-5 w-5" />}
          items={checklist.security}
          onItemToggle={(id) => handleToggle('security', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('security', id, notes)}
          accentColor="green"
        />

        <ChecklistCard
          title="Logging & Monitoring"
          icon={<FileText className="h-5 w-5" />}
          items={checklist.logging}
          onItemToggle={(id) => handleToggle('logging', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('logging', id, notes)}
          accentColor="amber"
        />

        <ChecklistCard
          title="Governance"
          icon={<Scale className="h-5 w-5" />}
          items={checklist.governance}
          onItemToggle={(id) => handleToggle('governance', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('governance', id, notes)}
          accentColor="fuchsia"
        />
      </div>
    </div>
  );
}
