import { useMemo } from 'react';
import { MigrationWave } from '@/types/assessment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarRange } from 'lucide-react';

interface WaveGanttProps {
  waves: MigrationWave[];
}

const STATUS_COLORS: Record<MigrationWave['status'], string> = {
  planned: '#eab308',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  blocked: '#ef4444',
};

export function WaveGantt({ waves }: WaveGanttProps) {
  const { rows, startMs, endMs, monthMarkers } = useMemo(() => computeTimeline(waves), [waves]);

  if (rows.length === 0) {
    return null;
  }

  const totalRange = Math.max(endMs - startMs, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-5 w-5 text-teal-700" />
          Wave timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="relative h-6 border-b border-gray-200 mb-2">
              {monthMarkers.map((m) => {
                const left = ((m.ms - startMs) / totalRange) * 100;
                return (
                  <div
                    key={m.ms}
                    className="absolute top-0 text-[10px] text-gray-500 -translate-x-1/2"
                    style={{ left: `${left}%` }}
                  >
                    <div className="h-2 w-px bg-gray-300 mx-auto mb-0.5" />
                    {m.label}
                  </div>
                );
              })}
            </div>
            <div className="space-y-1">
              {rows.map((row) => {
                const left = ((row.startMs - startMs) / totalRange) * 100;
                const width = Math.max(
                  ((row.endMs - row.startMs) / totalRange) * 100,
                  2
                );
                return (
                  <div key={row.id} className="flex items-center gap-3">
                    <div className="w-40 flex-shrink-0 text-xs text-gray-700 truncate">
                      Wave {row.waveNumber}: {row.name}
                    </div>
                    <div className="relative flex-1 h-6 bg-gray-50 rounded">
                      <div
                        className="absolute top-0 h-6 rounded flex items-center px-2 text-[11px] text-white font-medium"
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                          backgroundColor: STATUS_COLORS[row.status],
                        }}
                        title={`${row.name} · ${row.serverCount} servers · ${row.startDate} → ${row.endDate}`}
                      >
                        {width > 10 ? `${row.serverCount} srv` : ''}
                      </div>
                    </div>
                    <div className="w-24 flex-shrink-0 text-[11px] text-gray-500 text-right">
                      {row.startDate || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineRow {
  id: string;
  waveNumber: number;
  name: string;
  startDate: string;
  endDate: string;
  startMs: number;
  endMs: number;
  serverCount: number;
  status: MigrationWave['status'];
}

function computeTimeline(waves: MigrationWave[]): {
  rows: TimelineRow[];
  startMs: number;
  endMs: number;
  monthMarkers: { ms: number; label: string }[];
} {
  const rows: TimelineRow[] = [];
  waves.forEach((w) => {
    const start = parseDate(w.startDate);
    const end = parseDate(w.endDate);
    if (start === null || end === null) return;
    rows.push({
      id: w.id,
      waveNumber: w.waveNumber,
      name: w.name,
      startDate: w.startDate,
      endDate: w.endDate,
      startMs: start,
      endMs: end >= start ? end : start + 86400000,
      serverCount: w.serverCount,
      status: w.status,
    });
  });

  if (rows.length === 0) {
    return { rows, startMs: 0, endMs: 1, monthMarkers: [] };
  }

  const startMs = Math.min(...rows.map((r) => r.startMs));
  const endMs = Math.max(...rows.map((r) => r.endMs));

  const monthMarkers: { ms: number; label: string }[] = [];
  const cursor = new Date(startMs);
  cursor.setDate(1);
  while (cursor.getTime() <= endMs) {
    monthMarkers.push({
      ms: cursor.getTime(),
      label: cursor.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return { rows, startMs, endMs, monthMarkers };
}

function parseDate(raw: string): number | null {
  if (!raw) return null;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}
