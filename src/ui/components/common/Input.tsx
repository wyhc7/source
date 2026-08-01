import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const fallbackId = React.useId();
    const inputId = id || fallbackId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={`input-wrapper ${error ? 'input-wrapper--error' : ''} ${className}`}>
        {label && <label htmlFor={inputId} className="input__label">{label}</label>}
        <div className="input__container">
          {leftIcon && <span className="input__icon input__icon--left">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            className="input__field"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            {...props}
          />
          {rightIcon && <span className="input__icon input__icon--right">{rightIcon}</span>}
        </div>
        {error && <span id={errorId} className="input__error" role="alert">{error}</span>}
        {helperText && !error && <span id={helperId} className="input__helper">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';