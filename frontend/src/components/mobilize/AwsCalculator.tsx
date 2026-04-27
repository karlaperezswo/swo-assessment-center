import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calculator, ChevronDown, ChevronUp, Download, Server,
  Settings, FileSpreadsheet, CheckCircle2, Circle, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BusinessCaseUploadResponse, TCO1YearUploadResponse, BusinessCaseClientData,
} from '@/types/assessment';
import {
  ServerMapping, AdditionalServicesConfig, InstanceFamily, PaymentOption, PricingModel,
  mapInstanceType, getOsString, getInstanceOptions, generateEC2BulkImportXlsx, downloadXlsx,
  REGION_DISPLAY_NAMES,
} from '@/lib/awsCalculatorGenerator';

interface AwsCalculatorProps {
  businessCaseData: BusinessCaseUploadResponse | null;
  tco1YearData: TCO1YearUploadResponse | null;
  clientData: BusinessCaseClientData;
}

const INSTANCE_FAMILIES: InstanceFamily[] = ['r8i', 'r8a', 'm8a', 'm6i', 'm5'];
const PAYMENT_OPTIONS: PaymentOption[] = ['No Upfront', 'Partial Upfront', 'All Upfront'];

const DEFAULT_SERVICES: AdditionalServicesConfig = {
  cloudwatch: { enabled: true,  spans: 70,  metrics: 130, logsGB: 50,  dashboards: 4, standardAlarms: 100, highResAlarms: 70 },
  firewall:   { enabled: true,  endpoints: 1, dataProcessedGB: 100 },
  s3Logs:     { enabled: true,  storageGB: 500 },
  vpn:        { enabled: true,  connections: 1, workDaysPerMonth: 22 },
  dataTransfer: { enabled: true, outboundTB: 3 },
  backup:     { enabled: true,  primaryDataTB: 9, dailyRetentionDays: 7, weeklyRetentionWeeks: 4, monthlyRetentionMonths: 12 },
};

const MODEL_META: Record<PricingModel, { label: string; badge: string; color: string; savings: string }> = {
  ondemand: { label: 'On Demand',        badge: 'Sin compromiso', color: 'border-gray-300 bg-gray-50',       savings: '' },
  '1yr':    { label: '1 Año Savings Plan', badge: '~35% ahorro',  color: 'border-blue-300 bg-blue-50',       savings: '35%' },
  '3yr':    { label: '3 Años Savings Plan', badge: '~50% ahorro', color: 'border-purple-300 bg-purple-50',   savings: '50%' },
};

