export type DeadlineState = 'overdue' | 'active' | 'upcoming' | 'completed';

export interface DeadlineLabel {
  prefix: string;
  tone: 'danger' | 'info' | 'neutral' | 'success';
}

const LABELS: Record<DeadlineState, DeadlineLabel> = {
  overdue: { prefix: 'Overdue', tone: 'danger' },
  active: { prefix: 'Due', tone: 'info' },
  upcoming: { prefix: 'Starts', tone: 'neutral' },
  completed: { prefix: 'Done', tone: 'success' },
};

export function formatDeadline(
  state: DeadlineState,
  date?: string,
): { label: string; tone: DeadlineLabel['tone'] } {
  const entry = LABELS[state];
  return {
    label: date ? `${entry.prefix} · ${date}` : entry.prefix,
    tone: entry.tone,
  };
}
