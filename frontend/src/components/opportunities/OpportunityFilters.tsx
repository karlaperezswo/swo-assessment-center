import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { OpportunityFilters as FilterType, OpportunityStatus } from '@shared/types/opportunity.types';
import { Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OpportunityFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  opportunityCount: number;
}

export function OpportunityFilters({ filters, onFiltersChange, opportunityCount }: OpportunityFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handlePriorityChange = (priority: string, checked: boolean) => {
    const currentPriorities = filters.priority || [];
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter((p: string) => p !== priority);
    
    onFiltersChange({ ...filters, priority: newPriorities.length > 0 ? newPriorities : undefined });
  };

  const handleStatusChange = (status: OpportunityStatus, checked: boolean) => {
    const currentStatuses = filters.status || [];
    const newStatuses = checked
      ? [...currentStatuses, status]
      : currentStatuses.filter((s: OpportunityStatus) => s !== status);
    
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchTerm: value || undefined });
  };

  const handleARRChange = (field: 'minARR' | 'maxARR', value: string) => {
    const numValue = value ? parseFloat(value) : undefined;
    onFiltersChange({ ...filters, [field]: numValue });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.priority?.length || filters.status?.length || 
                          filters.minARR !== undefined || filters.maxARR !== undefined ||
                          filters.searchTerm;

  return (
    <Card className="p-4">
      {/* Search bar - always visible */}
      <div className="flex gap-3 items-center mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en oportunidades..."
            value={filters.searchTerm || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
              {[
                filters.priority?.length || 0,
                filters.status?.length || 0,
                filters.minARR !== undefined ? 1 : 0,
                filters.maxARR !== undefined ? 1 : 0
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
          {/* Priority filters */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Prioridad</Label>
            <div className="space-y-2">
              {['High', 'Medium', 'Low'].map(priority => (
                <div key={priority} className="flex items-center space-x-2">
                  <Checkbox
                    id={`priority-${priority}`}
                    checked={filters.priority?.includes(priority) || false}
                    onCheckedChange={(checked) => handlePriorityChange(priority, checked as boolean)}
                  />
                  <label
                    htmlFor={`priority-${priority}`}
                    className="text-sm cursor-pointer"
                  >
                    {priority}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Status filters */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Estado</Label>
            <div className="space-y-2">
              {(['Nueva', 'En Progreso', 'Ganada', 'Perdida', 'Descartada'] as OpportunityStatus[]).map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status) || false}
                    onCheckedChange={(checked) => handleStatusChange(status, checked as boolean)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* ARR range filters */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Rango de ARR</Label>
            <div className="space-y-3">
              <div>
                <Label htmlFor="minARR" className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  id="minARR"
                  type="number"
                  placeholder="$0"
                  value={filters.minARR || ''}
                  onChange={(e) => handleARRChange('minARR', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="maxARR" className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  id="maxARR"
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxARR || ''}
                  onChange={(e) => handleARRChange('maxARR', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clear filters button */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Mostrando {opportunityCount} oportunidades
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}
    </Card>
  );
}
