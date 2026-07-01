import {
  forwardRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';

export type CardVariant = 'default' | 'elevated' | 'outline' | 'tinted';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  children?: ReactNode;
}

const VARIANT_STYLES: Record<CardVariant, CSSProperties> = {
  default: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
  },
  elevated: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    boxShadow: 'var(--sh-sm)',
  },
  outline: { background: 'transparent', border: '1px solid var(--border)' },
  tinted: {
    background: 'var(--bg-subtle)',
    border: '1px solid var(--border-subtle)',
  },
};

const PADDINGS: Record<CardPadding, number> = { none: 0, sm: 12, md: 20, lg: 28 };

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'default', padding = 'md', interactive = false, style, children, ...rest },
  ref,
) {
  const [hover, setHover] = useState(false);
  const hovered = interactive && hover;

  return (
    <div
      ref={ref}
      {...rest}
      onMouseEnter={(e) => {
        setHover(true);
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        rest.onMouseLeave?.(e);
      }}
      style={{
        borderRadius: 'var(--r-lg)',
        padding: PADDINGS[padding],
        transition:
          'transform 120ms var(--ease-out), box-shadow 120ms var(--ease-out), border-color 120ms var(--ease-out)',
        cursor: interactive ? 'pointer' : 'default',
        ...VARIANT_STYLES[variant],
        ...(hovered
          ? {
              transform: 'translateY(-2px)',
              boxShadow: 'var(--sh-md)',
              borderColor: 'var(--ink-300)',
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
});
