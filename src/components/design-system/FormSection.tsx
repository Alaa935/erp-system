import React, { type ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

function FormSection({
  title,
  description,
  icon,
  children,
  className = '',
}: FormSectionProps) {
  return (
    <div className={'space-y-4 ' + className}>
      <div className="flex items-center gap-3">
        {icon && <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-black text-white">{icon}</div>}
        <div>
          <h4 className="font-black text-black text-sm">{title}</h4>
          {description && <p className="text-[11px] font-medium text-gray-500">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export { FormSection };
export type { FormSectionProps };
export default FormSection;