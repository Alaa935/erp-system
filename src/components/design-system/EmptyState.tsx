import type { ReactNode, ComponentType } from 'react';

interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-8">
      {Icon && (
        <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center mb-3">
          <Icon className="w-4 h-4 text-gray-300" />
        </div>
      )}
      <p className="text-sm text-gray-500">{title}</p>
      {description && (
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
