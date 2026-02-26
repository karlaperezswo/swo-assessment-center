import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { OpportunityList } from './OpportunityList';
import { OpportunityFilters } from './OpportunityFilters';
import { OpportunityDetail } from './OpportunityDetail';
import { ExportButton } from './ExportButton';
import { Opportunity, OpportunityFilters as FilterType } from '@shared/types/opportunity.types';
import apiClient from '@/lib/api';
import { Loader2, AlertCircle, Upload, FileText } from 'lucide-react';

interface OpportunityDashboardProps {
  sessionId: string | null;
  onSessionIdChange?: (sessionId: string) => void;
}

export function OpportunityDashboard({ sessionId }: OpportunityDashboardProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [filters, setFilters] = useState<FilterType>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load opportunities when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadOpportunities();
    }
  }, [sessionId]);

  // Apply filters when opportunities or filters change
  useEffect(() => {
    applyFilters();
  }, [opportunities, filters]);

  const loadOpportunities = async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/opportunities/list', {
        params: { sessionId }
      });

      if (response.data.success) {
        setOpportunities(response.data.data.opportunities);
      } else {
        setError(response.data.error || 'Error al cargar oportunidades');
      }
    } catch (err: any) {
      console.error('Error loading opportunities:', err);
      setError(err.response?.data?.error || 'Error al cargar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(opp => filters.priority!.includes(opp.priority));
    }

    // ARR range filter
    if (filters.minARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR >= filters.minARR!);
    }
    if (filters.maxARR !== undefined) {
      filtered = filtered.filter(opp => opp.estimatedARR <= filters.maxARR!);
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(opp => filters.status!.includes(opp.status));
    }

    // Search filter
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.title.toLowerCase().includes(searchLower) ||
        opp.reasoning.toLowerCase().includes(searchLower) ||
        opp.talkingPoints.some((tp: string) => tp.toLowerCase().includes(searchLower))
      );
    }

    setFilteredOpportunities(filtered);
  };

  const handleStatusUpdate = async (opportunityId: string, newStatus: string) => {
    try {
      const response = await apiClient.patch(`/api/opportunities/${opportunityId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        // Update local state
        setOpportunities(prev =>
          prev.map(opp => opp.id === opportunityId ? response.data.data : opp)
        );
        
        // Update selected opportunity if it's the one being updated
        if (selectedOpportunity?.id === opportunityId) {
          setSelectedOpportunity(response.data.data);
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  if (!sessionId) {
    return (
      <div className="space-y-6">
        <Card className="p-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-6 flex justify-center gap-4">
              <div className="p-4 bg-white rounded-full shadow-md">
                <Upload className="h-8 w-8 text-blue-600" />
              </div>
              <div className="p-4 bg-white rounded-full shadow-md">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Análisis de Oportunidades con IA
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              Para generar oportunidades de venta, completa los siguientes pasos:
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sube el archivo MPA Excel</p>
                  <p className="text-sm text-gray-600">En la pestaña "Descubrimiento Rápido"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sube el archivo MRA PDF (opcional)</p>
                  <p className="text-sm text-gray-600">Debajo del MPA en "Descubrimiento Rápido"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                  2.5
                </div>
                <div>
                  <p className="font-medium text-gray-900">Sube el Cuestionario de Infraestructura (opcional)</p>
                  <p className="text-sm text-gray-600">Debajo del MRA en "Descubrimiento Rápido" - Mejora el análisis</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Completa el formulario de cliente</p>
                  <p className="text-sm text-gray-600">Información básica del cliente</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">Haz clic en "Completar Assess Phase"</p>
                  <p className="text-sm text-gray-600">El análisis con AWS Bedrock se ejecutará automáticamente</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Si no subes el archivo MRA, el sistema funcionará normalmente pero no generará oportunidades de venta con IA.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Cargando oportunidades...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-destructive">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Error</p>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Oportunidades de Venta</h2>
          <p className="text-muted-foreground">
            {filteredOpportunities.length} de {opportunities.length} oportunidades
          </p>
        </div>
        <ExportButton sessionId={sessionId} />
      </div>

      {/* Filters */}
      <OpportunityFilters
        filters={filters}
        onFiltersChange={setFilters}
        opportunityCount={filteredOpportunities.length}
      />

      {/* Opportunity List */}
      <OpportunityList
        opportunities={filteredOpportunities}
        onSelectOpportunity={setSelectedOpportunity}
      />

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetail
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </div>
  );
}
