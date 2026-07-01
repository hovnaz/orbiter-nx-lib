import type { ReactNode } from 'react';
import s from './MenuItem.module.css';

export type MenuItemTone = 'default' | 'navy' | 'danger';

export interface MenuItemProps {
  icon?: ReactNode;
  children?: ReactNode;
  trailing?: ReactNode;
  tone?: MenuItemTone;
  onClick?: () => void;
  disabled?: boolean;
}

export function MenuItem({
  icon,
  children,
  trailing,
  tone = 'default',
  onClick,
  disabled,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={s.root}
      data-tone={tone}
    >
      {icon && <span className={s.icon}>{icon}</span>}
      <span className={s.label}>{children}</span>
      {trailing}
    </button>
  );
}
