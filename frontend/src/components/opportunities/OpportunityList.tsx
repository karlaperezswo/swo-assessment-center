import { Opportunity, OpportunityCategory } from '@shared/types/opportunity.types';
import { OpportunityCard } from './OpportunityCard';

interface OpportunityListProps {
  opportunities: Opportunity[];
  onSelectOpportunity: (opportunity: Opportunity) => void;
}

export function OpportunityList({ opportunities, onSelectOpportunity }: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium mb-2">No se encontraron oportunidades</p>
        <p>Intenta ajustar los filtros de búsqueda</p>
      </div>
    );
  }

  // Group opportunities by category
  const groupedOpportunities = opportunities.reduce((acc, opp) => {
    const category = opp.category || 'Otro';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(opp);
    return acc;
  }, {} as Record<OpportunityCategory, Opportunity[]>);

  // Define category order (Workshop first, then Well-Architected pillars, then others)
  const categoryOrder: OpportunityCategory[] = [
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

  // Sort categories by defined order
  const sortedCategories = Object.keys(groupedOpportunities).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a as OpportunityCategory);
    const indexB = categoryOrder.indexOf(b as OpportunityCategory);
    return indexA - indexB;
  }) as OpportunityCategory[];

  return (
    <div className="space-y-8">
      {sortedCategories.map(category => (
        <div key={category}>
          {/* Category header */}
          <div className="mb-4 pb-2 border-b-2 border-primary">
            <h3 className="text-xl font-bold text-primary">
              {category}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({groupedOpportunities[category].length} {groupedOpportunities[category].length === 1 ? 'oportunidad' : 'oportunidades'})
              </span>
            </h3>
          </div>

          {/* Opportunities grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedOpportunities[category].map(opportunity => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onClick={() => onSelectOpportunity(opportunity)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
