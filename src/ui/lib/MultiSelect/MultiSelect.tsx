import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  /** Currently selected values. */
  value: string[];
  onChange: (next: string[]) => void;
  label?: ReactNode;
  hint?: string;
  error?: string;
  disabled?: boolean;
  /** Shown when there are no options to pick from. */
  emptyText?: string;
}

/**
 * Generic multi-select as a wrap of toggleable pills (selected = filled).
 * Presentational: state lives with the parent (props in / `onChange` out).
 * Suits small/medium option sets (CRM select fields, tags, filters).
 */
export function MultiSelect({
  options,
  value,
  onChange,
  label,
  hint,
  error,
  disabled = false,
  emptyText = '—',
}: Readonly<MultiSelectProps>) {
  const labelId = useId();
  const selected = new Set(value);

  function toggle(v: string) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange([...next]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <span
          id={labelId}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
      )}
      {options.length === 0 ? (
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{emptyText}</span>
      ) : (
        <div
          role="group"
          aria-labelledby={label ? labelId : undefined}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, opacity: disabled ? 0.6 : 1 }}
        >
          {options.map((opt) => {
            const active = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                role="checkbox"
                aria-checked={active}
                disabled={disabled}
                onClick={() => toggle(opt.value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 'var(--r-pill, 999px)',
                  border: `1px solid ${active ? 'var(--teal)' : 'var(--border)'}`,
                  background: active ? 'var(--teal-soft)' : 'var(--bg-elevated)',
                  color: active ? 'var(--teal-pressed)' : 'var(--text-secondary)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition:
                    'background 120ms var(--ease-out), border-color 120ms var(--ease-out), color 120ms var(--ease-out)',
                }}
              >
                {active && <Check size={12} strokeWidth={3} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {(hint || error) && (
        <span style={{ fontSize: 12, color: error ? 'var(--danger)' : 'var(--text-muted)' }}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
