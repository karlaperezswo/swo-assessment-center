import { Opportunity, OpportunityPriority, OpportunityStatus, OpportunityCategory } from '@shared/types/opportunity.types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign } from 'lucide-react';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onClick: () => void;
}

export function OpportunityCard({ opportunity, onClick }: OpportunityCardProps) {
  const isHighValue = opportunity.estimatedARR > 200000;

  const priorityColors: Record<OpportunityPriority, string> = {
    High: 'bg-red-100 text-red-800 border-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-green-100 text-green-800 border-green-300',
  };

  const statusColors: Record<OpportunityStatus, string> = {
    'Nueva': 'bg-blue-100 text-blue-800',
    'En Progreso': 'bg-purple-100 text-purple-800',
    'Ganada': 'bg-green-100 text-green-800',
    'Perdida': 'bg-gray-100 text-gray-800',
    'Descartada': 'bg-red-100 text-red-800',
  };

  const categoryColors: Record<OpportunityCategory, string> = {
    'Workshop': 'bg-indigo-100 text-indigo-800 border-indigo-300',
    'Seguridad': 'bg-red-100 text-red-800 border-red-300',
    'Optimización de Costos': 'bg-green-100 text-green-800 border-green-300',
    'Confiabilidad': 'bg-blue-100 text-blue-800 border-blue-300',
    'Excelencia Operacional': 'bg-purple-100 text-purple-800 border-purple-300',
    'Eficiencia de Rendimiento': 'bg-orange-100 text-orange-800 border-orange-300',
    'Sostenibilidad': 'bg-teal-100 text-teal-800 border-teal-300',
    'Migración': 'bg-cyan-100 text-cyan-800 border-cyan-300',
    'Modernización': 'bg-pink-100 text-pink-800 border-pink-300',
    'Otro': 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow relative"
      onClick={onClick}
    >
      {/* High value indicator */}
      {isHighValue && (
        <div className="absolute top-2 right-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
        </div>
      )}

      {/* Category badge */}
      <div className="mb-2">
        <Badge className={categoryColors[opportunity.category] || categoryColors['Otro']}>
          {opportunity.category}
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-lg mb-2 pr-8">{opportunity.title}</h3>

      {/* Priority and Status badges */}
      <div className="flex gap-2 mb-3">
        <Badge className={priorityColors[opportunity.priority]}>
          {opportunity.priority}
        </Badge>
        <Badge className={statusColors[opportunity.status]}>
          {opportunity.status}
        </Badge>
      </div>

      {/* Estimated ARR */}
      <div className="flex items-center gap-2 text-lg font-bold text-green-600">
        <DollarSign className="h-5 w-5" />
        <span>${opportunity.estimatedARR.toLocaleString()}</span>
        <span className="text-sm font-normal text-muted-foreground">ARR</span>
      </div>

      {/* Reasoning preview */}
      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
        {opportunity.reasoning}
      </p>

      {/* Related services count */}
      <div className="mt-3 text-xs text-muted-foreground">
        {opportunity.relatedServices.length} {opportunity.relatedServices.length === 1 ? 'servicio AWS relacionado' : 'servicios AWS relacionados'}
      </div>
    </Card>
  );
}
