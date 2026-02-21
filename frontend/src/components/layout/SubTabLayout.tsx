import { cn } from '@/lib/utils';

export interface SubTabGroup {
  groupLabel?: string;
  tabs: {
    value: string;
    label: string;
    icon: React.ReactNode;
    disabled?: boolean;
  }[];
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
                {group.tabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => !tab.disabled && onTabChange(tab.value)}
                    disabled={tab.disabled}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                      activeTab === tab.value
                        ? activeTabStyles[phaseColor]
                        : tab.disabled
                        ? 'text-gray-300 border-transparent cursor-not-allowed'
                        : 'text-gray-600 border-transparent hover:bg-gray-100 hover:border-gray-200'
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
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
