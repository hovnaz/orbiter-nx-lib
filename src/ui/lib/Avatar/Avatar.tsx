export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: AvatarSize;
  color?: string;
}

const SIZES: Record<AvatarSize, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const PALETTE = [
  '#3BBCA7',
  '#072F60',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
];

function pickColor(name: string): string {
  const hash = Array.from(name).reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name = '', src, size = 'md', color }: AvatarProps) {
  const px = SIZES[size];
  const bg = color ?? (name ? pickColor(name) : 'var(--ink-300)');
  const initials = initialsFrom(name);

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: src ? `url(${src}) center/cover` : bg,
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: px * 0.38,
        letterSpacing: '-0.01em',
        flexShrink: 0,
      }}
    >
      {!src && initials}
    </div>
  );
}
