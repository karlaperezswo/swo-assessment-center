import { Opportunity, OpportunityPriority } from '@shared/types/opportunity.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DollarSign, Target, MessageSquare, ListChecks, Cloud, FileText } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';

interface OpportunityDetailProps {
  opportunity: Opportunity;
  onClose: () => void;
  onStatusUpdate: (opportunityId: string, newStatus: string) => void;
}

export function OpportunityDetail({ opportunity, onClose, onStatusUpdate }: OpportunityDetailProps) {
  const { t } = useTranslation();

  const priorityColors: Record<OpportunityPriority, string> = {
    High: 'bg-red-100 text-red-800 border-red-300',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Low: 'bg-green-100 text-green-800 border-green-300',
  };

  const handleStatusChange = (newStatus: string) => {
    onStatusUpdate(opportunity.id, newStatus);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{opportunity.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Priority and ARR */}
          <div className="flex items-center gap-4">
            <Badge className={priorityColors[opportunity.priority]}>
              {t('opportunityDetail.priority')}: {opportunity.priority}
            </Badge>
            <div className="flex items-center gap-2 text-xl font-bold text-green-600">
              <DollarSign className="h-6 w-6" />
              <span>${opportunity.estimatedARR.toLocaleString()}</span>
              <span className="text-sm font-normal text-muted-foreground">{t('opportunityDetail.estimatedArr')}</span>
            </div>
          </div>

          {/* Status selector */}
          <div className="space-y-2">
            <Label htmlFor="status">{t('opportunityDetail.opportunityStatus')}</Label>
            <Select value={opportunity.status} onValueChange={handleStatusChange}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nueva">{t('opportunitiesCard.statuses.new')}</SelectItem>
                <SelectItem value="En Progreso">{t('opportunitiesCard.statuses.inProgress')}</SelectItem>
                <SelectItem value="Ganada">{t('opportunitiesCard.statuses.won')}</SelectItem>
                <SelectItem value="Perdida">{t('opportunitiesCard.statuses.lost')}</SelectItem>
                <SelectItem value="Descartada">{t('opportunitiesCard.statuses.discarded')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reasoning */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{t('opportunityDetail.reasoning')}</h3>
            </div>
            <p className="text-muted-foreground leading-relaxed">{opportunity.reasoning}</p>
          </div>

          {/* Evidence */}
          {opportunity.evidence && opportunity.evidence.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">{t('opportunityDetail.evidence')}</h3>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                {opportunity.evidence.map((item: string, index: number) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-primary font-semibold">{index + 1}.</span>
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Talking Points */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{t('opportunityDetail.talkingPoints')}</h3>
            </div>
            <ul className="space-y-2">
              {opportunity.talkingPoints.map((point: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="text-primary font-semibold">{index + 1}.</span>
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Steps */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{t('opportunityDetail.nextSteps')}</h3>
            </div>
            <ul className="space-y-2">
              {opportunity.nextSteps.map((step: string, index: number) => (
                <li key={index} className="flex gap-3">
                  <span className="text-primary font-semibold">{index + 1}.</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Related AWS Services */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">{t('opportunityDetail.relatedServices')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {opportunity.relatedServices.map((service: string, index: number) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {service}
                </Badge>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t text-xs text-muted-foreground">
            <p>{t('opportunityDetail.created')}: {new Date(opportunity.createdAt).toLocaleString()}</p>
            <p>{t('opportunityDetail.updated')}: {new Date(opportunity.updatedAt).toLocaleString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
