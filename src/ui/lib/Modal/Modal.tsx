import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import s from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  children?: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
}: Readonly<ModalProps>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className={s.overlay}>
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className={s.backdrop}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={s.dialog}
        data-size={size}
      >
        {title && (
          <div className={s.header}>
            <h2 className={s.title}>{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className={s.close}
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
        <div className={s.body}>{children}</div>
        {footer && <div className={s.footer}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
