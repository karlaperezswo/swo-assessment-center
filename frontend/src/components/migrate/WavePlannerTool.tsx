import { useState, useEffect, useCallback } from 'react';
import { X, Download, RefreshCw, Upload, FileSpreadsheet, GripVertical, Info, FileText, Shuffle, Settings } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { MigrationWave } from '@/types/assessment';

// ─── Tipos internos normalizados ────────────────────────────────────────────
type NormalizedEnv = 'DEV' | 'TEST' | 'UAT' | 'PROD' | 'OTHER';
type NormalizedCrit = 'LOW' | 'MEDIUM' | 'HIGH';

interface Server {
  ServerName: string;
  // Valores normalizados internamente
  _env: NormalizedEnv;
  _crit: NormalizedCrit;
  // Valores originales del archivo (para mostrar al usuario)
  Criticidad: string;
  Ambiente: string;
  Ola: string;
  Dependencia?: string;
  // Agrupación lógica detectada por naming
  _appGroup?: string;
  [key: string]: any;
}

interface WaveInfo {
  name: string;
  env: NormalizedEnv;
  crit: NormalizedCrit;
  justification: string;
}

interface WavePlannerToolProps {
  servers: Server[];
  onClose: () => void;
  onWavesUpdate?: (waves: MigrationWave[]) => void;
  dependencies?: { source: string; destination: string; sourceApp?: string; destinationApp?: string; port: number | null; protocol: string }[];
  databases?: { databaseName: string; serverId: string; edition?: string }[];
}

// ─── Orden de ambientes: menor a mayor impacto ───────────────────────────────
const ENV_ORDER: Record<NormalizedEnv, number> = { DEV: 1, TEST: 2, UAT: 3, PROD: 4, OTHER: 5 };
const CRIT_ORDER: Record<NormalizedCrit, number> = { LOW: 1, MEDIUM: 2, HIGH: 3 };

const ENV_LABELS: Record<NormalizedEnv, string> = {
  DEV: 'Desarrollo', TEST: 'Testing/QA', UAT: 'UAT/Pre-Prod', PROD: 'Producción', OTHER: 'Otro'
};
const CRIT_LABELS: Record<NormalizedCrit, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta'
};
const ENV_COLORS: Record<NormalizedEnv, string> = {
  DEV:   'bg-sky-100 text-sky-800 border-sky-300',
  TEST:  'bg-purple-100 text-purple-800 border-purple-300',
  UAT:   'bg-amber-100 text-amber-800 border-amber-300',
  PROD:  'bg-rose-100 text-rose-800 border-rose-300',
  OTHER: 'bg-gray-100 text-gray-700 border-gray-300',
};
const CRIT_COLORS: Record<NormalizedCrit, string> = {
  LOW:    'bg-green-100 text-green-800 border-green-300',
  MEDIUM: 'bg-orange-100 text-orange-800 border-orange-300',
  HIGH:   'bg-red-100 text-red-800 border-red-300',
};

// ─── Normalización de columnas ───────────────────────────────────────────────
function normalizeKey(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_\-\.]/g, '');
}

function findColumn(allColumns: string[], keywords: string[]): string | undefined {
  const kwNorm = keywords.map(normalizeKey);
  // 1. Coincidencia exacta primero
  const exact = allColumns.find(col => kwNorm.includes(normalizeKey(col)));
  if (exact) return exact;
  // 2. Coincidencia parcial: la columna contiene la keyword
  return allColumns.find(col => {
    const cn = normalizeKey(col);
    return kwNorm.some(kw => cn.includes(kw));
  });
}

// ─── Normalización de valores ────────────────────────────────────────────────
function normalizeEnv(raw: string): NormalizedEnv {
  const v = normalizeKey(raw);
  if (/dev|desa|desarrollo/.test(v))                          return 'DEV';
  if (/test|testing|prueba|qa|calidad/.test(v))               return 'TEST';
  if (/uat|preprod|staging|homolog|cert/.test(v))             return 'UAT';
  if (/prod|produccion|production|prd/.test(v))               return 'PROD';
  return 'OTHER';
}

function normalizeCrit(raw: string): NormalizedCrit {
  // trim agresivo: quitar espacios, tabs, saltos de línea y caracteres invisibles
  const v = normalizeKey(String(raw).replace(/\s+/g, '').trim());
  if (/baja|low/.test(v))                          return 'LOW';
  if (/alta|high|critico|critica|critical/.test(v)) return 'HIGH';
  if (/media|medium|med/.test(v))                  return 'MEDIUM';
  // fallback: si no matchea nada conocido, loguear el valor original para diagnóstico
  console.warn(`[WavePlanner] Criticidad no reconocida: "${raw}" → normalizado: "${v}" → asignado MEDIUM`);
  return 'MEDIUM';
}

// ─── Detección de grupo de aplicación por naming ─────────────────────────────
function detectAppGroup(serverName: string): string {
  // Extrae prefijo común: app1-web-01 → app1, srv-garos-01 → srv-garos
  const match = serverName.match(/^([a-zA-Z0-9]+-[a-zA-Z0-9]+)/);
  return match ? match[1].toLowerCase() : serverName.toLowerCase();
}

