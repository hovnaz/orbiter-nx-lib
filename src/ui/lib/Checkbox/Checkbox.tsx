import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: ReactNode;
  sub?: ReactNode;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onChange,
  label,
  sub,
  disabled = false,
}: Readonly<CheckboxProps>) {
  const inputId = useId();
  return (
    <label
      htmlFor={inputId}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
          width: 0,
          height: 0,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          border: checked ? '1.5px solid var(--teal)' : '1.5px solid var(--border)',
          background: checked ? 'var(--teal)' : 'var(--bg-elevated)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--bg-elevated)',
          flexShrink: 0,
          marginTop: 1,
          transition:
            'background 120ms var(--ease-out), border-color 120ms var(--ease-out)',
        }}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
        </span>
        {sub && (
          <span
            style={{
              display: 'block',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {sub}
          </span>
        )}
      </span>
    </label>
  );
}
