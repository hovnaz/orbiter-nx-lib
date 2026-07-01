import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import s from './Card.module.css';

export type CardVariant = 'default' | 'elevated' | 'outline' | 'tinted';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  children?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', interactive = false, className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      {...rest}
      className={clsx(s.root, className)}
      data-variant={variant}
      data-padding={padding}
      data-interactive={interactive ? 'true' : undefined}
    >
      {children}
    </div>
  );
});
