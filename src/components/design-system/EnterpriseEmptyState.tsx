import React from 'react';

interface EnterpriseEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  tips?: string[];
  action?: React.ReactNode;
}

export function EnterpriseEmptyState({ icon, title, action }: EnterpriseEmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center py-8 gap-3">
      {icon || <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center"><div className="w-4 h-4 rounded bg-gray-200" /></div>}
      <p className="text-sm text-gray-500">{title}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EnterpriseEmptyState;
