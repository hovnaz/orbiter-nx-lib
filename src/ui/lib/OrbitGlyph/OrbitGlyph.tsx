export interface OrbitGlyphProps {
  size?: number;
}

export function OrbitGlyph({ size = 32 }: OrbitGlyphProps) {
  return (
    <span
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: 9,
        background: 'linear-gradient(135deg, #3BBCA7 0%, #072F60 100%)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow:
          '0 2px 8px rgba(7,47,96,.18), inset 0 1px 0 rgba(255,255,255,.18)',
        flexShrink: 0,
      }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" />
        <path d="M12 3.5 L14.2 12 L12 20.5 L9.8 12 Z" fill="white" opacity="0.95" />
        <circle cx="12" cy="12" r="1.5" fill="#072F60" />
      </svg>
      <span
        style={{
          position: 'absolute',
          top: -2,
          right: -2,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--gold)',
          boxShadow: '0 0 0 2px #fff',
        }}
      />
    </span>
  );
}
