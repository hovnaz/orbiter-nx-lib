import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import s from './MultiSelect.module.css';

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
    <div className={s.root}>
      {label && (
        <span id={labelId} className={s.label}>
          {label}
        </span>
      )}
      {options.length === 0 ? (
        <span className={s.empty}>{emptyText}</span>
      ) : (
        <div
          role="group"
          aria-labelledby={label ? labelId : undefined}
          className={s.group}
          data-disabled={disabled ? 'true' : undefined}
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
                className={s.pill}
                data-active={active ? 'true' : undefined}
              >
                {active && <Check size={12} strokeWidth={3} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
      {(hint || error) && (
        <span className={s.message} data-error={error ? 'true' : undefined}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
}
