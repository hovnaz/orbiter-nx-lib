export interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 18, color = 'var(--teal)' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${color}33`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'orbiter-spin 700ms linear infinite',
      }}
    >
      <style>{`@keyframes orbiter-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}
