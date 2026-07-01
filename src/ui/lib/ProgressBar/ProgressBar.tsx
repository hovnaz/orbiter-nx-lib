export type ProgressTone = 'brand' | 'success' | 'info' | 'warning';

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: ProgressTone;
  height?: number;
  showLabel?: boolean;
}

const COLORS: Record<ProgressTone, string> = {
  brand: 'var(--teal)',
  success: 'var(--success)',
  info: 'var(--info)',
  warning: 'var(--warning)',
};

export function ProgressBar({
  value,
  max = 100,
  tone = 'brand',
  height = 6,
  showLabel = false,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          width: '100%',
          height,
          background: 'var(--border-subtle)',
          borderRadius: 'var(--r-pill)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: COLORS[tone],
            borderRadius: 'var(--r-pill)',
            transition: 'width 360ms var(--ease-out)',
          }}
        />
      </div>
      {showLabel && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          <span>{Math.round(pct)}%</span>
        </div>
      )}
    </div>
  );
}
