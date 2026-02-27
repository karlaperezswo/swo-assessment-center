import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ClientFormData, ClientPriority } from '@/types/assessment';

const formSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  vertical: z.enum(['Energy', 'Insurance', 'Healthcare', 'Financial', 'Retail', 'Manufacturing', 'Technology', 'Other']),
  reportDate: z.string().min(1, 'Report date is required'),
  awsRegion: z.enum(['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1']),
  totalServers: z.number().min(1, 'Total servers must be at least 1'),
  onPremisesCost: z.number().min(0, 'Cost must be positive'),
  companyDescription: z.string(),
  priorities: z.array(z.string()),
  migrationReadiness: z.enum(['ready', 'evaluating', 'not_ready']),
});

interface ClientFormProps {
  onFormChange: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
}

const PRIORITIES: { value: ClientPriority; label: string }[] = [
  { value: 'reduced_costs', label: 'Reducir costos de infraestructura' },
  { value: 'operational_resilience', label: 'Mejorar resiliencia operacional' },
  { value: 'business_agility', label: 'Agilidad de negocio' },
  { value: 'environment_updated', label: 'Ambiente siempre actualizado' },
  { value: 'modernize_databases', label: 'Modernizar cargas de trabajo de bases de datos' },
  { value: 'security_compliance', label: 'Cumplimiento de seguridad' },
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
  { value: 'ready', label: 'Listo para migrar' },
  { value: 'evaluating', label: 'Evaluando' },
  { value: 'not_ready', label: 'Aún no está listo' },
] as const;

export function ClientForm({ onFormChange, initialData }: ClientFormProps) {
  const { register, watch, setValue, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientName: initialData?.clientName || '',
      vertical: initialData?.vertical || 'Technology',
      reportDate: initialData?.reportDate || new Date().toISOString().split('T')[0],
      awsRegion: initialData?.awsRegion || 'us-east-1',
      totalServers: initialData?.totalServers || 0,
      onPremisesCost: initialData?.onPremisesCost || 0,
      companyDescription: initialData?.companyDescription || '',
      priorities: initialData?.priorities || [],
      migrationReadiness: initialData?.migrationReadiness || 'evaluating',
    },
  });

  const watchedValues = watch();

  // Update parent when form changes
  const handleChange = () => {
    onFormChange(watchedValues);
  };

  const handlePriorityChange = (priority: ClientPriority, checked: boolean) => {
    const currentPriorities = watchedValues.priorities || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority);
    setValue('priorities', newPriorities);
    onFormChange({ ...watchedValues, priorities: newPriorities });
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
              placeholder="Ingrese el nombre del cliente"
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
                onFormChange({ ...watchedValues, vertical: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione industria" />
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
                onFormChange({ ...watchedValues, awsRegion: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione región" />
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
            <Label htmlFor="totalServers">Total de Servidores en Alcance</Label>
            <Input
              id="totalServers"
              type="number"
              {...register('totalServers', { valueAsNumber: true })}
              onChange={(e) => {
                register('totalServers', { valueAsNumber: true }).onChange(e);
                handleChange();
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="onPremisesCost">Costo On-Premises (USD/año)</Label>
            <Input
              id="onPremisesCost"
              type="number"
              {...register('onPremisesCost', { valueAsNumber: true })}
              onChange={(e) => {
                register('onPremisesCost', { valueAsNumber: true }).onChange(e);
                handleChange();
              }}
              placeholder="Costo anual"
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
            placeholder="Breve descripción de la empresa y su infraestructura..."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Prioridades del Cliente</Label>
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

        <div className="space-y-2">
          <Label htmlFor="migrationReadiness">Preparación para Migración</Label>
          <Select
            value={watchedValues.migrationReadiness}
            onValueChange={(value) => {
              setValue('migrationReadiness', value as any);
              onFormChange({ ...watchedValues, migrationReadiness: value as any });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione estado de preparación" />
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
      </CardContent>
    </Card>
  );
}