// ─── Algoritmo principal de asignación de olas ───────────────────────────────
function buildWaves(serverList: Server[]): { servers: Server[]; waveInfos: WaveInfo[] } {
  // Obtener combinaciones ENV+CRIT presentes, ordenadas por ENV_ORDER → CRIT_ORDER
  const combos = new Map<string, { env: NormalizedEnv; crit: NormalizedCrit }>();
  serverList.forEach(s => {
    const key = `${s._env}__${s._crit}`;
    if (!combos.has(key)) combos.set(key, { env: s._env, crit: s._crit });
  });

  const sortedCombos = [...combos.values()].sort((a, b) => {
    const envDiff = ENV_ORDER[a.env] - ENV_ORDER[b.env];
    return envDiff !== 0 ? envDiff : CRIT_ORDER[a.crit] - CRIT_ORDER[b.crit];
  });

  const waveInfos: WaveInfo[] = [];
  const result: Server[] = [];
  let waveCounter = 1;

  sortedCombos.forEach(({ env, crit }) => {
    const group = serverList.filter(s => s._env === env && s._crit === crit);
    if (group.length === 0) return;

    const waveName = `Wave ${waveCounter}`;
    waveInfos.push({
      name: waveName,
      env,
      crit,
      justification: `${ENV_LABELS[env]} · Criticidad ${CRIT_LABELS[crit]} — ${group.length} servidor${group.length !== 1 ? 'es' : ''}`,
    });

    result.push(...group.map(s => ({ ...s, Ola: waveName })));
    waveCounter++;
  });

  return { servers: result, waveInfos };
}

