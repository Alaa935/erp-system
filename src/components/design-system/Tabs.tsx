import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'segmented' | 'pills';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className = '' }: TabsProps) {
  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center bg-gray-100/50 p-0.5 rounded-lg gap-0 ${className}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                isActive ? 'bg-white text-gray-900 shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]' : 'text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={[
                'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                isActive ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              ].join(' ')}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-0 border-b border-gray-100 ${className}`}>
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all relative',
              isActive ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
