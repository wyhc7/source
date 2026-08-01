import React, { useState, useRef, useEffect } from 'react';
import './Collapse.css';

export interface CollapseProps {
  isOpen?: boolean;
  defaultOpen?: boolean;
  onChange?: (open: boolean) => void;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Collapse({ isOpen, defaultOpen = false, onChange, title, children, className = '' }: CollapseProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const handleToggle = () => {
    const nextOpen = !open;
    if (!isControlled) setInternalOpen(nextOpen);
    onChange?.(nextOpen);
  };

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.height = open ? `${contentRef.current.scrollHeight}px` : '0';
    }
  }, [open]);

  return (
    <div className={`collapse ${open ? 'collapse--open' : ''} ${className}`}>
      <button
        className="collapse__header"
        onClick={handleToggle}
        aria-expanded={open}
        type="button"
      >
        <span className="collapse__title">{title}</span>
        <svg className={`collapse__icon ${open ? 'collapse__icon--rotated' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M5 6L8 9L11 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="collapse__content" role="region" aria-hidden={!open}>
        <div ref={contentRef} className="collapse__content-inner">
          {children}
        </div>
      </div>
    </div>
  );
}