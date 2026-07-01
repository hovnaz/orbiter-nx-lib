import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import s from './ConfirmModal.module.css';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  loading,
  disabled,
  onConfirm,
  onClose,
}: Readonly<ConfirmModalProps>) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            loading={loading}
            disabled={disabled || loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <div className={s.description}>{description}</div>}
    </Modal>
  );
}
