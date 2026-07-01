export type StatusTone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusDotProps {
  tone?: StatusTone;
  size?: number;
  pulse?: boolean;
}

const COLORS: Record<StatusTone, string> = {
  brand: 'var(--teal)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  info: 'var(--info)',
  neutral: 'var(--text-muted)',
};

export function StatusDot({ tone = 'brand', size = 8, pulse = false }: StatusDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        background: COLORS[tone],
        flexShrink: 0,
        boxShadow: pulse ? `0 0 0 4px ${COLORS[tone]}33` : 'none',
      }}
    />
  );
}
