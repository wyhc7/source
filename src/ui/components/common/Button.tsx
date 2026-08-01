import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`btn btn--${variant} btn--${size} ${loading ? 'btn--loading' : ''} ${disabled ? 'btn--disabled' : ''} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="btn__spinner" aria-hidden="true" />}
        <span className="btn__text">{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';