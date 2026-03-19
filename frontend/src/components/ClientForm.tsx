import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from '@/i18n/useTranslation';
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

interface ClientFormProps {
  onFormChange: (data: ClientFormData) => void;
  initialData?: Partial<ClientFormData>;
}

export function ClientForm({ onFormChange, initialData }: ClientFormProps) {
  const { t } = useTranslation();

  const formSchema = z.object({
    clientName: z.string().min(1, t('clientForm.validation.clientNameRequired')),
    vertical: z.enum(['Energy', 'Insurance', 'Healthcare', 'Financial', 'Retail', 'Manufacturing', 'Technology', 'Other']),
    reportDate: z.string().min(1, t('clientForm.validation.reportDateRequired')),
    awsRegion: z.enum(['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'eu-west-1', 'eu-west-2', 'eu-central-1', 'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'sa-east-1']),
    totalServers: z.number().min(1, t('clientForm.validation.totalServersRequired')),
    onPremisesCost: z.number().min(0, t('clientForm.validation.costPositive')),
    companyDescription: z.string(),
    priorities: z.array(z.string()),
    migrationReadiness: z.enum(['ready', 'evaluating', 'not_ready']),
  });

  const PRIORITIES: { value: ClientPriority; label: string }[] = [
    { value: 'reduced_costs', label: t('clientForm.priorities.reducedCosts') },
    { value: 'operational_resilience', label: t('clientForm.priorities.operationalResilience') },
    { value: 'business_agility', label: t('clientForm.priorities.businessAgility') },
    { value: 'environment_updated', label: t('clientForm.priorities.environmentUpdated') },
    { value: 'modernize_databases', label: t('clientForm.priorities.modernizeDatabases') },
    { value: 'security_compliance', label: t('clientForm.priorities.securityCompliance') },
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
    { value: 'us-east-1', label: t('clientForm.awsRegions.usEast1') },
    { value: 'us-east-2', label: t('clientForm.awsRegions.usEast2') },
    { value: 'us-west-1', label: t('clientForm.awsRegions.usWest1') },
    { value: 'us-west-2', label: t('clientForm.awsRegions.usWest2') },
    { value: 'eu-west-1', label: t('clientForm.awsRegions.euWest1') },
    { value: 'eu-west-2', label: t('clientForm.awsRegions.euWest2') },
    { value: 'eu-central-1', label: t('clientForm.awsRegions.euCentral1') },
    { value: 'ap-southeast-1', label: t('clientForm.awsRegions.apSoutheast1') },
    { value: 'ap-southeast-2', label: t('clientForm.awsRegions.apSoutheast2') },
    { value: 'ap-northeast-1', label: t('clientForm.awsRegions.apNortheast1') },
    { value: 'sa-east-1', label: t('clientForm.awsRegions.saEast1') },
  ] as const;

  const READINESS_OPTIONS = [
    { value: 'ready', label: t('clientForm.readiness.ready') },
    { value: 'evaluating', label: t('clientForm.readiness.evaluating') },
    { value: 'not_ready', label: t('clientForm.readiness.notReady') },
  ] as const;
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
          {t('clientForm.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">{t('clientForm.clientName')}</Label>
            <Input
              id="clientName"
              {...register('clientName')}
              onChange={(e) => {
                register('clientName').onChange(e);
                handleChange();
              }}
              placeholder={t('clientForm.clientNamePlaceholder')}
            />
            {errors.clientName && (
              <p className="text-sm text-red-500">{errors.clientName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vertical">{t('clientForm.vertical')}</Label>
            <Select
              value={watchedValues.vertical}
              onValueChange={(value) => {
                setValue('vertical', value as any);
                onFormChange({ ...watchedValues, vertical: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('clientForm.selectVertical')} />
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
            <Label htmlFor="reportDate">{t('clientForm.reportDate')}</Label>
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
            <Label htmlFor="awsRegion">{t('clientForm.awsRegion')}</Label>
            <Select
              value={watchedValues.awsRegion}
              onValueChange={(value) => {
                setValue('awsRegion', value as any);
                onFormChange({ ...watchedValues, awsRegion: value as any });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('clientForm.selectRegion')} />
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
            <Label htmlFor="totalServers">{t('clientForm.totalServers')}</Label>
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
            <Label htmlFor="onPremisesCost">{t('clientForm.onPremisesCost')}</Label>
            <Input
              id="onPremisesCost"
              type="number"
              {...register('onPremisesCost', { valueAsNumber: true })}
              onChange={(e) => {
                register('onPremisesCost', { valueAsNumber: true }).onChange(e);
                handleChange();
              }}
              placeholder={t('clientForm.onPremisesCostPlaceholder')}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyDescription">{t('clientForm.companyDescription')}</Label>
          <Textarea
            id="companyDescription"
            {...register('companyDescription')}
            onChange={(e) => {
              register('companyDescription').onChange(e);
              handleChange();
            }}
            placeholder={t('clientForm.companyDescriptionPlaceholder')}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>{t('clientForm.clientPriorities')}</Label>
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
          <Label htmlFor="migrationReadiness">{t('clientForm.migrationReadiness')}</Label>
          <Select
            value={watchedValues.migrationReadiness}
            onValueChange={(value) => {
              setValue('migrationReadiness', value as any);
              onFormChange({ ...watchedValues, migrationReadiness: value as any });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('clientForm.selectReadiness')} />
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
