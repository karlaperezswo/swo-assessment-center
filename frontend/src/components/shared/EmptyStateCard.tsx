import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  phaseColor?: 'fuchsia' | 'violet' | 'amber';
}

export function EmptyStateCard({ icon, title, description, phaseColor = 'violet' }: EmptyStateCardProps) {
  const bgStyles = {
    fuchsia: 'from-fuchsia-50 to-white border-fuchsia-200',
    violet: 'from-violet-50 to-white border-violet-200',
    amber: 'from-amber-50 to-white border-amber-200',
  };

  const iconStyles = {
    fuchsia: 'text-fuchsia-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
  };

  return (
    <Card className={cn('border-2 bg-gradient-to-br', bgStyles[phaseColor])}>
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className={cn('mb-4', iconStyles[phaseColor])}>
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 max-w-md">{description}</p>
      </CardContent>
    </Card>
  );
}
