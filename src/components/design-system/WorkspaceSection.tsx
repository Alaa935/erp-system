import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface WorkspaceSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  variant?: 'default' | 'card' | 'bordered';
  className?: string;
}

function WorkspaceSection({
  children,
  title,
  description,
  actions,
  variant = 'default',
  className = '',
}: WorkspaceSectionProps) {
  const isDefault = variant === 'default';

  return (
    <div className={cn(
      isDefault ? '' : variant === 'card' ? 'bg-white rounded-xl border border-gray-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_4px_rgba(0,0,0,0.02)]' : 'border border-gray-200/60 rounded-xl',
      className
    )}>
      {(title || actions) && (
        <div className={cn(
          'flex items-center justify-between gap-4',
          isDefault ? 'mb-3' : 'px-4 py-3 border-b border-gray-100'
        )}>
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold text-gray-900">{title}</h3>}
            {description && <p className="text-xs text-gray-500 mt-0.5 font-medium">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={cn(isDefault ? '' : 'p-4')}>
        {children}
      </div>
    </div>
  );
}

export { WorkspaceSection };
export default WorkspaceSection;