// ─── Componente ──────────────────────────────────────────────────────────────
export function WavePlannerTool({ servers: initialServers, onClose, dependencies = [], databases = [] }: WavePlannerToolProps) {
  const [servers, setServers] = useState<Server[]>([]);
  const [waves, setWaves] = useState<string[]>([]);
  const [waveInfos, setWaveInfos] = useState<WaveInfo[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [draggedServer, setDraggedServer] = useState<Server | null>(null);
  const [dragOverWave, setDragOverWave] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false); // modo reasignación manual

  useEffect(() => {
    if (initialServers && initialServers.length > 0) {
      // initialServers puede llegar como string[] desde dependencyData.servers
      // Convertir a Server[] si es necesario
      const normalized: Server[] = initialServers.map((s: any) => {
        if (typeof s === 'string') {
          return {
            ServerName: s,
            _env: 'PROD' as NormalizedEnv,
            _crit: 'MEDIUM' as NormalizedCrit,
            Criticidad: 'Media',
            Ambiente: 'Producción',
            Ola: '',
            _appGroup: detectAppGroup(s),
          };
        }
        // Ya es un objeto Server válido
        return s;
      }).filter((s: Server) => s.ServerName && typeof s.ServerName === 'string');

      if (normalized.length > 0) {
        const { servers: assigned, waveInfos: infos } = buildWaves(normalized);
        applyWaves(assigned, infos);
      }
    }
  }, [initialServers]);

  const applyWaves = (assigned: Server[], infos: WaveInfo[]) => {
    setServers(assigned);
    setWaveInfos(infos);
    const uniqueWaves = infos.map(w => w.name);
    setWaves(uniqueWaves);
  };

  const reAssign = () => {
    const { servers: assigned, waveInfos: infos } = buildWaves(servers);
    applyWaves(assigned, infos);
    setManualMode(false);
    toast.success('Olas reasignadas automáticamente');
  };

  const toggleManualMode = () => {
    setManualMode(prev => {
      const next = !prev;
      toast(next
        ? '✏️ Modo manual activado — arrastra servidores entre olas'
        : '🔒 Modo manual desactivado',
        { duration: 3000 }
      );
      return next;
    });
  };

  // ── Procesamiento de Excel ─────────────────────────────────────────────────
  const processExcelFile = useCallback((file: File) => {
    setIsLoadingFile(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // Preferir hoja con nombre relacionado a servidores
        const preferredSheets = ['servers', 'server', 'servidores', 'hosts', 'inventory'];
        let sheetName = workbook.SheetNames[0];
        for (const name of preferredSheets) {
          const found = workbook.SheetNames.find(s => s.toLowerCase() === name);
          if (found) { sheetName = found; break; }
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, any>[];

        if (jsonData.length === 0) {
          toast.error('El archivo Excel está vacío', { description: `Hoja: "${sheetName}"`, duration: 6000 });
          setIsLoadingFile(false);
          return;
        }

        // ── Detección de columnas obligatorias ──────────────────────────────
        const allColumns = Object.keys(jsonData[0]);

        const SERVER_KW     = ['nombrears', 'nombreservidor', 'servername', 'hostname', 'servidor', 'server', 'host', 'nombre'];
        const CRITICIDAD_KW = ['criticidad', 'criticality', 'criticity', 'critico', 'critical', 'priority', 'prioridad'];
        const AMBIENTE_KW   = ['ambiente', 'environment', 'entorno', 'env', 'ambientes'];

        const colServer = findColumn(allColumns, SERVER_KW);
        const colCrit   = findColumn(allColumns, CRITICIDAD_KW);
        const colEnv    = findColumn(allColumns, AMBIENTE_KW);

        console.log(`[WavePlanner] Columnas detectadas → Servidor:"${colServer}" | Criticidad:"${colCrit}" | Ambiente:"${colEnv}"`);
        console.log(`[WavePlanner] Todas las columnas:`, allColumns);

        const missing: string[] = [];
        if (!colServer) missing.push('ServerName / Hostname — nombre del servidor');
        if (!colCrit)   missing.push('Criticidad / Criticality — valores: Baja, Media, Alta');
        if (!colEnv)    missing.push('Ambiente / Environment — valores: Dev, Test, UAT, Prod');

        if (missing.length > 0) {
          toast.error('Columnas requeridas no encontradas', {
            description:
              `Columnas faltantes:\n• ${missing.join('\n• ')}\n\n` +
              `Columnas detectadas: ${allColumns.slice(0, 12).join(', ')}${allColumns.length > 12 ? ` (+${allColumns.length - 12} más)` : ''}`,
            duration: 14000,
          });
          setIsLoadingFile(false);
          return;
        }

        // ── Parseo y normalización de valores ───────────────────────────────
        const parsed: Server[] = jsonData
          .map((row, rowIdx) => {
            const rawName = String(row[colServer!] ?? '').trim();

            // Fila sin nombre de servidor → skip silencioso
            if (!rawName) return null;

            const rawCrit = String(row[colCrit!] ?? '').trim();
            const rawEnv  = String(row[colEnv!]  ?? '').trim();
            const dep     = String(row['Dependencia'] || row['Dependencies'] || row['dependencia'] || '').trim();

            const normalizedCrit = normalizeCrit(rawCrit);
            const normalizedEnv  = normalizeEnv(rawEnv);

            // Log de diagnóstico
            console.log(`[WavePlanner] #${rowIdx + 1} "${rawName}" | env:"${rawEnv}"→${normalizedEnv} | crit:"${rawCrit}"→${normalizedCrit}`);

            // IMPORTANTE: construir el objeto con campos normalizados PRIMERO,
            // luego spread de row para conservar columnas extra,
            // y finalmente volver a pisar los campos clave para que no sean sobreescritos
            return {
              ...row,
              ServerName: rawName,
              Criticidad: rawCrit,
              Ambiente:   rawEnv,
              _env:       normalizedEnv,
              _crit:      normalizedCrit,
              _appGroup:  detectAppGroup(rawName),
              Ola:        '',
              Dependencia: dep || undefined,
            } as Server;
          })
          .filter(Boolean) as Server[];

        if (parsed.length === 0) {
          toast.error('No se encontraron servidores válidos', {
            description: `Verifica que la columna "${colServer}" tenga valores.`,
            duration: 6000,
          });
          setIsLoadingFile(false);
          return;
        }

        const { servers: assigned, waveInfos: infos } = buildWaves(parsed);
        applyWaves(assigned, infos);

        toast.success('Archivo cargado exitosamente', {
          description: `${parsed.length} servidores → ${infos.length} olas generadas`,
          duration: 5000,
        });

      } catch (err) {
        console.error('Error procesando Excel:', err);
        toast.error('Error al procesar el archivo');
      } finally {
        setIsLoadingFile(false);
      }
    };

    reader.onerror = () => { toast.error('Error al leer el archivo'); setIsLoadingFile(false); };
    reader.readAsBinaryString(file);
  }, []);

  const onDrop = useCallback((files: File[]) => {
    if (files[0]) processExcelFile(files[0]);
  }, [processExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: isLoadingFile,
  });

  // ── Drag & Drop entre olas ─────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, server: Server) => {
    setDraggedServer(server);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnd = () => { setDraggedServer(null); setDragOverWave(null); };
  const handleDragOver = (e: React.DragEvent, wave: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverWave(wave);
  };
  const handleDragLeave = () => setDragOverWave(null);
  const handleDrop = (e: React.DragEvent, targetWave: string) => {
    e.preventDefault();
    if (draggedServer && draggedServer.Ola !== targetWave) {
      setServers(prev => prev.map(s =>
        s.ServerName === draggedServer.ServerName ? { ...s, Ola: targetWave } : s
      ));
      toast.success(`${draggedServer.ServerName} → ${targetWave}`, { duration: 2000 });
    }
    setDraggedServer(null);
    setDragOverWave(null);
  };

  // ── Exportar CSV ───────────────────────────────────────────────────────────
  const exportToCSV = () => {
    const headers = ['Wave', 'ServerName', 'Ambiente', 'Ambiente (Normalizado)', 'Criticidad', 'Criticidad (Normalizada)', 'Grupo App', 'Dependencia'];
    const rows = servers.map(s => [
      s.Ola, s.ServerName, s.Ambiente, ENV_LABELS[s._env],
      s.Criticidad, CRIT_LABELS[s._crit], s._appGroup || '', s.Dependencia || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'migration_wave_plan.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Exportar PDF ───────────────────────────────────────────────────────────
  const exportToPDF = () => {
    const date = new Date().toLocaleString('es-ES');
    const escape = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const waveBlocks = waves.map(wave => {
      const info = waveInfos.find(w => w.name === wave);
      const waveServers = servers.filter(s => s.Ola === wave);
      const rows = waveServers.map((s, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
          <td>${escape(s.ServerName)}</td>
          <td>${escape(s.Ambiente)}</td>
          <td><span class="badge crit-${s._crit}">${CRIT_LABELS[s._crit]}</span></td>
          <td>${escape(s.Dependencia || '-')}</td>
        </tr>`).join('');

      return `
        <div class="wave-block">
          <div class="wave-header">
            <span class="wave-name">${escape(wave)}</span>
            <span class="wave-meta">${info ? `${ENV_LABELS[info.env]} · Criticidad ${CRIT_LABELS[info.crit]}` : ''} · ${waveServers.length} servidor${waveServers.length !== 1 ? 'es' : ''}</span>
          </div>
          <table>
            <thead><tr><th>Servidor</th><th>Ambiente</th><th>Criticidad</th><th>Dependencia</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const summaryRows = waveInfos.map((info, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td><strong>${escape(info.name)}</strong></td>
        <td>${ENV_LABELS[info.env]}</td>
        <td>${CRIT_LABELS[info.crit]}</td>
        <td style="text-align:center">${stats[info.name]?.total || 0}</td>
        <td>${escape(info.justification)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Plan de Migración por Olas</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1f2937; padding: 28px 36px; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%); color: white; padding: 16px 20px; border-radius: 6px; margin-bottom: 20px; }
    .header h1 { font-size: 18px; margin-bottom: 4px; }
    .header p  { font-size: 10px; opacity: 0.85; }
    h2 { font-size: 13px; color: #0f766e; border-bottom: 2px solid #99f6e4; padding-bottom: 4px; margin: 20px 0 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
    thead tr { background: linear-gradient(90deg, #0f766e, #0891b2); color: white; }
    th { padding: 7px 10px; text-align: left; font-size: 10px; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 10px; vertical-align: top; }
    tr:nth-child(even) td { background: #f0fdfa; }
    .wave-block { margin-bottom: 24px; page-break-inside: avoid; }
    .wave-header { display: flex; align-items: center; gap: 12px; background: linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
    .wave-name { font-weight: bold; font-size: 13px; color: #fff; }
    .wave-meta { font-size: 10px; color: rgba(255,255,255,0.8); }
    .badge { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .crit-LOW    { background: #dcfce7; color: #166534; }
    .crit-MEDIUM { background: #ffedd5; color: #9a3412; }
    .crit-HIGH   { background: #fee2e2; color: #991b1b; }
    .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
    @media print { body { padding: 15px 20px; } tr { page-break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Plan de Migración por Olas — AWS MAP</h1>
    <p>Generado: ${date} &nbsp;|&nbsp; ${servers.length} servidores &nbsp;|&nbsp; ${waves.length} olas</p>
  </div>

  <h2>Resumen Ejecutivo</h2>
  <table>
    <thead><tr><th>Ola</th><th>Ambiente</th><th>Criticidad</th><th style="text-align:center">Servidores</th><th>Justificación</th></tr></thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Detalle por Ola</h2>
  ${waveBlocks}

  <div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_migracion_olas_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF generado', { description: 'Abre el archivo y usa Ctrl+P para imprimir como PDF', duration: 6000 });
  };

  // ── Exportar Word ─────────────────────────────────────────────────────────
  const exportToWord = () => {
    const date = new Date().toLocaleString('es-ES');
    const fileDate = new Date().toISOString().split('T')[0];
    const escape = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const waveBlocks = waves.map(wave => {
      const info = waveInfos.find(w => w.name === wave);
      const waveServers = servers.filter(s => s.Ola === wave);
      const rows = waveServers.map((s, i) => {
        const bg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
        const critColor = s._crit === 'HIGH' ? '#991b1b' : s._crit === 'MEDIUM' ? '#9a3412' : '#166534';
        const critBg    = s._crit === 'HIGH' ? '#fee2e2' : s._crit === 'MEDIUM' ? '#ffedd5' : '#dcfce7';
        const envColor  = s._env === 'PROD' ? '#991b1b' : s._env === 'UAT' ? '#92400e' : s._env === 'TEST' ? '#1e40af' : '#065f46';
        const envBg     = s._env === 'PROD' ? '#fee2e2' : s._env === 'UAT' ? '#fef3c7' : s._env === 'TEST' ? '#dbeafe' : '#d1fae5';
        const { apps, dbs } = getServerAssets(s.ServerName);
        return `<tr style="background:${bg}">
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;font-weight:600;color:#0f172a">${escape(s.ServerName)}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;text-align:center">
            <span style="background:${envBg};color:${envColor};border-radius:4px;padding:2px 7px;font-size:8pt;font-weight:700">${ENV_LABELS[s._env]}</span>
          </td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;text-align:center">
            <span style="background:${critBg};color:${critColor};border-radius:4px;padding:2px 7px;font-size:8pt;font-weight:700">${CRIT_LABELS[s._crit]}</span>
          </td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#475569">${apps.length > 0 ? apps.join(', ') : '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#475569">${dbs.length > 0 ? dbs.map(d => d.databaseName).join(', ') : '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#64748b">${escape(s.Dependencia || '—')}</td>
        </tr>`;
      }).join('');

      return `
        <div style="margin-bottom:20px;page-break-inside:avoid">
          <div style="background:linear-gradient(135deg,#0f766e 0%,#0891b2 60%,#0284c7 100%);padding:10px 16px;border-radius:6px 6px 0 0;display:flex;align-items:center;gap:12px">
            <span style="font-weight:700;font-size:13pt;color:#fff">${escape(wave)}</span>
            <span style="font-size:9pt;color:rgba(255,255,255,0.8)">${info ? `${ENV_LABELS[info.env]} · Criticidad ${CRIT_LABELS[info.crit]}` : ''} · ${waveServers.length} servidor${waveServers.length !== 1 ? 'es' : ''}</span>
          </div>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:linear-gradient(90deg,#0f766e,#0891b2)">
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Servidor</th>
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Ambiente</th>
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Criticidad</th>
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Aplicaciones</th>
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Bases de Datos</th>
                <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Dependencia</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>`;
    }).join('');

    const summaryRows = waveInfos.map((info, i) => {
      const waveStats = getStats();
      const s = waveStats[info.name] || { total: 0, low: 0, medium: 0, high: 0 };
      const bg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
      return `<tr style="background:${bg}">
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-weight:700;font-size:9pt;color:#0f766e">${escape(info.name)}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt">${ENV_LABELS[info.env]}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt">${CRIT_LABELS[info.crit]}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt;text-align:center;font-weight:700;color:#0f766e">${s.total}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#166534">${s.low}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#9a3412">${s.medium}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#991b1b">${s.high}</td>
        <td style="padding:7px 10px;border:1px solid #e2e8f0;font-size:9pt;color:#475569">${escape(info.justification)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8">
  <title>Plan de Migración por Olas</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->
  <style>
    @page { size: A4 landscape; margin: 1.5cm 2cm; }
    body { font-family: Calibri, Arial, sans-serif; font-size: 10pt; color: #1f2937; margin: 0; }
    .header { background: linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%); color: #fff; padding: 18px 22px 14px; margin-bottom: 16px; border-radius: 4px; }
    .header h1 { margin: 0 0 4px; font-size: 18pt; font-weight: bold; }
    .header p  { margin: 2px 0; font-size: 9pt; opacity: .85; }
    .stats { display: table; width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 16px; }
    .stat  { display: table-cell; background: #f0fdfa; border: 1px solid #99f6e4; padding: 10px 14px; text-align: center; border-radius: 6px; }
    .stat .n { font-size: 20pt; font-weight: bold; color: #0f766e; display: block; }
    .stat .l { font-size: 8pt; color: #0891b2; }
    h2 { color: #0f766e; font-size: 12pt; border-bottom: 2px solid #99f6e4; padding-bottom: 4px; margin: 18px 0 8px; }
    .footer { margin-top: 24px; text-align: center; color: #9ca3af; font-size: 8pt; border-top: 1px solid #e5e7eb; padding-top: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>AWS MAP Wave Planner</h1>
    <p>Plan de Migración por Olas — SoftwareOne</p>
    <p>Generado: ${date} &nbsp;|&nbsp; ${servers.length} servidores &nbsp;|&nbsp; ${waves.length} olas</p>
  </div>

  <div class="stats">
    <div class="stat"><span class="n">${servers.length}</span><span class="l">Servidores</span></div>
    <div class="stat"><span class="n">${waves.length}</span><span class="l">Olas</span></div>
    <div class="stat"><span class="n">${waveInfos.filter(w => w.env === 'PROD').length}</span><span class="l">Olas Producción</span></div>
    <div class="stat"><span class="n">${servers.filter(s => s._crit === 'HIGH').length}</span><span class="l">Alta Criticidad</span></div>
  </div>

  <h2>Resumen Ejecutivo</h2>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:linear-gradient(90deg,#0f766e,#0891b2)">
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Ola</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Ambiente</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Criticidad</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:center;border:1px solid rgba(255,255,255,0.2)">Total</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:center;border:1px solid rgba(255,255,255,0.2)">Baja</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:center;border:1px solid rgba(255,255,255,0.2)">Media</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:center;border:1px solid rgba(255,255,255,0.2)">Alta</th>
        <th style="padding:7px 10px;color:#fff;font-size:9pt;text-align:left;border:1px solid rgba(255,255,255,0.2)">Justificación</th>
      </tr>
    </thead>
    <tbody>${summaryRows}</tbody>
  </table>

  <h2>Detalle por Ola</h2>
  ${waveBlocks}

  <div class="footer">© ${new Date().getFullYear()} SoftwareOne – AWS Migration Assessment Platform</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_migracion_olas_${fileDate}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Word generado', { description: 'El archivo .doc se ha descargado correctamente', duration: 4000 });
  };

  // ── Stats por ola ──────────────────────────────────────────────────────────
  const getStats = () => {
    const stats: Record<string, { total: number; low: number; medium: number; high: number }> = {};
    servers.forEach(s => {
      if (!stats[s.Ola]) stats[s.Ola] = { total: 0, low: 0, medium: 0, high: 0 };
      stats[s.Ola].total++;
      if (s._crit === 'LOW')    stats[s.Ola].low++;
      if (s._crit === 'MEDIUM') stats[s.Ola].medium++;
      if (s._crit === 'HIGH')   stats[s.Ola].high++;
    });
    return stats;
  };

  const stats = getStats();

  // ── Apps & DBs per server (from dependency data) ───────────────────────────
  const getServerAssets = (serverName: string | undefined) => {
    if (!serverName) return { apps: [], dbs: [] };
    const srvLower = serverName.toLowerCase();
    // Apps: collect sourceApp/destinationApp from dependencies involving this server
    const apps = new Set<string>();
    dependencies.forEach(dep => {
      if (dep.source.toLowerCase() === srvLower && dep.sourceApp) apps.add(dep.sourceApp);
      if (dep.destination.toLowerCase() === srvLower && dep.destinationApp) apps.add(dep.destinationApp);
    });
    // DBs: databases whose serverId matches this server
    const dbs = databases.filter(db => db.serverId.toLowerCase() === srvLower);
    return { apps: [...apps], dbs };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)',
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px', display: 'flex', alignItems: 'center' }}>
              <Settings style={{ width: 20, height: 20, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>🚀 AWS MAP Wave Planner</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Planificación automática · DEV → TEST/UAT → PROD · Baja → Media → Alta
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 8, padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">

          {/* Upload */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #99f6e4', boxShadow: '0 2px 8px rgba(8,145,178,0.08)' }}>
            <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '12px 20px',
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '5px', display: 'flex', alignItems: 'center' }}>
                <FileSpreadsheet style={{ width: 16, height: 16, color: '#fff' }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Cargar Archivo Excel</div>
            </div>
            <div style={{ padding: '16px 20px', background: '#fff' }}>
              <div {...getRootProps()} style={{
                border: `2px dashed ${isDragActive ? '#0f766e' : '#99f6e4'}`,
                borderRadius: 8, padding: '24px', textAlign: 'center', cursor: isLoadingFile ? 'not-allowed' : 'pointer',
                background: isDragActive ? '#f0fdfa' : '#f8fafc', transition: 'all 0.2s',
                opacity: isLoadingFile ? 0.5 : 1
              }}>
                <input {...getInputProps()} />
                <Upload style={{ width: 36, height: 36, margin: '0 auto 10px', color: '#0891b2' }} />
                {isLoadingFile ? (
                  <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 500 }}>Procesando archivo...</div>
                ) : isDragActive ? (
                  <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 500 }}>Suelta el archivo aquí</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 13, color: '#0f766e', fontWeight: 500, marginBottom: 4 }}>
                      Arrastra un archivo Excel o haz clic para seleccionar
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Formatos: .xlsx · .xls</div>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                border: '1px solid #99f6e4', borderRadius: 8, fontSize: 11, color: '#0c4a6e' }}>
                <div style={{ fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Info style={{ width: 13, height: 13 }} /> Columnas requeridas (se detectan automáticamente):
                </div>
                <ul style={{ listStyle: 'disc', paddingLeft: 18, lineHeight: 1.8 }}>
                  <li><span style={{ fontWeight: 600 }}>ServerName / Hostname</span> — nombre del servidor</li>
                  <li><span style={{ fontWeight: 600 }}>Criticidad / Criticality</span> — Baja · Media · Alta</li>
                  <li><span style={{ fontWeight: 600 }}>Ambiente / Environment</span> — Dev · Test · UAT · Prod</li>
                </ul>
                <div style={{ marginTop: 6, color: '#0891b2' }}>
                  Las olas se generan: <strong>DEV → TEST → UAT → PROD</strong>, dentro de cada ambiente: <strong>Baja → Media → Alta</strong>
                </div>
              </div>
            </div>
          </div>

          {servers.length > 0 && (
            <>
              {/* Wave columns */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f766e' }}>📦 Olas de Migración</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={toggleManualMode}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                        background: manualMode ? 'linear-gradient(90deg, #d97706, #b45309)' : '#f1f5f9',
                        color: manualMode ? '#fff' : '#475569',
                        boxShadow: manualMode ? '0 2px 8px rgba(217,119,6,0.3)' : 'none' }}>
                      <Shuffle style={{ width: 12, height: 12 }} />
                      {manualMode ? 'Modo Manual ON' : 'Reasignación Manual'}
                    </button>
                    <button onClick={reAssign}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 7,
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid #99f6e4',
                        background: '#f0fdfa', color: '#0f766e' }}>
                      <RefreshCw style={{ width: 12, height: 12 }} /> Reasignar Auto
                    </button>
                  </div>
                </div>
                {manualMode && (
                  <div style={{ marginBottom: 10, padding: '8px 14px', background: '#fffbeb',
                    border: '1px solid #fcd34d', borderRadius: 7, fontSize: 11, color: '#92400e' }}>
                    ✏️ Modo manual activo — arrastra los servidores entre olas para reorganizarlos
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {waves.map((wave, waveIdx) => {
                    const info = waveInfos.find(w => w.name === wave);
                    const waveServersData = servers.filter(s => s.Ola === wave);
                    const isOver = dragOverWave === wave;
                    // Wave accent colors cycling through teal shades
                    const waveAccents = [
                      { from: '#0f766e', to: '#0891b2' },
                      { from: '#0891b2', to: '#0284c7' },
                      { from: '#0284c7', to: '#0369a1' },
                      { from: '#0369a1', to: '#1d4ed8' },
                    ];
                    const accent = waveAccents[waveIdx % waveAccents.length];

                    return (
                      <div key={wave}
                        onDragOver={(e) => manualMode && handleDragOver(e, wave)}
                        onDragLeave={() => manualMode && handleDragLeave()}
                        onDrop={(e) => manualMode && handleDrop(e, wave)}
                        style={{
                          borderRadius: 12, overflow: 'hidden', transition: 'all 0.2s',
                          border: isOver && manualMode ? `2px solid ${accent.from}` : '1px solid #99f6e4',
                          background: '#fff',
                          boxShadow: isOver && manualMode
                            ? '0 8px 24px rgba(8,145,178,0.22)'
                            : '0 2px 10px rgba(8,145,178,0.09)',
                          outline: manualMode ? '2px solid #fcd34d' : 'none',
                        }}>

                        {/* Wave header */}
                        <div style={{ background: `linear-gradient(135deg, ${accent.from} 0%, ${accent.to} 100%)`, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, width: 32, height: 32,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 800, color: '#fff' }}>
                                {waveIdx + 1}
                              </div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{wave}</div>
                                {info && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>{info.justification}</div>}
                              </div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '3px 10px',
                              fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
                              {waveServersData.length} srv
                            </div>
                          </div>
                          {/* Env + Crit badges */}
                          {info && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${ENV_COLORS[info.env]}`}>
                                {ENV_LABELS[info.env]}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${CRIT_COLORS[info.crit]}`}>
                                Criticidad {CRIT_LABELS[info.crit]}
                              </span>
                            </div>
                          )}
                          {/* Mini stats */}
                          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                              {stats[wave]?.low || 0} Baja
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fb923c', display: 'inline-block' }} />
                              {stats[wave]?.medium || 0} Media
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                              {stats[wave]?.high || 0} Alta
                            </span>
                          </div>
                        </div>

                        {/* Server cards */}
                        <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
                          {waveServersData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '28px 8px', color: '#94a3b8', fontSize: 11,
                              border: '1px dashed #e2e8f0', borderRadius: 8, margin: '4px' }}>
                              Arrastra servidores aquí
                            </div>
                          ) : (
                            waveServersData.map((server, idx) => {
                              const { apps, dbs } = getServerAssets(server.ServerName);
                              return (
                                <div key={idx}
                                  draggable={manualMode}
                                  onDragStart={(e) => manualMode && handleDragStart(e, server)}
                                  onDragEnd={handleDragEnd}
                                  style={{
                                    background: draggedServer?.ServerName === server.ServerName ? '#f0fdfa' : '#f8fafc',
                                    border: '1px solid #e2e8f0', borderRadius: 9, padding: '10px 12px',
                                    cursor: manualMode ? 'move' : 'default', transition: 'all 0.15s',
                                    opacity: draggedServer?.ServerName === server.ServerName ? 0.45 : 1,
                                    boxShadow: manualMode ? '0 1px 6px rgba(8,145,178,0.10)' : 'none',
                                  }}>
                                  {/* Server name row */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                                    {manualMode && <GripVertical style={{ width: 13, height: 13, color: '#cbd5e1', flexShrink: 0 }} />}
                                    <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                      background: `linear-gradient(135deg, ${accent.from}22, ${accent.to}33)`,
                                      border: `1px solid ${accent.from}44`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                                      🖥
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a',
                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        title={server.ServerName}>
                                        {server.ServerName}
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 3 }}>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${CRIT_COLORS[server._crit]}`}>
                                          {CRIT_LABELS[server._crit]}
                                        </span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-full border ${ENV_COLORS[server._env]}`}>
                                          {server.Ambiente || ENV_LABELS[server._env]}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Applications */}
                                  {apps.length > 0 && (
                                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0' }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: '#0891b2', textTransform: 'uppercase',
                                        letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        📦 Aplicaciones ({apps.length})
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {apps.slice(0, 4).map((app, ai) => (
                                          <span key={ai} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                            background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd',
                                            fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap', display: 'inline-block' }} title={app}>
                                            {app}
                                          </span>
                                        ))}
                                        {apps.length > 4 && (
                                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                            background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                            +{apps.length - 4}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Databases */}
                                  {dbs.length > 0 && (
                                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: apps.length > 0 ? 'none' : '1px solid #e2e8f0' }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase',
                                        letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        🗄 Bases de Datos ({dbs.length})
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                                        {dbs.slice(0, 4).map((db, di) => (
                                          <span key={di} style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                            background: '#f3e8ff', color: '#7c3aed', border: '1px solid #e9d5ff',
                                            fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap', display: 'inline-block' }} title={db.databaseName}>
                                            {db.databaseName}
                                          </span>
                                        ))}
                                        {dbs.length > 4 && (
                                          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5,
                                            background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                            +{dbs.length - 4}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Dependency */}
                                  {server.Dependencia && (
                                    <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #e2e8f0',
                                      fontSize: 10, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <span style={{ color: '#0891b2' }}>→</span>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        title={server.Dependencia}>{server.Dependencia}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Wave footer */}
                        <div style={{ padding: '8px 14px', background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
                          borderTop: '1px solid #99f6e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: '#0891b2', fontWeight: 600 }}>
                            {waveServersData.reduce((s, srv) => s + getServerAssets(srv.ServerName).apps.length, 0)} apps ·{' '}
                            {waveServersData.reduce((s, srv) => s + getServerAssets(srv.ServerName).dbs.length, 0)} BDs
                          </span>
                          <span style={{ fontSize: 10, color: '#64748b' }}>
                            {waveServersData.length} servidor{waveServersData.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Summary table */}
              <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #99f6e4', boxShadow: '0 2px 8px rgba(8,145,178,0.08)' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0891b2 60%, #0284c7 100%)', padding: '12px 20px' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>📊 Resumen de Planificación</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>Distribución de servidores por ola, ambiente y criticidad</div>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        {['Ola', 'Ambiente', 'Criticidad', 'Servidores', 'Justificación'].map((h, hi) => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: hi === 3 ? 'center' : 'left',
                            fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap',
                            background: 'linear-gradient(90deg, #0f766e 0%, #0891b2 55%, #0284c7 100%)',
                            position: 'sticky', top: 0, zIndex: 10, borderBottom: '2px solid rgba(255,255,255,0.2)' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {waveInfos.map((info, i) => {
                        const rowBg = i % 2 === 0 ? '#ffffff' : '#f0fdfa';
                        return (
                          <tr key={info.name} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background 0.1s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#ccfbf1')}
                            onMouseLeave={e => (e.currentTarget.style.background = rowBg)}>
                            <td style={{ padding: '7px 14px', fontWeight: 700, color: '#0f766e' }}>{info.name}</td>
                            <td style={{ padding: '7px 14px' }}>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${ENV_COLORS[info.env]}`}>
                                {ENV_LABELS[info.env]}
                              </span>
                            </td>
                            <td style={{ padding: '7px 14px' }}>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${CRIT_COLORS[info.crit]}`}>
                                {CRIT_LABELS[info.crit]}
                              </span>
                            </td>
                            <td style={{ padding: '7px 14px', textAlign: 'center' }}>
                              <span style={{ fontWeight: 700, fontSize: 12, background: '#ccfbf1', color: '#0f766e',
                                border: '1px solid #99f6e4', borderRadius: 999, padding: '2px 10px' }}>
                                {stats[info.name]?.total || 0}
                              </span>
                            </td>
                            <td style={{ padding: '7px 14px', fontSize: 11, color: '#475569' }}>{info.justification}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {servers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
              <FileSpreadsheet style={{ width: 56, height: 56, margin: '0 auto 14px', color: '#99f6e4' }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f766e', marginBottom: 6 }}>
                Carga un archivo Excel para comenzar
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                Las olas se generan automáticamente según ambiente y criticidad
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
          padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 12, color: '#0891b2', fontWeight: 500 }}>
            {servers.length > 0
              ? `${servers.length} servidores · ${waves.length} olas`
              : 'Carga un archivo Excel para comenzar'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: '1px solid #e2e8f0', background: '#fff', color: '#475569' }}>
              Cerrar
            </button>
            <button onClick={exportToPDF} disabled={servers.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: servers.length === 0 ? 'not-allowed' : 'pointer',
                border: 'none', background: servers.length === 0 ? '#f1f5f9' : 'linear-gradient(90deg, #0f766e 0%, #0891b2 100%)',
                color: servers.length === 0 ? '#94a3b8' : '#fff',
                boxShadow: servers.length === 0 ? 'none' : '0 2px 8px rgba(8,145,178,0.3)' }}>
              <FileText style={{ width: 14, height: 14 }} /> Exportar PDF
            </button>
            <button onClick={exportToWord} disabled={servers.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: servers.length === 0 ? 'not-allowed' : 'pointer',
                border: 'none', background: servers.length === 0 ? '#f1f5f9' : 'linear-gradient(90deg, #0891b2 0%, #0284c7 100%)',
                color: servers.length === 0 ? '#94a3b8' : '#fff',
                boxShadow: servers.length === 0 ? 'none' : '0 2px 8px rgba(8,145,178,0.3)' }}>
              <FileText style={{ width: 14, height: 14 }} /> Exportar Word
            </button>
            <button onClick={exportToCSV} disabled={servers.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: servers.length === 0 ? 'not-allowed' : 'pointer',
                border: 'none', background: servers.length === 0 ? '#f1f5f9' : 'linear-gradient(90deg, #0891b2 0%, #0284c7 100%)',
                color: servers.length === 0 ? '#94a3b8' : '#fff',
                boxShadow: servers.length === 0 ? 'none' : '0 2px 8px rgba(8,145,178,0.3)' }}>
              <Download style={{ width: 14, height: 14 }} /> Exportar CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
