import { useId, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import s from './Checkbox.module.css';

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
      className={s.root}
      data-disabled={disabled ? 'true' : undefined}
    >
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className={s.input}
      />
      <span aria-hidden="true" className={s.box} data-checked={checked ? 'true' : undefined}>
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className={s.text}>
        <span className={s.label}>{label}</span>
        {sub && <span className={s.sub}>{sub}</span>}
      </span>
    </label>
  );
}
