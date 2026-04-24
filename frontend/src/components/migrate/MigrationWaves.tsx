import { useMemo, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Input } from '@/components/ui/input';
import { MigrationPlanner } from '@/components/MigrationPlanner';
import { WavePlannerTool } from '@/components/migrate/WavePlannerTool';
import { WaveGantt } from '@/components/migrate/WaveGantt';

import { MigrationWave } from '@/types/assessment';
import { Waves, Plus, Trash2, Play, Pause, CheckCircle, AlertCircle, Settings, Sparkles, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  detectClusters,
  detectWaveConflicts,
  suggestWavesFromClusters,
  DependencyEdge,
} from '@/lib/dependencyClusters';
import { toast } from 'sonner';

interface MigrationWavesProps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // totalServers and totalApplications are available for future use
  waves: MigrationWave[];
  onWavesChange: (waves: MigrationWave[]) => void;
  dependencyData?: any;
  // totalServers: number;
  // totalApplications: number;
}

const statusConfig = {
  planned: { icon: Pause, color: '#eab308', label: 'Planned', bg: 'bg-yellow-50 border-yellow-200' },
  in_progress: { icon: Play, color: '#3b82f6', label: 'In Progress', bg: 'bg-blue-50 border-blue-200' },
  completed: { icon: CheckCircle, color: '#22c55e', label: 'Completed', bg: 'bg-green-50 border-green-200' },
  blocked: { icon: AlertCircle, color: '#ef4444', label: 'Blocked', bg: 'bg-red-50 border-red-200' },
};

