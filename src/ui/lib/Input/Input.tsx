import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import s from './Input.module.css';

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

  return (
    <div className={s.root}>
      {label && (
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      )}
      <div className={s.field} data-error={error ? 'true' : undefined}>
        {iconLeft && <span className={s.icon}>{iconLeft}</span>}
        <input
          ref={ref}
          id={inputId}
          {...rest}
          className={s.input}
          style={style}
        />
      </div>
      {(hint || error) && (
        <span className={s.message} data-error={error ? 'true' : undefined}>
          {error ?? hint}
        </span>
      )}
    </div>
  );
});
