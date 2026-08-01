import React from 'react';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const fallbackId = React.useId();
    const selectId = id || fallbackId;
    const errorId = error ? `${selectId}-error` : undefined;
    const helperId = helperText ? `${selectId}-helper` : undefined;

    return (
      <div className={`select-wrapper ${error ? 'select-wrapper--error' : ''} ${className}`}>
        {label && <label htmlFor={selectId} className="select__label">{label}</label>}
        <div className="select__container">
          <select
            ref={ref}
            id={selectId}
            className="select__field"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            {...props}
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="select__arrow" aria-hidden="true">▼</span>
        </div>
        {error && <span id={errorId} className="select__error" role="alert">{error}</span>}
        {helperText && !error && <span id={helperId} className="select__helper">{helperText}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';