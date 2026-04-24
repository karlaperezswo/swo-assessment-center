import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  OpportunityDraft,
  createEmptyDraft,
} from '@/lib/manualOpportunities';
import { OpportunityCategory, OpportunityPriority, OpportunityStatus } from '@shared/types/opportunity.types';

interface OpportunityEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: OpportunityDraft;
  onSubmit: (draft: OpportunityDraft) => void;
  mode: 'create' | 'edit';
}

const CATEGORIES: OpportunityCategory[] = [
  'Workshop',
  'Seguridad',
  'Optimización de Costos',
  'Confiabilidad',
  'Excelencia Operacional',
  'Eficiencia de Rendimiento',
  'Sostenibilidad',
  'Migración',
  'Modernización',
  'Otro',
];

const PRIORITIES: OpportunityPriority[] = ['High', 'Medium', 'Low'];
const STATUSES: OpportunityStatus[] = ['Nueva', 'En Progreso', 'Ganada', 'Perdida', 'Descartada'];

export function OpportunityEditDialog({ open, onOpenChange, initial, onSubmit, mode }: OpportunityEditDialogProps) {
  const [draft, setDraft] = useState<OpportunityDraft>(initial ?? createEmptyDraft());

  useEffect(() => {
    if (open) setDraft(initial ?? createEmptyDraft());
  }, [open, initial]);

  const update = <K extends keyof OpportunityDraft>(key: K, value: OpportunityDraft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const parseLines = (value: string): string[] =>
    value
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

  const handleSubmit = () => {
    if (!draft.title.trim()) return;
    onSubmit(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva oportunidad' : 'Editar oportunidad'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="opp-title">Título *</Label>
            <Input
              id="opp-title"
              value={draft.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="p. ej. Workshop de Landing Zone"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="opp-category">Categoría</Label>
              <select
                id="opp-category"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={draft.category}
                onChange={(e) => update('category', e.target.value as OpportunityCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="opp-priority">Prioridad</Label>
              <select
                id="opp-priority"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={draft.priority}
                onChange={(e) => update('priority', e.target.value as OpportunityPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="opp-arr">ARR estimado (USD)</Label>
              <Input
                id="opp-arr"
                type="number"
                min={0}
                step={1000}
                value={draft.estimatedARR}
                onChange={(e) => update('estimatedARR', Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="opp-status">Estado</Label>
              <select
                id="opp-status"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={draft.status}
                onChange={(e) => update('status', e.target.value as OpportunityStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="opp-reasoning">Razonamiento</Label>
            <Textarea
              id="opp-reasoning"
              value={draft.reasoning}
              onChange={(e) => update('reasoning', e.target.value)}
              rows={3}
              placeholder="Por qué es una oportunidad para este cliente"
            />
          </div>

          <div>
            <Label htmlFor="opp-evidence">Evidencia (una por línea)</Label>
            <Textarea
              id="opp-evidence"
              value={draft.evidence.join('\n')}
              onChange={(e) => update('evidence', parseLines(e.target.value))}
              rows={3}
              placeholder="- 12 servidores con SQL 2008&#10;- MPA indica uso mensual alto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="opp-talking">Talking points</Label>
              <Textarea
                id="opp-talking"
                value={draft.talkingPoints.join('\n')}
                onChange={(e) => update('talkingPoints', parseLines(e.target.value))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="opp-next">Próximos pasos</Label>
              <Textarea
                id="opp-next"
                value={draft.nextSteps.join('\n')}
                onChange={(e) => update('nextSteps', parseLines(e.target.value))}
                rows={3}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="opp-services">Servicios relacionados (una por línea)</Label>
            <Textarea
              id="opp-services"
              value={draft.relatedServices.join('\n')}
              onChange={(e) => update('relatedServices', parseLines(e.target.value))}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={!draft.title.trim()}>
            {mode === 'create' ? 'Crear' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
