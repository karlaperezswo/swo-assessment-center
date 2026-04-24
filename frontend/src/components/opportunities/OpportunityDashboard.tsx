import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OpportunityList } from './OpportunityList';
import { OpportunityFilters } from './OpportunityFilters';
import { OpportunityDetail } from './OpportunityDetail';
import { ExportButton } from './ExportButton';
import { OpportunityEditDialog } from './OpportunityEditDialog';
import { Opportunity, OpportunityFilters as FilterType } from '@shared/types/opportunity.types';
import apiClient from '@/lib/api';
import { Loader2, AlertCircle, Upload, FileText, Plus } from 'lucide-react';
import {
  loadManualOpportunities,
  saveManualOpportunities,
  OpportunityDraft,
  draftToOpportunity,
  toDraft,
  isManualOpportunity,
} from '@/lib/manualOpportunities';
import { toast } from 'sonner';

interface OpportunityDashboardProps {
  sessionId: string | null;
  onSessionIdChange?: (sessionId: string) => void;
}

export function OpportunityDashboard({ sessionId }: OpportunityDashboardProps) {
  const { t } = useTranslation();
  const [backendOpportunities, setBackendOpportunities] = useState<Opportunity[]>([]);
  const [manualOpportunities, setManualOpportunities] = useState<Opportunity[]>(() =>
    loadManualOpportunities(sessionId)
  );
  const [filteredOpportunities, setFilteredOpportunities] = useState<Opportunity[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [filters, setFilters] = useState<FilterType>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<OpportunityDraft | undefined>(undefined);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');

  const opportunities = useMemo(
    () => [...manualOpportunities, ...backendOpportunities],
    [manualOpportunities, backendOpportunities]
  );

  // Load opportunities when sessionId changes
  useEffect(() => {
    setManualOpportunities(loadManualOpportunities(sessionId));
    if (sessionId) {
      loadOpportunities();
    } else {
      setBackendOpportunities([]);
    }
  }, [sessionId]);

  // Persist manual opportunities whenever they change
  useEffect(() => {
    saveManualOpportunities(sessionId, manualOpportunities);
  }, [sessionId, manualOpportunities]);

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
        setBackendOpportunities(response.data.data.opportunities);
      } else {
        setError(response.data.error || t('opportunitiesDashboard.error'));
      }
    } catch (err: any) {
      console.error('Error loading opportunities:', err);
      setError(err.response?.data?.error || t('opportunitiesDashboard.error'));
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
    // Manual opportunities are persisted locally — no backend call needed.
    if (opportunityId.startsWith('manual-')) {
      setManualOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId
            ? { ...o, status: newStatus as Opportunity['status'], updatedAt: new Date() }
            : o
        )
      );
      if (selectedOpportunity?.id === opportunityId) {
        setSelectedOpportunity({
          ...selectedOpportunity,
          status: newStatus as Opportunity['status'],
          updatedAt: new Date(),
        });
      }
      return;
    }
    try {
      const response = await apiClient.patch(`/api/opportunities/${opportunityId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        setBackendOpportunities(prev =>
          prev.map(opp => opp.id === opportunityId ? response.data.data : opp)
        );
        if (selectedOpportunity?.id === opportunityId) {
          setSelectedOpportunity(response.data.data);
        }
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      setError(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const openCreateDialog = () => {
    setEditDraft(undefined);
    setEditMode('create');
    setEditOpen(true);
  };

  const openEditDialog = (opportunity: Opportunity) => {
    setEditDraft(toDraft(opportunity));
    setEditMode('edit');
    setEditOpen(true);
  };

  const handleSubmitDraft = (draft: OpportunityDraft) => {
    if (editMode === 'create') {
      const next = draftToOpportunity(draft);
      setManualOpportunities((prev) => [next, ...prev]);
      toast.success('Oportunidad creada');
    } else {
      const existing = manualOpportunities.find((o) => o.id === draft.id);
      const updated = draftToOpportunity(draft, existing);
      setManualOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOpportunity?.id === updated.id) setSelectedOpportunity(updated);
      toast.success('Oportunidad actualizada');
    }
  };

  const handleDeleteManual = (opportunityId: string) => {
    setManualOpportunities((prev) => prev.filter((o) => o.id !== opportunityId));
    if (selectedOpportunity?.id === opportunityId) setSelectedOpportunity(null);
    toast.success('Oportunidad eliminada');
  };

  if (!sessionId && manualOpportunities.length === 0) {
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
              {t('opportunitiesDashboard.aiAnalysis')}
            </h3>
            <p className="text-lg text-gray-700 mb-6">
              {t('opportunitiesDashboard.description')}
            </p>
            <div className="bg-white rounded-lg p-6 shadow-sm text-left space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('opportunitiesDashboard.step1.title')}</p>
                  <p className="text-sm text-gray-600">{t('opportunitiesDashboard.step1.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('opportunitiesDashboard.step2.title')}</p>
                  <p className="text-sm text-gray-600">{t('opportunitiesDashboard.step2.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold">
                  2.5
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('opportunitiesDashboard.step2dot5.title')}</p>
                  <p className="text-sm text-gray-600">{t('opportunitiesDashboard.step2dot5.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 font-bold">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('opportunitiesDashboard.step3.title')}</p>
                  <p className="text-sm text-gray-600">{t('opportunitiesDashboard.step3.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  4
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t('opportunitiesDashboard.step4.title')}</p>
                  <p className="text-sm text-gray-600">{t('opportunitiesDashboard.step4.description')}</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>{t('common.tip')}:</strong> {t('opportunitiesDashboard.tipMessage')}
              </p>
            </div>
            <div className="mt-6">
              <Button type="button" variant="outline" onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-1" />
                Crear oportunidad manual
              </Button>
            </div>
          </div>
        </Card>
        <OpportunityEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          initial={editDraft}
          onSubmit={handleSubmitDraft}
          mode={editMode}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">{t('opportunitiesDashboard.loading')}</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-destructive">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{t('common.error')}</p>
          <p>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with export button */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold">{t('opportunitiesDashboard.title')}</h2>
          <p className="text-muted-foreground">
            {filteredOpportunities.length} {t('opportunitiesDashboard.of')} {opportunities.length} {t('opportunitiesDashboard.opportunities')}
            {manualOpportunities.length > 0 && (
              <span className="ml-2 text-xs text-fuchsia-600">
                ({manualOpportunities.length} manual)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva oportunidad
          </Button>
          {sessionId && <ExportButton sessionId={sessionId} />}
        </div>
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
          onEdit={isManualOpportunity(selectedOpportunity) ? () => openEditDialog(selectedOpportunity) : undefined}
          onDelete={isManualOpportunity(selectedOpportunity) ? () => handleDeleteManual(selectedOpportunity.id) : undefined}
        />
      )}

      <OpportunityEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initial={editDraft}
        onSubmit={handleSubmitDraft}
        mode={editMode}
      />
    </div>
  );
}
