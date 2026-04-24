import { BriefingSession, ImmersionDayPlan } from '@/types/assessment';

interface IcsEventInput {
  uid: string;
  title: string;
  description?: string;
  dateISO: string;
  durationHours?: number;
  category?: string;
  status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED';
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatIcsDate(d: Date): string {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function buildEvent(event: IcsEventInput): string[] {
  const start = new Date(event.dateISO);
  if (!Number.isFinite(start.getTime())) return [];
  const end = new Date(start.getTime() + (event.durationHours ?? 1) * 3600 * 1000);
  const now = new Date();
  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    event.description ? `DESCRIPTION:${escapeIcs(event.description)}` : '',
    event.category ? `CATEGORIES:${escapeIcs(event.category)}` : '',
    `STATUS:${event.status ?? 'CONFIRMED'}`,
    'END:VEVENT',
  ].filter(Boolean);
}

export function buildIcsCalendar(events: IcsEventInput[]): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SWO Assessment Center//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap(buildEvent),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function briefingsToIcs(sessions: BriefingSession[]): string {
  const events: IcsEventInput[] = sessions
    .filter((s) => s.date)
    .map((s) => ({
      uid: `briefing-${s.id}@swo-assessment-center`,
      title: `[${s.type}] ${s.title || 'Untitled'}`,
      description: s.notes,
      dateISO: s.date,
      durationHours: s.type === 'deep-dive' ? 4 : 2,
      category: 'Briefing',
      status: s.status === 'cancelled' ? 'CANCELLED' : s.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE',
    }));
  return buildIcsCalendar(events);
}

export function immersionDaysToIcs(plans: ImmersionDayPlan[]): string {
  const events: IcsEventInput[] = plans
    .filter((p) => p.date)
    .map((p) => ({
      uid: `immersion-${p.id}@swo-assessment-center`,
      title: `[Immersion] ${p.topic}`,
      description: [
        p.objectives.length ? `Objectives:\n- ${p.objectives.join('\n- ')}` : '',
        p.deliverables.length ? `Deliverables:\n- ${p.deliverables.join('\n- ')}` : '',
      ]
        .filter(Boolean)
        .join('\n\n'),
      dateISO: p.date,
      durationHours: parseDurationHours(p.duration) ?? 8,
      category: 'Immersion Day',
      status: p.status === 'completed' ? 'CONFIRMED' : 'TENTATIVE',
    }));
  return buildIcsCalendar(events);
}

function parseDurationHours(duration: string): number | null {
  if (!duration) return null;
  const match = duration.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
