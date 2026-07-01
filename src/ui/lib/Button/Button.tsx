import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './Button.module.css';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
  loading?: boolean;
}

/**
 * Canonical CSS-Modules reference component. Style lives entirely in
 * Button.module.css; variants/sizes are expressed via `data-*` attributes and
 * CSS selectors, and hover/active/focus via CSS pseudo-classes — no inline
 * style objects, no per-state React state. See docs/components/STYLING.md.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    iconLeft,
    iconRight,
    fullWidth,
    loading,
    children,
    className,
    disabled,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      className={clsx(s.root, className)}
      data-variant={variant}
      data-size={size}
      data-full={fullWidth ? 'true' : undefined}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
});
