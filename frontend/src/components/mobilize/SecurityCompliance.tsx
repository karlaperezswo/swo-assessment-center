import { ChecklistCard } from '@/components/shared/ChecklistCard';
import { Card, CardContent } from '@/components/ui/card';
import { SecurityComplianceChecklist } from '@/types/assessment';
import { Shield, Lock, Network, FileCheck, AlertTriangle } from 'lucide-react';

interface SecurityComplianceProps {
  checklist: SecurityComplianceChecklist;
  onChecklistChange: (checklist: SecurityComplianceChecklist) => void;
}

export function SecurityCompliance({ checklist, onChecklistChange }: SecurityComplianceProps) {
  const handleToggle = (category: keyof SecurityComplianceChecklist, id: string) => {
    onChecklistChange({
      ...checklist,
      [category]: checklist[category].map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    });
  };

  const handleNotesChange = (category: keyof SecurityComplianceChecklist, id: string, notes: string) => {
    onChecklistChange({
      ...checklist,
      [category]: checklist[category].map(item =>
        item.id === id ? { ...item, notes } : item
      ),
    });
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-violet-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-violet-900 text-lg">Security & Compliance Framework</h3>
              <p className="text-sm text-violet-700 mt-1">
                Establish a robust security posture and compliance framework before migrating sensitive workloads.
                These controls are essential for meeting regulatory requirements and protecting your data.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklists */}
      <div className="space-y-6">
        <ChecklistCard
          title="Identity & Access Management"
          icon={<Lock className="h-5 w-5" />}
          items={checklist.identityAccess}
          onItemToggle={(id) => handleToggle('identityAccess', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('identityAccess', id, notes)}
          accentColor="violet"
        />

        <ChecklistCard
          title="Data Protection"
          icon={<Shield className="h-5 w-5" />}
          items={checklist.dataProtection}
          onItemToggle={(id) => handleToggle('dataProtection', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('dataProtection', id, notes)}
          accentColor="blue"
        />

        <ChecklistCard
          title="Network Security"
          icon={<Network className="h-5 w-5" />}
          items={checklist.networkSecurity}
          onItemToggle={(id) => handleToggle('networkSecurity', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('networkSecurity', id, notes)}
          accentColor="green"
        />

        <ChecklistCard
          title="Compliance"
          icon={<FileCheck className="h-5 w-5" />}
          items={checklist.compliance}
          onItemToggle={(id) => handleToggle('compliance', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('compliance', id, notes)}
          accentColor="amber"
        />

        <ChecklistCard
          title="Incident Response"
          icon={<AlertTriangle className="h-5 w-5" />}
          items={checklist.incidentResponse}
          onItemToggle={(id) => handleToggle('incidentResponse', id)}
          onItemNotesChange={(id, notes) => handleNotesChange('incidentResponse', id, notes)}
          accentColor="fuchsia"
        />
      </div>
    </div>
  );
}
