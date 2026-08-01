import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Toast.css';

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  onClose?: () => void;
}

interface ToastInternalProps extends ToastProps {
  id: string;
  onClose: () => void;
}

function ToastItem({ message, type = 'info', duration = 3000, onClose }: ToastInternalProps) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onClose(), 200);
    }, duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [duration, onClose]);

  return (
    <div className={`toast toast--${type} ${isExiting ? 'toast--exiting' : ''}`} role="alert">
      <span className="toast__message">{message}</span>
      <button className="toast__close" onClick={() => { setIsExiting(true); setTimeout(() => onClose(), 200); }} aria-label="关闭">×</button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<ToastProps & { id: string }>;
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return ReactDOM.createPortal(
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map(t => <ToastItem key={t.id} {...t} onClose={() => onClose(t.id)} />)}
    </div>,
    document.body
  );
}

export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const show = (message: string, type?: ToastProps['type'], duration?: number) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const close = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { show, close, toasts, ToastContainer: () => <ToastContainer toasts={toasts} onClose={close} /> };
}