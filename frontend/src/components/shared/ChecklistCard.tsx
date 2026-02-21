import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ChecklistItem } from '@/types/assessment';
import { cn } from '@/lib/utils';

interface ChecklistCardProps {
  title: string;
  icon: React.ReactNode;
  items: ChecklistItem[];
  onItemToggle: (id: string) => void;
  onItemNotesChange: (id: string, notes: string) => void;
  accentColor?: 'violet' | 'fuchsia' | 'amber' | 'blue' | 'green';
}

const priorityStyles = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export function ChecklistCard({ title, icon, items, onItemToggle, onItemNotesChange, accentColor = 'violet' }: ChecklistCardProps) {
  const completedCount = items.filter(i => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const accentStyles = {
    violet: { border: 'border-violet-200', progressBg: 'bg-violet-500', badge: 'bg-violet-100 text-violet-700' },
    fuchsia: { border: 'border-fuchsia-200', progressBg: 'bg-fuchsia-500', badge: 'bg-fuchsia-100 text-fuchsia-700' },
    amber: { border: 'border-amber-200', progressBg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' },
    blue: { border: 'border-blue-200', progressBg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
    green: { border: 'border-green-200', progressBg: 'bg-green-500', badge: 'bg-green-100 text-green-700' },
  };
  const styles = accentStyles[accentColor];

  return (
    <Card className={cn('border-2', styles.border)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', styles.badge)}>
            {completedCount}/{items.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-500', styles.progressBg)}
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              'flex items-start gap-3 p-3 rounded-lg border transition-all',
              item.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            )}
          >
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => onItemToggle(item.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('font-medium text-sm', item.completed && 'line-through text-gray-400')}>
                  {item.title}
                </span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full', priorityStyles[item.priority])}>
                  {item.priority}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              <div className="mt-2">
                <Textarea
                  value={item.notes}
                  onChange={(e) => onItemNotesChange(item.id, e.target.value)}
                  placeholder="Add notes..."
                  className="text-xs min-h-[60px]"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
