import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';

export interface SubTabDefinition {
  value: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  /** When false, the tab is reachable but its prerequisites are not yet met. */
  prerequisiteMet?: boolean;
  /** Tooltip shown when hovering a tab with unmet prerequisites. */
  prerequisiteMessage?: string;
}

export interface SubTabGroup {
  groupLabel?: string;
  tabs: SubTabDefinition[];
}

interface SubTabLayoutProps {
  groups: SubTabGroup[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  phaseColor: 'fuchsia' | 'violet' | 'amber';
  children: React.ReactNode;
}

const activeTabStyles = {
  fuchsia: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300 shadow-sm',
  violet: 'bg-violet-100 text-violet-900 border-violet-300 shadow-sm',
  amber: 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm',
};

const groupLabelStyles = {
  fuchsia: 'text-fuchsia-400',
  violet: 'text-violet-400',
  amber: 'text-amber-400',
};

export function SubTabLayout({ groups, activeTab, onTabChange, phaseColor, children }: SubTabLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="bg-white rounded-xl border shadow-sm p-3">
        <div className="space-y-3">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.groupLabel && (
                <p className={cn('text-[10px] font-bold uppercase tracking-widest px-2 mb-1.5', groupLabelStyles[phaseColor])}>
                  {group.groupLabel}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {group.tabs.map((tab) => {
                  const prereqUnmet = tab.prerequisiteMet === false;
                  const title =
                    prereqUnmet && tab.prerequisiteMessage
                      ? tab.prerequisiteMessage
                      : tab.label;
                  return (
                    <button
                      type="button"
                      key={tab.value}
                      onClick={() => !tab.disabled && onTabChange(tab.value)}
                      disabled={tab.disabled}
                      title={title}
                      aria-label={title}
                      className={cn(
                        'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                        activeTab === tab.value
                          ? activeTabStyles[phaseColor]
                          : tab.disabled
                          ? 'text-gray-300 border-transparent cursor-not-allowed'
                          : prereqUnmet
                          ? 'text-gray-400 border-transparent hover:bg-gray-50 hover:border-gray-200'
                          : 'text-gray-600 border-transparent hover:bg-gray-100 hover:border-gray-200'
                      )}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                      {prereqUnmet && (
                        <Lock className="h-3 w-3 text-gray-400" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-fadeIn">{children}</div>
    </div>
  );
}