export function MigrationWaves({ waves, onWavesChange, dependencyData }: MigrationWavesProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);
  const [showWaveTool, setShowWaveTool] = useState(false);
  const [newWave, setNewWave] = useState({
    name: '',
    startDate: '',
    endDate: '',
    serverCount: 0,
    applicationCount: 0,
    strategy: 'Rehost',
  });

  const handleAdd = () => {
    if (!newWave.name || !newWave.startDate || !newWave.endDate) return;

    const wave: MigrationWave = {
      id: `wave-${Date.now()}`,
      waveNumber: waves.length + 1,
      name: newWave.name,
      startDate: newWave.startDate,
      endDate: newWave.endDate,
      serverCount: newWave.serverCount,
      applicationCount: newWave.applicationCount,
      status: 'planned',
      strategy: newWave.strategy,
      notes: '',
    };

    onWavesChange([...waves, wave]);
    setNewWave({ name: '', startDate: '', endDate: '', serverCount: 0, applicationCount: 0, strategy: 'Rehost' });
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    onWavesChange(waves.filter(w => w.id !== id).map((w, i) => ({ ...w, waveNumber: i + 1 })));
  };

  const handleStatusChange = (id: string) => {
    onWavesChange(waves.map(w => {
      if (w.id !== id) return w;
      const statuses: MigrationWave['status'][] = ['planned', 'in_progress', 'completed', 'blocked'];
      const currentIdx = statuses.indexOf(w.status);
      const nextIdx = (currentIdx + 1) % statuses.length;
      return { ...w, status: statuses[nextIdx] };
    }));
  };

  const chartData = waves.map(w => ({
    name: `Wave ${w.waveNumber}`,
    servers: w.serverCount,
    apps: w.applicationCount,
    fill: statusConfig[w.status].color,
  }));

  const edges: DependencyEdge[] = useMemo(
    () => (dependencyData?.dependencies ?? []) as DependencyEdge[],
    [dependencyData]
  );

  const conflicts = useMemo(
    () => (edges.length > 0 ? detectWaveConflicts(waves, edges) : []),
    [waves, edges]
  );

  const handleAutoGroup = () => {
    const allServers: string[] = dependencyData?.servers ?? [];
    if (allServers.length === 0 || edges.length === 0) {
      toast.error(t('waveIntegration.autoGroupError'));
      return;
    }
    const clusters = detectClusters(allServers, edges);
    const suggestions = suggestWavesFromClusters(clusters);
    if (suggestions.length === 0) {
      toast.error(t('waveIntegration.autoGroupError'));
      return;
    }
    const newWaves: MigrationWave[] = suggestions.map((s) => ({
      id: `wave-cluster-${s.waveNumber}-${Date.now()}`,
      waveNumber: s.waveNumber,
      name: t('waveIntegration.waveLabel', { n: s.waveNumber, count: s.servers.length }),
      startDate: '',
      endDate: '',
      serverCount: s.servers.length,
      applicationCount: 0,
      status: 'planned' as const,
      strategy: 'Rehost',
      notes: s.rationale,
      servers: s.servers,
    }));
    onWavesChange(newWaves);
    toast.success(t('waveIntegration.autoGroupSuccess', { waves: newWaves.length, clusters: clusters.length }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div style={{
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(8,145,178,0.12)', border: '1px solid #99f6e4'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
          padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12
        }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center' }}>
            <Waves style={{ width: 20, height: 20, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.01em' }}>
              Planificación de Olas de Migración
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>
              Organiza la migración en olas según dependencias, prioridad y complejidad técnica
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '3px 14px',
              fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {waves.length} olas
            </div>
          </div>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)', padding: '12px 20px',
          borderTop: '1px solid #99f6e4', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {[
            { value: waves.length, label: t('migrationWaves.waveLabel'), icon: '🌊' },
            { value: waves.reduce((s, w) => s + w.serverCount, 0), label: t('migrationWaves.serversLabel'), icon: '🖥' },
            { value: waves.reduce((s, w) => s + w.applicationCount, 0), label: t('migrationWaves.appsLabel'), icon: '📦' },
            { value: waves.filter(w => w.status === 'completed').length, label: t('migrationWaves.statuses.completed'), icon: '✅' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 60 }}>
              <div style={{ fontSize: 10, marginBottom: 1 }}>{s.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f766e', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#0891b2', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" aria-label={showForm ? 'Cancelar formulario' : 'Agregar nueva ola'} onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: showForm ? 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)' : '#f1f5f9',
            color: showForm ? '#fff' : '#475569',
            boxShadow: showForm ? '0 2px 8px rgba(8,145,178,0.3)' : 'none' }}>
          <Plus style={{ width: 14, height: 14 }} />
          {showForm ? 'Cancelar' : 'Agregar Ola'}
        </button>
        <button type="button" aria-label="Abrir Migration Planner" onClick={() => setShowWaveTool(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
            background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)',
            color: '#fff', boxShadow: '0 2px 8px rgba(8,145,178,0.3)' }}>
          <Settings style={{ width: 14, height: 14 }} />
          Migration Planner
        </button>
        {edges.length > 0 && (
          <button type="button" aria-label={t('waveIntegration.autoGroup')} onClick={handleAutoGroup}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)',
              color: '#fff', boxShadow: '0 2px 8px rgba(8,145,178,0.3)' }}
            title={t('waveIntegration.autoGroupTooltip')}>
            <Sparkles style={{ width: 14, height: 14 }} />
            {t('waveIntegration.autoGroup')}
          </button>
        )}
      </div>

      {conflicts.length > 0 && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #fecaca',
          background: '#fef2f2', boxShadow: '0 1px 4px rgba(239,68,68,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
            borderBottom: '1px solid #fecaca', background: '#fee2e2' }}>
            <ShieldAlert style={{ width: 16, height: 16, color: '#b91c1c' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>
              {t('waveIntegration.conflictsHeader', { count: conflicts.length })}
            </span>
          </div>
          <ul style={{ margin: 0, padding: '8px 16px 12px 32px', listStyle: 'disc' }}>
            {conflicts.slice(0, 6).map((c, i) => (
              <li key={i} style={{ fontSize: 12, color: '#7f1d1d', marginTop: 4 }}>
                <strong style={{ color: c.severity === 'critical' ? '#991b1b' : '#b45309' }}>
                  [{c.severity === 'critical' ? t('waveIntegration.severityCritical') : t('waveIntegration.severityWarning')}]
                </strong>{' '}
                {c.message}
              </li>
            ))}
            {conflicts.length > 6 && (
              <li style={{ fontSize: 11, color: '#991b1b', marginTop: 4, fontStyle: 'italic' }}>
                {t('waveIntegration.conflictsMore', { count: conflicts.length - 6 })}
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Add Wave Form */}
      {showForm && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #99f6e4', boxShadow: '0 2px 8px rgba(8,145,178,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '12px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t('migrationWaves.createNew')}</div>
          </div>
          <div style={{ padding: '16px 20px', background: '#fff' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.waveName')}</label>
                <Input value={newWave.name} onChange={(e) => setNewWave({ ...newWave, name: e.target.value })}
                  placeholder="ej. Dev/Test Workloads" className="text-sm" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.strategy')}</label>
                <select value={newWave.strategy} onChange={(e) => setNewWave({ ...newWave, strategy: e.target.value })}
                  style={{ width: '100%', fontSize: 13, border: '1px solid #e2e8f0', borderRadius: 6, padding: '7px 10px', color: '#374151' }}>
                  <option>Rehost</option><option>Replatform</option><option>Refactor</option>
                  <option>Repurchase</option><option>Relocate</option><option>Retain</option><option>Retire</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.startDate')}</label>
                <Input type="date" value={newWave.startDate} onChange={(e) => setNewWave({ ...newWave, startDate: e.target.value })} className="text-sm" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.endDate')}</label>
                <Input type="date" value={newWave.endDate} onChange={(e) => setNewWave({ ...newWave, endDate: e.target.value })} className="text-sm" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.serverCount')}</label>
                <Input type="number" value={newWave.serverCount} onChange={(e) => setNewWave({ ...newWave, serverCount: parseInt(e.target.value) || 0 })} className="text-sm" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>{t('migrationWaves.applicationCount')}</label>
                <Input type="number" value={newWave.applicationCount} onChange={(e) => setNewWave({ ...newWave, applicationCount: parseInt(e.target.value) || 0 })} className="text-sm" />
              </div>
            </div>
            <button onClick={handleAdd}
              style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 8,
                fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
                background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)', color: '#fff',
                boxShadow: '0 2px 8px rgba(8,145,178,0.3)' }}>
              <Plus style={{ width: 14, height: 14 }} /> Crear Ola
            </button>
          </div>
        </div>
      )}

      {/* Wave List */}
      <div className="space-y-3">
        {waves.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', borderRadius: 10,
            border: '1px dashed #99f6e4', background: '#f0fdfa' }}>
            <Waves style={{ width: 40, height: 40, margin: '0 auto 12px', color: '#99f6e4' }} />
            <div style={{ fontSize: 14, fontWeight: 500, color: '#0f766e' }}>Sin olas definidas</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>Haz clic en "Agregar Ola" o usa el Migration Planner</div>
          </div>
        )}

        {waves.map((wave) => {
          const config = statusConfig[wave.status];
          const StatusIcon = config.icon;
          return (
            <div key={wave.id} style={{ borderRadius: 10, overflow: 'hidden',
              border: '1px solid #99f6e4', boxShadow: '0 1px 4px rgba(8,145,178,0.07)' }}>
              <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => handleStatusChange(wave.id)}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 6,
                    padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <StatusIcon style={{ width: 14, height: 14, color: '#fff' }} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>
                      OLA {wave.waveNumber}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{wave.name}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                      {config.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                    {wave.strategy} · {wave.serverCount} servidores · {wave.applicationCount} apps · {wave.startDate} → {wave.endDate}
                  </div>
                </div>
                <button onClick={() => handleRemove(wave.id)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                padding: '8px 16px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: t('migrationWaves.serversLabel'), value: wave.serverCount, icon: '🖥' },
                  { label: t('migrationWaves.appsLabel'), value: wave.applicationCount, icon: '📦' },
                  { label: t('migrationWaves.strategyLabel'), value: wave.strategy, icon: '🎯' },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#0c4a6e' }}>
                    <span>{s.icon}</span>
                    <span style={{ fontWeight: 700, color: '#0f766e' }}>{s.value}</span>
                    <span style={{ color: '#64748b' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      {waves.length > 0 && (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #99f6e4', boxShadow: '0 2px 8px rgba(8,145,178,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '12px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t('migrationWaves.capacityDistribution')}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{t('migrationWaves.serversLabel')} {t('common.and', { defaultValue: 'y' })} {t('migrationWaves.appsLabel')}</div>
          </div>
          <div style={{ padding: '16px', background: '#fff' }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #99f6e4' }} />
                <Bar dataKey="servers" name={t('migrationWaves.serversLabel')} radius={[4,4,0,0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#0f766e" />
                  ))}
                </Bar>
                <Bar dataKey="apps" name={t('migrationWaves.appsLabel')} radius={[4,4,0,0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#0891b2" opacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Gantt Timeline */}
      <WaveGantt waves={waves} />

      {/* Migration Planner Modal */}
      {showPlanner && (
        <MigrationPlanner
          dependencies={dependencyData?.dependencies || []}
          onClose={() => setShowPlanner(false)}
        />
      )}

      {/* Wave Planner Tool Modal */}
      {showWaveTool && (
        <WavePlannerTool
          servers={dependencyData?.servers ?? []}
          onClose={() => setShowWaveTool(false)}
          onWavesUpdate={onWavesChange}
          dependencies={dependencyData?.dependencies ?? []}
          databases={dependencyData?.databases ?? []}
        />
      )}
    </div>
  );
}