export function AwsCalculator({ businessCaseData, tco1YearData, clientData }: AwsCalculatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'servers' | 'services' | 'export'>('servers');
  const [estimateName, setEstimateName] = useState('');
  const [region, setRegion] = useState(clientData.awsRegion ?? 'us-east-1');
  const [instanceFamily, setInstanceFamily] = useState<InstanceFamily>('r8i');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('No Upfront');
  const [serverMappings, setServerMappings] = useState<ServerMapping[]>([]);
  const [additionalServices, setAdditionalServices] = useState<AdditionalServicesConfig>(DEFAULT_SERVICES);

  // Sync estimate name with client name
  useEffect(() => {
    if (clientData.clientName) setEstimateName(`${clientData.clientName} - AWS`);
  }, [clientData.clientName]);

  // Sync region with client data
  useEffect(() => {
    if (clientData.awsRegion) setRegion(clientData.awsRegion);
  }, [clientData.awsRegion]);

  // Build server mappings when data or family changes
  useEffect(() => {
    if (!businessCaseData) return;
    const servers = businessCaseData.businessCaseData.servers;
    setServerMappings(servers.map(server => ({
      server,
      instanceType: mapInstanceType(server.cpus ?? 2, server.ram ?? 8, instanceFamily),
      osString: getOsString(server.osVersion),
      isIncluded: true,
    })));
  }, [businessCaseData, instanceFamily]);

  // Auto-populate data transfer from network transfer data
  useEffect(() => {
    const transfers = tco1YearData?.tco1YearData?.networkTransfer;
    if (!transfers?.length) return;
    const totalGB = transfers.reduce((sum, n) => sum + n.transferGB, 0);
    const totalTB = Math.max(1, Math.round(totalGB / 1024));
    setAdditionalServices(prev => ({ ...prev, dataTransfer: { ...prev.dataTransfer, outboundTB: totalTB } }));
  }, [tco1YearData]);

  // Auto-populate backup storage from total server storage
  useEffect(() => {
    if (!businessCaseData) return;
    const totalGB = businessCaseData.businessCaseData.servers.reduce((sum, s) => sum + (s.storage ?? 0), 0);
    const totalTB = Math.max(1, Math.round(totalGB / 1024));
    setAdditionalServices(prev => ({ ...prev, backup: { ...prev.backup, primaryDataTB: totalTB } }));
  }, [businessCaseData]);

  const includedCount = serverMappings.filter(m => m.isIncluded).length;

  const handleDownload = (model: PricingModel) => {
    if (!serverMappings.length) {
      toast.error('No hay servidores para exportar. Carga el archivo AS Is primero.');
      return;
    }
    const paymentLabel = paymentOption.replace(/\s+/g, '-');
    const labels: Record<PricingModel, string> = {
      ondemand: 'OnDemand',
      '1yr': `1Yr-${paymentLabel}`,
      '3yr': `3Yr-${paymentLabel}`,
    };
    const name = estimateName || 'AWS-Estimate';
    const buffer = generateEC2BulkImportXlsx({
      estimateName: `${name} - ${labels[model]}`,
      region,
      pricingModel: model,
      paymentOption,
      serverMappings,
      additionalServices,
      date: new Date().toLocaleDateString('es-ES'),
    });
    downloadXlsx(buffer, `${name.replace(/\s+/g, '-')}-${labels[model]}-EC2.xlsx`);
    toast.success(`Excel ${labels[model]} descargado`, { description: 'Impórtalo en calculator.aws → Bulk Import → EC2 Instances' });
  };

  const handleDownloadAll = () => {
    (['ondemand', '1yr', '3yr'] as PricingModel[]).forEach(m => handleDownload(m));
  };

  const updateServerMapping = (idx: number, patch: Partial<ServerMapping>) => {
    setServerMappings(prev => prev.map((m, i) => i === idx ? { ...m, ...patch } : m));
  };

  const toggleAllServers = (included: boolean) => {
    setServerMappings(prev => prev.map(m => ({ ...m, isIncluded: included })));
  };

  const updateService = <K extends keyof AdditionalServicesConfig>(
    key: K,
    patch: Partial<AdditionalServicesConfig[K]>,
  ) => {
    setAdditionalServices(prev => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const canExport = !!businessCaseData;

  return (
    <Card className="border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
      {/* Header — always visible */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-orange-100/50 transition-colors rounded-t-lg"
        onClick={() => setIsExpanded(v => !v)}
      >
        <div className="flex items-center gap-3">
          <Calculator className="h-6 w-6 text-orange-600" />
          <div>
            <h3 className="font-bold text-orange-900 text-lg">Calculadora AWS</h3>
            <p className="text-sm text-orange-700">
              Genera Excel de EC2 para Bulk Import en calculator.aws
            </p>
          </div>
          {canExport && (
            <Badge className="bg-green-100 text-green-800 border-green-300 ml-2">
              {includedCount} servidores listos
            </Badge>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5 text-orange-600" /> : <ChevronDown className="h-5 w-5 text-orange-600" />}
      </div>

      {isExpanded && (
        <CardContent className="pt-0 pb-6 px-6 space-y-6">

          {/* Prerequisite warning */}
          {!businessCaseData && (
            <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg flex items-start gap-3">
              <Info className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-yellow-900">Se requiere el archivo AS Is</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Carga el archivo de Caso de Negocio (AS Is) arriba para habilitar la calculadora.
                  El TCO 1 Año es opcional pero mejora el cálculo de Data Transfer y Backup.
                </p>
              </div>
            </div>
          )}

          {/* Config row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border border-orange-200">
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Nombre estimación</Label>
              <Input
                value={estimateName}
                onChange={e => setEstimateName(e.target.value)}
                placeholder="Ej. Cliente - AWS"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Región AWS</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as any)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGION_DISPLAY_NAMES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <span className="font-mono text-xs mr-2 text-gray-400">{key}</span>{label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Familia instancias</Label>
              <Select value={instanceFamily} onValueChange={(v) => setInstanceFamily(v as InstanceFamily)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INSTANCE_FAMILIES.map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500 uppercase tracking-wide">Payment option</Label>
              <Select value={paymentOption} onValueChange={v => setPaymentOption(v as PaymentOption)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_OPTIONS.map(o => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-orange-200">
            {([
              { key: 'servers',  label: 'Servidores',          icon: Server },
              { key: 'services', label: 'Servicios adicionales', icon: Settings },
              { key: 'export',   label: 'Exportar',             icon: FileSpreadsheet },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === key
                    ? 'bg-white border border-b-white border-orange-200 -mb-px text-orange-700'
                    : 'text-gray-500 hover:text-orange-600'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === 'servers' && serverMappings.length > 0 && (
                  <Badge variant="secondary" className="text-xs py-0 h-5">
                    {includedCount}/{serverMappings.length}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* ── TAB: Servidores ── */}
          {activeTab === 'servers' && (
            <div className="space-y-3">
              {!canExport ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Carga el archivo AS Is para ver los servidores mapeados.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Cada servidor se mapea automáticamente a un EC2 según sus vCPUs y RAM.
                      Puedes editar el instance type o excluir servidores individualmente.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => toggleAllServers(true)}>
                        Incluir todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => toggleAllServers(false)}>
                        Excluir todos
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-8"></th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">Hostname</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600">Sistema operativo</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-600">vCPUs</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-600">RAM (GB)</th>
                          <th className="text-right px-3 py-2 font-semibold text-gray-600">Storage (GB)</th>
                          <th className="text-left px-3 py-2 font-semibold text-gray-600 w-48">Instance type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {serverMappings.map((mapping, idx) => (
                          <tr
                            key={mapping.server.serverId}
                            className={`transition-colors ${mapping.isIncluded ? 'bg-white' : 'bg-gray-50 opacity-50'}`}
                          >
                            <td className="px-3 py-2">
                              <button
                                onClick={() => updateServerMapping(idx, { isIncluded: !mapping.isIncluded })}
                                className="text-orange-500 hover:text-orange-700"
                              >
                                {mapping.isIncluded
                                  ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  : <Circle className="h-5 w-5 text-gray-300" />
                                }
                              </button>
                            </td>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {mapping.server.hostname}
                              {mapping.server.environment && (
                                <Badge variant="outline" className="ml-2 text-xs py-0 h-4">
                                  {mapping.server.environment}
                                </Badge>
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate" title={mapping.osString}>
                              {mapping.osString}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700">{mapping.server.cpus ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-gray-700">{mapping.server.ram ?? '—'}</td>
                            <td className="px-3 py-2 text-right text-gray-700">
                              {mapping.server.storage ? mapping.server.storage.toLocaleString() : '—'}
                            </td>
                            <td className="px-3 py-2">
                              <Select
                                value={mapping.instanceType}
                                onValueChange={v => updateServerMapping(idx, { instanceType: v })}
                                disabled={!mapping.isIncluded}
                              >
                                <SelectTrigger className="h-7 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {getInstanceOptions(instanceFamily).map(opt => (
                                    <SelectItem key={opt} value={opt} className="text-xs font-mono">{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Servicios adicionales ── */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* CloudWatch */}
              <ServiceCard
                title="Amazon CloudWatch"
                subtitle="Monitoreo y observabilidad"
                enabled={additionalServices.cloudwatch.enabled}
                onToggle={v => updateService('cloudwatch', { enabled: v })}
                color="blue"
              >
                <NumberField label="Spans / visita" value={additionalServices.cloudwatch.spans}
                  onChange={v => updateService('cloudwatch', { spans: v })} />
                <NumberField label="Métricas" value={additionalServices.cloudwatch.metrics}
                  onChange={v => updateService('cloudwatch', { metrics: v })} />
                <NumberField label="Logs (GB)" value={additionalServices.cloudwatch.logsGB}
                  onChange={v => updateService('cloudwatch', { logsGB: v })} />
                <NumberField label="Dashboards" value={additionalServices.cloudwatch.dashboards}
                  onChange={v => updateService('cloudwatch', { dashboards: v })} />
                <NumberField label="Alarmas estándar" value={additionalServices.cloudwatch.standardAlarms}
                  onChange={v => updateService('cloudwatch', { standardAlarms: v })} />
                <NumberField label="Alarmas alta resolución" value={additionalServices.cloudwatch.highResAlarms}
                  onChange={v => updateService('cloudwatch', { highResAlarms: v })} />
              </ServiceCard>

              {/* Network Firewall */}
              <ServiceCard
                title="AWS Network Firewall"
                subtitle="Firewall Manager"
                enabled={additionalServices.firewall.enabled}
                onToggle={v => updateService('firewall', { enabled: v })}
                color="red"
              >
                <NumberField label="Endpoints" value={additionalServices.firewall.endpoints}
                  onChange={v => updateService('firewall', { endpoints: v })} />
                <NumberField label="Datos procesados (GB/mes)" value={additionalServices.firewall.dataProcessedGB}
                  onChange={v => updateService('firewall', { dataProcessedGB: v })} />
              </ServiceCard>

              {/* S3 Logs */}
              <ServiceCard
                title="S3 Standard"
                subtitle="Almacenamiento de Logs"
                enabled={additionalServices.s3Logs.enabled}
                onToggle={v => updateService('s3Logs', { enabled: v })}
                color="green"
              >
                <NumberField label="Storage (GB/mes)" value={additionalServices.s3Logs.storageGB}
                  onChange={v => updateService('s3Logs', { storageGB: v })} />
              </ServiceCard>

              {/* VPN */}
              <ServiceCard
                title="VPN Connection"
                subtitle="Site-to-Site VPN"
                enabled={additionalServices.vpn.enabled}
                onToggle={v => updateService('vpn', { enabled: v })}
                color="purple"
              >
                <NumberField label="Conexiones VPN" value={additionalServices.vpn.connections}
                  onChange={v => updateService('vpn', { connections: v })} />
                <NumberField label="Días laborables/mes" value={additionalServices.vpn.workDaysPerMonth}
                  onChange={v => updateService('vpn', { workDaysPerMonth: v })} />
              </ServiceCard>

              {/* Data Transfer */}
              <ServiceCard
                title="Data Transfer"
                subtitle={tco1YearData?.tco1YearData?.networkTransfer?.length
                  ? 'Auto-calculado del reporte TCO 1 Año'
                  : 'Transferencia de datos saliente'}
                enabled={additionalServices.dataTransfer.enabled}
                onToggle={v => updateService('dataTransfer', { enabled: v })}
                color="cyan"
                autoDetected={!!tco1YearData?.tco1YearData?.networkTransfer?.length}
              >
                <NumberField label="Outbound Internet (TB/mes)" value={additionalServices.dataTransfer.outboundTB}
                  onChange={v => updateService('dataTransfer', { outboundTB: v })} />
              </ServiceCard>

              {/* Backup */}
              <ServiceCard
                title="EBS Backup"
                subtitle={businessCaseData
                  ? 'Auto-calculado del storage total de servidores'
                  : 'Continuidad del negocio'}
                enabled={additionalServices.backup.enabled}
                onToggle={v => updateService('backup', { enabled: v })}
                color="orange"
                autoDetected={!!businessCaseData}
              >
                <NumberField label="Datos primarios (TB)" value={additionalServices.backup.primaryDataTB}
                  onChange={v => updateService('backup', { primaryDataTB: v })} />
                <NumberField label="Retención diaria (días)" value={additionalServices.backup.dailyRetentionDays}
                  onChange={v => updateService('backup', { dailyRetentionDays: v })} />
                <NumberField label="Retención semanal (semanas)" value={additionalServices.backup.weeklyRetentionWeeks}
                  onChange={v => updateService('backup', { weeklyRetentionWeeks: v })} />
                <NumberField label="Retención mensual (meses)" value={additionalServices.backup.monthlyRetentionMonths}
                  onChange={v => updateService('backup', { monthlyRetentionMonths: v })} />
              </ServiceCard>
            </div>
          )}

          {/* ── TAB: Exportar ── */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-blue-900">Cómo importar EC2 en AWS Calculator</p>
                    <ol className="text-sm text-blue-800 mt-2 space-y-1 list-decimal list-inside">
                      <li>Descarga el Excel del modelo de pricing que necesites</li>
                      <li>Ve a <span className="font-mono bg-blue-100 px-1 rounded">calculator.aws</span> → crea una nueva estimación</li>
                      <li>Agrega un servicio <strong>Amazon EC2</strong> → selecciona <strong>Bulk Import</strong></li>
                      <li>Sube el archivo <strong>.xlsx</strong> → AWS Calculator calcula los costos automáticamente</li>
                    </ol>
                  </div>
                  <div className="border-t border-blue-200 pt-2">
                    <p className="text-xs text-blue-700 font-medium">Servicios adicionales (configuración manual)</p>
                    <p className="text-xs text-blue-600 mt-1">
                      CloudWatch, Network Firewall, S3, VPN, Data Transfer y EBS Backup no soportan Bulk Import.
                      Agrégalos manualmente en la estimación usando los valores configurados en la pestaña "Servicios adicionales".
                    </p>
                  </div>
                </div>
              </div>

              {/* Resumen de lo que incluye */}
              {canExport && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{includedCount}</p>
                    <p className="text-xs text-gray-500 mt-1">Instancias EC2</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">{serverMappings.filter(m => m.isIncluded && m.server.storage).length}</p>
                    <p className="text-xs text-gray-500 mt-1">Volúmenes EBS</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.values(additionalServices).filter(s => s.enabled).length}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Servicios adicionales</p>
                  </div>
                </div>
              )}

              {/* 3 download cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['ondemand', '1yr', '3yr'] as PricingModel[]).map(model => {
                  const meta = MODEL_META[model];
                  return (
                    <div key={model} className={`rounded-lg border-2 ${meta.color} p-4 flex flex-col gap-3`}>
                      <div>
                        <p className="font-bold text-gray-900">{meta.label}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {meta.badge}
                        </Badge>
                        {meta.savings && (
                          <p className="text-xs text-green-700 mt-2 font-medium">
                            Ahorro estimado vs OnDemand: {meta.savings}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {model === 'ondemand'
                          ? 'Precio por hora sin compromiso. Máxima flexibilidad.'
                          : model === '1yr'
                          ? `Savings Plan 1 año, ${paymentOption}. Ideal para cargas estables.`
                          : `Savings Plan 3 años, ${paymentOption}. Mayor ahorro a largo plazo.`}
                      </p>
                      <Button
                        onClick={() => handleDownload(model)}
                        disabled={!canExport}
                        className="mt-auto w-full gap-2"
                        variant={model === '1yr' ? 'default' : 'outline'}
                      >
                        <Download className="h-4 w-4" />
                        Descargar Excel (.xlsx)
                      </Button>
                    </div>
                  );
                })}
              </div>

              {/* Download all button */}
              <Button
                onClick={handleDownloadAll}
                disabled={!canExport}
                size="lg"
                className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
              >
                <Download className="h-5 w-5" />
                Descargar los 3 Excel de una vez
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ── Sub-components ──────────────────────────────────────

function ServiceCard({
  title, subtitle, enabled, onToggle, color, autoDetected, children,
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  color: string;
  autoDetected?: boolean;
  children: React.ReactNode;
}) {
  const border: Record<string, string> = {
    blue: 'border-blue-200', red: 'border-red-200', green: 'border-green-200',
    purple: 'border-purple-200', cyan: 'border-cyan-200', orange: 'border-orange-200',
  };
  const dot: Record<string, string> = {
    blue: 'bg-blue-500', red: 'bg-red-500', green: 'bg-green-500',
    purple: 'bg-purple-500', cyan: 'bg-cyan-500', orange: 'bg-orange-500',
  };

  return (
    <div className={`rounded-lg border-2 ${border[color] ?? 'border-gray-200'} p-4 space-y-3 ${!enabled ? 'opacity-60' : ''} bg-white`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${dot[color] ?? 'bg-gray-500'}`} />
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{title}</p>
            <div className="flex items-center gap-1 flex-wrap">
              <p className="text-xs text-gray-500">{subtitle}</p>
              {autoDetected && (
                <Badge className="text-xs py-0 h-4 bg-green-100 text-green-700 border-green-300">auto</Badge>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative flex-shrink-0 h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
        </button>
      </div>
      {enabled && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-xs text-gray-500">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-7 text-xs"
      />
    </div>
  );
}
