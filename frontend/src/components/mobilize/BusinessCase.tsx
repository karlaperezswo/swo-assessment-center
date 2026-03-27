import { ExecutiveSummary } from '@/components/ExecutiveSummary';
import { CostSummary } from '@/components/CostSummary';
import { ClientFormData, CostBreakdown } from '@/types/assessment';
import { TrendingUp, Sparkles } from 'lucide-react';

interface BusinessCaseProps {
  clientData: ClientFormData;
  estimatedCosts: CostBreakdown | null;
  totalServers: number;
  migrationReadiness: string;
  calculatorLinks?: {
    onDemand: string;
    oneYearNuri: string;
    threeYearNuri: string;
  };
}

export function BusinessCase({ clientData, estimatedCosts, totalServers, migrationReadiness, calculatorLinks }: BusinessCaseProps) {
  if (!estimatedCosts || !clientData.clientName || clientData.onPremisesCost <= 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">Complete the Assess phase to view the business case</p>
        <p className="text-sm mt-1">Upload data and enter client information in the Assess tab</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Executive Summary */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
        </div>
        <ExecutiveSummary
          clientName={clientData.clientName}
          onPremisesCost={clientData.onPremisesCost}
          estimatedCosts={estimatedCosts}
          totalServers={totalServers}
          migrationReadiness={migrationReadiness as any}
        />
      </section>

      {/* Financial Analysis */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Financial Analysis</h2>
        </div>
        <CostSummary
          costs={estimatedCosts}
          calculatorLinks={calculatorLinks}
        />
      </section>
    </div>
  );
}
