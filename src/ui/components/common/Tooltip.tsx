import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({ content, children, position = 'top', delay = 150 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number>();
  const childRef = useRef<HTMLElement>(null);

  const show = () => {
    timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay);
  };
  const hide = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const wrappedChild = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide
  });

  if (!isVisible) return wrappedChild;

  return (
    <>
      {wrappedChild}
      {ReactDOM.createPortal(
        <div className={`tooltip tooltip--${position}`} role="tooltip">
          <div className="tooltip__arrow" />
          <div className="tooltip__content">{content}</div>
        </div>,
        document.body
      )}
    </>
  );
}