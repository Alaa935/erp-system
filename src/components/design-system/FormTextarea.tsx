import React from 'react';

interface FormTextareaProps {
  label?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  rows?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function FormTextarea({
  label,
  value,
  onChange,
  required = false,
  rows = 4,
  placeholder,
  className = '',
  disabled = false,
}: FormTextareaProps) {
  return (
    <div className={'space-y-1.5 ' + className}>
      {label && (
        <label className="text-xs font-semibold text-gray-700">
          {label}
          {required && <span className="text-red-400 me-0.5">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        className={
          'w-full bg-[#F2F4F6] border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-black font-bold outline-none resize-none transition-all ' +
          (disabled ? 'text-gray-500 cursor-not-allowed ' : '')
        }
      />
    </div>
  );
}

export { FormTextarea };
export type { FormTextareaProps };
export default FormTextarea;