import React from 'react';
import './DragHandle.css';

export interface DragHandleProps {
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  className?: string;
  'aria-label'?: string;
}

export const DragHandle = React.forwardRef<HTMLDivElement, DragHandleProps>(
  ({ onDragStart, onDragEnd, className = '', 'aria-label': ariaLabel = '拖拽排序', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`drag-handle ${className}`}
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-grabbed="false"
        {...props}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="4" cy="4" r="1.5" fill="currentColor" />
          <circle cx="8" cy="4" r="1.5" fill="currentColor" />
          <circle cx="12" cy="4" r="1.5" fill="currentColor" />
          <circle cx="4" cy="8" r="1.5" fill="currentColor" />
          <circle cx="8" cy="8" r="1.5" fill="currentColor" />
          <circle cx="12" cy="8" r="1.5" fill="currentColor" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </div>
    );
  }
);

DragHandle.displayName = 'DragHandle';