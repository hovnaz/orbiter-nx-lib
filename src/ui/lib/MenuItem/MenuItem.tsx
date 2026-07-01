import { useState, type ReactNode } from 'react';

export type MenuItemTone = 'default' | 'navy' | 'danger';

export interface MenuItemProps {
  icon?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  tone?: MenuItemTone;
  onClick?: () => void;
  disabled?: boolean;
}

const TONES: Record<MenuItemTone, { color: string; bg: string }> = {
  default: { color: 'var(--text-primary)', bg: 'var(--bg-section)' },
  navy: { color: 'var(--navy)', bg: 'var(--navy-soft)' },
  danger: { color: 'var(--danger)', bg: 'var(--danger-soft)' },
};

export function MenuItem({
  icon,
  children,
  trailing,
  tone = 'default',
  onClick,
  disabled,
}: MenuItemProps) {
  const [hover, setHover] = useState(false);
  const c = TONES[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '9px 12px',
        border: 'none',
        borderRadius: 'var(--r-sm)',
        background: !disabled && hover ? c.bg : 'transparent',
        color: c.color,
        fontSize: 14,
        fontWeight: 500,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 120ms var(--ease-out)',
      }}
    >
      {icon && (
        <span style={{ display: 'inline-flex', color: 'var(--text-muted)' }}>{icon}</span>
      )}
      <span style={{ flex: 1 }}>{children}</span>
      {trailing}
    </button>
  );
}
