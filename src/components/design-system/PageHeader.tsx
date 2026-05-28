import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<any>;
  actions?: React.ReactNode;
  badge?: { label: string; variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' };
}

const badgeStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  neutral: 'bg-gray-50 text-gray-600 ring-1 ring-gray-200',
};

export function PageHeader({ title, subtitle, icon: Icon, actions, badge }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && <div className="w-9 h-9 rounded-xl bg-black/5 flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-black" /></div>}
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-black tracking-tight truncate">{title}</h1>
              {badge && (
                <span className={badgeStyles[badge.variant ?? 'neutral'] + ' px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0'}>
                  {badge.label}
                </span>
              )}
            </div>
            {subtitle && <p className="text-sm text-gray-500 mt-0.5 font-medium">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export default PageHeader;