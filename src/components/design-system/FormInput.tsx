import React, { type ReactNode } from 'react';

interface FormInputProps {
  label?: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  touched?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  min?: string | number;
  max?: string | number;
  step?: string;
  icon?: ReactNode;
  inputMode?: 'text' | 'numeric' | 'tel' | 'email' | 'url' | 'search' | 'decimal';
  maxLength?: number;
}

function FormInput({
  label,
  type = 'text',
  value,
  onChange,
  error,
  touched,
  required = false,
  autoFocus = false,
  placeholder,
  disabled = false,
  className = '',
  min,
  max,
  icon,
  inputMode,
  maxLength,
  step,
}: FormInputProps) {
  return (
    <div className={'space-y-1.5 ' + className}>
      {label && (
        <label className={'text-xs font-semibold ' + (error && touched ? 'text-rose-700' : 'text-gray-700')}>
          {label}
          {required && <span className="text-red-400 me-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          inputMode={inputMode}
          maxLength={maxLength}
          step={step}
          className={
            'w-full bg-[#F2F4F6] border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-black font-bold outline-none transition-all ' +
            (disabled ? 'text-gray-500 bg-gray-100 cursor-not-allowed ' : '') +
            (icon ? 'pr-4 pl-10 ' : '') +
            (error && touched ? 'ring-2 ring-rose-300 bg-rose-50 ' : '')
          }
        />
      </div>
      {error && touched && (
        <p className="text-[11px] text-rose-600 font-medium mt-0.5">{error}</p>
      )}
    </div>
  );
}

export { FormInput };
export type { FormInputProps };
export default FormInput;