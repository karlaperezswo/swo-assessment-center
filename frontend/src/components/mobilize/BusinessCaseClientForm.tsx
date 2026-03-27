import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';
import { BusinessCaseClientData } from '@/types/assessment';
import { formatSpanishNumber, parseSpanishNumber, formatInputValue, formatOnBlur } from '@/lib/numberFormat';

const formSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  assessmentTool: z.enum(['Cloudamize', 'Matilda', 'Concierto', 'AWS Migration Evaluator', 'Otra']),
  otherToolName: z.string().optional(),
  vertical: z.enum(['Energy', 'Insurance', 'Healthcare', 'Financial', 'Retail', 'Manufacturing', 'Technology', 'Other']),
  reportDate: z.string().min(1, 'Report date is required'),
  awsRegion: z.enum(['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1']),
  totalServers: z.number().min(0),
  onPremisesCost: z.number().min(0),
  companyDescription: z.string(),
  priorities: z.array(z.string()),
  migrationReadiness: z.enum(['ready', 'evaluating', 'not_ready']),
});

interface BusinessCaseClientFormProps {
  clientData: BusinessCaseClientData;
  onClientDataChange: (data: BusinessCaseClientData) => void;
}

const PRIORITIES = [
  { value: 'reduced_costs', label: 'Reduced infrastructure costs' },
  { value: 'operational_resilience', label: 'Improve operational resilience' },
  { value: 'business_agility', label: 'Business agility' },
  { value: 'environment_updated', label: 'Environment always updated' },
  { value: 'modernize_databases', label: 'Modernize Database workloads' },
  { value: 'security_compliance', label: 'Security compliance' },
];

const VERTICALS = [
  'Energy',
  'Insurance',
  'Healthcare',
  'Financial',
  'Retail',
  'Manufacturing',
  'Technology',
  'Other',
] as const;

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'sa-east-1', label: 'South America (Sao Paulo)' },
] as const;

const READINESS_OPTIONS = [
  { value: 'ready', label: 'Ready to migrate' },
  { value: 'evaluating', label: 'Evaluating' },
  { value: 'not_ready', label: 'Not ready yet' },
] as const;

const ASSESSMENT_TOOLS = [
  'Cloudamize',
  'Matilda',
  'Concierto',
  'AWS Migration Evaluator',
  'Otra',
] as const;

export function BusinessCaseClientForm({ clientData, onClientDataChange }: BusinessCaseClientFormProps) {
  const [onPremisesCostDisplay, setOnPremisesCostDisplay] = useState<string>(
    clientData.onPremisesCost > 0 ? formatSpanishNumber(clientData.onPremisesCost) : ''
  );
  const [totalServersDisplay, setTotalServersDisplay] = useState<string>(
    clientData.totalServers > 0 ? formatSpanishNumber(clientData.totalServers) : ''
  );

  const { register, watch, setValue, formState: { errors } } = useForm<BusinessCaseClientData>({
    resolver: zodResolver(formSchema),
    defaultValues: clientData,
  });

  const watchedValues = watch();

  const handleChange = () => {
    onClientDataChange(watchedValues);
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = watchedValues.priorities || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    setValue('priorities', newPriorities);
    onClientDataChange({ ...watchedValues, priorities: newPriorities });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Información del Cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nombre del Cliente *</Label>
            <Input
              id="clientName"
              {...register('clientName')}
              onChange={(e) => {
                register('clientName').onChange(e);
                handleChange();
              }}
              placeholder="Enter client name"
            />
            {errors.clientName && (
              <p className="text-sm text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vertical">Vertical/Industry</Label>
            <Select
              value={watchedValues.vertical}
              onValueChange={(value) => {
                setValue('vertical', value as any);
                onClientDataChange({ ...watchedValues, vertical: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map((vertical) => (
                  <SelectItem key={vertical} value={vertical}>
                    {vertical}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reportDate">Fecha del Reporte</Label>
            <Input
              id="reportDate"
              type="date"
              {...register('reportDate')}
              onChange={(e) => {
                register('reportDate').onChange(e);
                handleChange();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="awsRegion">Región AWS</Label>
            <Select
              value={watchedValues.awsRegion}
              onValueChange={(value) => {
                setValue('awsRegion', value as any);
                onClientDataChange({ ...watchedValues, awsRegion: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {AWS_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="totalServers">Total Servers in Scope</Label>
            <Input
              id="totalServers"
              type="text"
              value={totalServersDisplay}
              onChange={(e) => {
                const formatted = formatInputValue(e.target.value);
                setTotalServersDisplay(formatted);
                const numValue = parseSpanishNumber(formatted);
                setValue('totalServers', numValue);
                handleChange();
              }}
              onBlur={(e) => {
                const formatted = formatOnBlur(e.target.value);
                setTotalServersDisplay(formatted);
                const numValue = parseSpanishNumber(formatted);
                setValue('totalServers', numValue);
                handleChange();
              }}
              placeholder="Ej: 100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onPremisesCost">On-Premises Cost (USD/year)</Label>
            <Input
              id="onPremisesCost"
              type="text"
              value={onPremisesCostDisplay}
              onChange={(e) => {
                const formatted = formatInputValue(e.target.value);
                setOnPremisesCostDisplay(formatted);
                const numValue = parseSpanishNumber(formatted);
                setValue('onPremisesCost', numValue);
                handleChange();
              }}
              onBlur={(e) => {
                const formatted = formatOnBlur(e.target.value);
                setOnPremisesCostDisplay(formatted);
                const numValue = parseSpanishNumber(formatted);
                setValue('onPremisesCost', numValue);
                handleChange();
              }}
              placeholder="Ej: 1.500.000,00"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyDescription">Descripción de la Empresa</Label>
          <Textarea
            id="companyDescription"
            {...register('companyDescription')}
            onChange={(e) => {
              register('companyDescription').onChange(e);
              handleChange();
            }}
            placeholder="Brief description of the company and their infrastructure..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Client Priorities</Label>
          <div className="grid grid-cols-2 gap-2">
            {PRIORITIES.map((priority) => (
              <div key={priority.value} className="flex items-center space-x-2">
                <Checkbox
                  id={priority.value}
                  checked={watchedValues.priorities?.includes(priority.value)}
                  onCheckedChange={(checked) =>
                    handlePriorityChange(priority.value, checked as boolean)
                  }
                />
                <label
                  htmlFor={priority.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {priority.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="assessmentTool">Herramienta de Assessment *</Label>
            <Select
              value={watchedValues.assessmentTool}
              onValueChange={(value) => {
                setValue('assessmentTool', value as any);
                onClientDataChange({ ...watchedValues, assessmentTool: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tool" />
              </SelectTrigger>
              <SelectContent>
                {ASSESSMENT_TOOLS.map((tool) => (
                  <SelectItem key={tool} value={tool}>
                    {tool}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="migrationReadiness">Preparación para Migración</Label>
            <Select
              value={watchedValues.migrationReadiness}
              onValueChange={(value) => {
                setValue('migrationReadiness', value as any);
                onClientDataChange({ ...watchedValues, migrationReadiness: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select readiness status" />
              </SelectTrigger>
              <SelectContent>
                {READINESS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {watchedValues.assessmentTool === 'Otra' && (
          <div className="space-y-2">
            <Label htmlFor="otherToolName">Nombre de la Herramienta *</Label>
            <Input
              id="otherToolName"
              {...register('otherToolName')}
              onChange={(e) => {
                register('otherToolName').onChange(e);
                handleChange();
              }}
              placeholder="Especifique la herramienta"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
