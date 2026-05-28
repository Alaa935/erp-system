import React from 'react';

interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField({
  label,
  required = false,
  error,
  helperText,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-gray-700">
          {label}
          {required && (
            <span className="after:content-['*'] after:text-red-400 after:me-0.5" />
          )}
        </label>
      )}
      {children}
      {error && (
        <p className="text-[11px] text-rose-600 font-medium mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-[11px] text-gray-500 mt-0.5">{helperText}</p>
      )}
    </div>
  );
}

export { FormField };
export default FormField;