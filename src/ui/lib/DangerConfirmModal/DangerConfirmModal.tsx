import { useEffect, useId, useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../Button/Button';
import { Modal } from '../Modal/Modal';

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
            style={{
              background: 'var(--coral-pressed, #B91C1C)',
              borderColor: 'var(--coral-pressed, #B91C1C)',
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div
        style={{
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 12,
            background: 'var(--danger-soft)',
            border: '1px solid var(--danger)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--danger-pressed)',
          }}
        >
          <AlertTriangle
            size={18}
            strokeWidth={2.2}
            style={{ flexShrink: 0, marginTop: 1 }}
          />
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{description}</div>
        </div>
        <label
          htmlFor={inputId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Type{' '}
          <code
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              background: 'var(--bg-subtle)',
              padding: '1px 6px',
              borderRadius: 4,
              color: 'var(--text-primary)',
            }}
          >
            {confirmKeyword}
          </code>{' '}
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
            style={{
              padding: '8px 10px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              border: `1px solid ${matches ? 'var(--success)' : 'var(--border)'}`,
              borderRadius: 'var(--r-sm)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </label>
      </div>
    </Modal>
  );
}
