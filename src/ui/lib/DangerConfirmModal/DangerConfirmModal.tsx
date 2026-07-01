import { useEffect, useId, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';
import s from './DangerConfirmModal.module.css';

export interface DangerConfirmModalProps {
  open: boolean;
  /** Modal title, e.g. "Delete this course?" */
  title: string;
  /** Long-form risk description shown above the input */
  description: ReactNode;
  /**
   * Word the user must type to enable the confirm button.
   * Comparison is case-insensitive after trimming. Defaults to "delete".
   */
  confirmKeyword?: string;
  /** Confirm button label, e.g. "Delete course" */
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DangerConfirmModal({
  open,
  title,
  description,
  confirmKeyword = 'delete',
  confirmLabel,
  loading,
  onConfirm,
  onClose,
}: Readonly<DangerConfirmModalProps>) {
  const [typed, setTyped] = useState('');
  const inputId = useId();

  // Reset on open so previously typed text doesn't auto-enable the button.
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const matches = typed.trim().toLowerCase() === confirmKeyword.toLowerCase();
  const canConfirm = matches && !loading;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onConfirm}
            disabled={!canConfirm}
            loading={loading}
            className={s.confirmButton}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className={s.body}>
        <div className={s.warning}>
          <AlertTriangle
            size={18}
            strokeWidth={2.2}
            className={s.warningIcon}
          />
          <div className={s.warningText}>{description}</div>
        </div>
        <label htmlFor={inputId} className={s.label}>
          Type{' '}
          <code className={s.keyword}>{confirmKeyword}</code>{' '}
          to confirm:
          <input
            id={inputId}
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            autoFocus
            placeholder={confirmKeyword}
            className={s.input}
            data-matches={matches ? 'true' : undefined}
          />
        </label>
      </div>
    </Modal>
  );
}
