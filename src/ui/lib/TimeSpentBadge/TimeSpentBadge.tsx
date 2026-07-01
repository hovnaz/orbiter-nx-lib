import { Timer } from 'lucide-react';
import { Badge } from '../Badge/Badge';

export interface TimeSpentBadgeProps {
  minutes: number;
}

export function TimeSpentBadge({ minutes }: Readonly<TimeSpentBadgeProps>) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = h ? `${h}h ${m}m` : `${m}m`;
  return (
    <Badge
      tone="neutral"
      variant="soft"
      size="sm"
      iconLeft={<Timer size={12} strokeWidth={2.2} />}
    >
      {label}
    </Badge>
  );
}
