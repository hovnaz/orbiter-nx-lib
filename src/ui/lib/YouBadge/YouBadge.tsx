import { Check } from 'lucide-react';
import s from './YouBadge.module.css';

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
    <span title={title} className={s.root}>
      <Check size={11} strokeWidth={2.6} />
      You
    </span>
  );
}
