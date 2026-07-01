import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';

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
      {description && (
        <div
          style={{
            padding: '20px 24px',
            fontSize: 13.5,
            lineHeight: 1.55,
            color: 'var(--text-secondary)',
          }}
        >
          {description}
        </div>
      )}
    </Modal>
  );
}
