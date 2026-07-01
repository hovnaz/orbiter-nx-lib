import { AlertCircle, Calendar, Check, Clock } from 'lucide-react';
import { Badge } from '../Badge/Badge';

export type DeadlineState = 'overdue' | 'active' | 'upcoming' | 'completed';

export interface DeadlineBadgeProps {
  state?: DeadlineState;
  date?: string;
  compact?: boolean;
}

const MAP = {
  overdue: { tone: 'danger' as const, Icon: AlertCircle, label: 'Overdue' },
  active: { tone: 'info' as const, Icon: Clock, label: 'Due' },
  upcoming: { tone: 'neutral' as const, Icon: Calendar, label: 'Starts' },
  completed: { tone: 'success' as const, Icon: Check, label: 'Done' },
};

export function DeadlineBadge({
  state = 'upcoming',
  date,
  compact = false,
}: Readonly<DeadlineBadgeProps>) {
  const { tone, Icon, label } = MAP[state];
  return (
    <Badge
      tone={tone}
      variant="soft"
      size={compact ? 'sm' : 'md'}
      iconLeft={<Icon size={compact ? 12 : 14} strokeWidth={2.2} />}
    >
      {label}
      {date ? ` · ${date}` : ''}
    </Badge>
  );
}
