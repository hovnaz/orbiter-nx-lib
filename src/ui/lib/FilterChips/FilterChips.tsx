import type { CSSProperties } from 'react';
import clsx from 'clsx';
import s from './FilterChips.module.css';

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
    <div className={s.root} style={style}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={clsx(s.chip)}
            data-active={active ? 'true' : undefined}
          >
            {item.label}
            {typeof item.count === 'number' && (
              <span className={s.count}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
