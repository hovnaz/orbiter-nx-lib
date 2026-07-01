import { Check } from 'lucide-react';

export interface YouBadgeProps {
  /** Tooltip text on hover. */
  title?: string;
}

/**
 * Small "✓ YOU" pill rendered next to a user's name to mark the row that
 * belongs to the currently authenticated user.
 */
export function YouBadge({ title = 'This is you' }: Readonly<YouBadgeProps>) {
  return (
    <span
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 7px 1px 5px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color: 'var(--teal-pressed)',
        background: 'var(--teal-soft)',
        border: '1px solid var(--teal)',
        borderRadius: 'var(--r-xs)',
        flexShrink: 0,
      }}
    >
      <Check size={11} strokeWidth={2.6} />
      You
    </span>
  );
}
