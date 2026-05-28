import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'default';

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  neutral: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
  default: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200',
};

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function Badge({ children, variant = 'default', size = 'md', className = '' }: BadgeProps) {
  const sizeClasses = { sm: 'text-[10px] px-1.5 py-0.5', md: 'text-[11px] px-2 py-0.5', lg: 'text-xs px-2.5 py-1' };
  return (
    <span className={`inline-flex items-center font-bold rounded-md transition-all duration-150 ${variantStyles[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}

export { Badge };
export default Badge;