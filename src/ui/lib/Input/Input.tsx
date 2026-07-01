import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, iconLeft, id, style, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const borderColor = error ? 'var(--danger)' : 'var(--border)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          background: 'var(--bg-elevated)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          transition: 'border-color 120ms var(--ease-out), box-shadow 120ms var(--ease-out)',
        }}
      >
        {iconLeft && (
          <span style={{ color: 'var(--text-muted)', display: 'inline-flex' }}>
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            ...style,
          }}
        />
      </div>
      {(hint || error) && (
        <span
          style={{
            fontSize: 12,
            color: error ? 'var(--danger)' : 'var(--text-muted)',
          }}
        >
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
