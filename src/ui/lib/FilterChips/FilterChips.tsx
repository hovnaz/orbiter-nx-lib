import type { CSSProperties } from 'react';

export interface FilterChipItem<TKey extends string = string> {
  key: TKey;
  label: string;
  count?: number;
}

export interface FilterChipsProps<TKey extends string = string> {
  items: ReadonlyArray<FilterChipItem<TKey>>;
  value: TKey;
  onChange: (key: TKey) => void;
  style?: CSSProperties;
}

export function FilterChips<TKey extends string = string>({
  items,
  value,
  onChange,
  style,
}: Readonly<FilterChipsProps<TKey>>) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 6,
        flexWrap: 'wrap',
        ...style,
      }}
    >
      {items.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            style={{
              padding: '8px 14px',
              borderRadius: 'var(--r-pill)',
              fontSize: 13,
              fontWeight: 600,
              background: active ? 'var(--teal)' : 'var(--bg-elevated)',
              color: active ? '#fff' : 'var(--text-secondary)',
              border: active
                ? '1px solid var(--teal)'
                : '1px solid var(--border)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition:
                'background 120ms var(--ease-out), color 120ms var(--ease-out), border-color 120ms var(--ease-out)',
            }}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: active
                    ? 'rgba(255, 255, 255, 0.78)'
                    : 'var(--text-muted)',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
