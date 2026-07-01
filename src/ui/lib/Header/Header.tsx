import {
  Calendar,
  Check,
  ChevronDown,
  HelpCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { Dropdown } from '../Dropdown/Dropdown';
import { MenuItem } from '../MenuItem/MenuItem';
import { OrbitGlyph } from '../OrbitGlyph/OrbitGlyph';
import s from './Header.module.css';

export interface NavItem {
  key: string;
  label: string;
  matchPaths?: string[];
}

export interface HeaderUser {
  name: string;
  email: string;
}

export interface HeaderRoleOption {
  /** Role identifier (e.g. "ADMIN"). */
  key: string;
  /** Human-readable label (e.g. "Admin"). */
  label: string;
}

export interface HeaderProps {
  user: HeaderUser;
  navItems?: NavItem[];
  currentPath: string;
  productLabel?: string;
  /**
   * All school roles the user holds in the current organization. When length
   * >= 2, the current-role pill becomes a dropdown that switches roles.
   */
  roles?: HeaderRoleOption[];
  /** Currently active role key — must match one of `roles[].key`. */
  currentRoleKey?: string;
  /** Called when user picks a different role from the dropdown. */
  onRoleChange?: (roleKey: string) => void;
  onNavigate: (key: string) => void;
  onLogoClick?: () => void;
  onProfile?: () => void;
  onLogout?: () => void;
  /** Called when the user clicks the calendar icon next to their avatar. */
  onCalendar?: () => void;
  /** Called when the user clicks the help / guided-tour item in the avatar menu.
   * When provided, a help entry is shown in the dropdown. */
  onHelp?: () => void;
  /** Label for the help menu item (e.g. "Guided tour"). */
  helpLabel?: string;
}

function isActive(item: NavItem, currentPath: string): boolean {
  if (currentPath.startsWith(item.key)) return true;
  return item.matchPaths?.some((p) => currentPath.startsWith(p)) ?? false;
}

export function Header({
  user,
  navItems = [],
  currentPath,
  productLabel,
  roles = [],
  currentRoleKey,
  onRoleChange,
  onNavigate,
  onLogoClick,
  onProfile,
  onLogout,
  onCalendar,
  onHelp,
  helpLabel,
}: HeaderProps) {
  const { t } = useTranslation();
  const currentRole = roles.find((r) => r.key === currentRoleKey);
  const showRoleSwitcher = roles.length >= 2 && Boolean(currentRole);
  return (
    <header className={s.header}>
      <div className={s.inner}>
        <button
          type="button"
          onClick={onLogoClick}
          aria-label={t('header.goHome')}
          disabled={!onLogoClick}
          className={s.logo}
          data-clickable={onLogoClick ? 'true' : undefined}
        >
          <OrbitGlyph size={32} />
          <div className={s.logoText}>
            <span className={s.brand}>Orbiter</span>
            {productLabel && (
              <Badge tone="brand" variant="soft" size="sm">
                {productLabel}
              </Badge>
            )}
          </div>
        </button>

        {showRoleSwitcher ? (
          <Dropdown
            align="left"
            minWidth={180}
            trigger={({ toggle, open }) => (
              <button
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={open}
                className={clsx(s.rolePill, s.roleTrigger)}
                data-open={open ? 'true' : undefined}
              >
                {currentRole?.label}
                <ChevronDown size={13} strokeWidth={2.4} />
              </button>
            )}
          >
            {({ close }) => (
              <>
                {roles.map((r) => {
                  const isCurrent = r.key === currentRoleKey;
                  return (
                    <MenuItem
                      key={r.key}
                      icon={
                        isCurrent ? (
                          <Check size={14} strokeWidth={2.6} />
                        ) : (
                          <span className={s.checkSpacer} />
                        )
                      }
                      onClick={() => {
                        close();
                        if (!isCurrent) onRoleChange?.(r.key);
                      }}
                    >
                      {r.label}
                    </MenuItem>
                  );
                })}
              </>
            )}
          </Dropdown>
        ) : (
          currentRole && <span className={s.rolePill}>{currentRole.label}</span>
        )}

        <nav data-tour="tour-nav" className={s.nav}>
          {navItems.map((item) => {
            const active = isActive(item, currentPath);
            return (
              <button
                key={item.key}
                type="button"
                data-tour={`tour-nav-${item.key.split('/').pop()}`}
                onClick={() => onNavigate(item.key)}
                className={s.navItem}
                data-active={active ? 'true' : undefined}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className={s.spacer} />

        {onCalendar && (
          <button
            type="button"
            onClick={onCalendar}
            aria-label={t('header.calendar')}
            className={s.iconBtn}
          >
            <Calendar size={18} strokeWidth={2.2} />
          </button>
        )}

        <Dropdown
          trigger={({ toggle, open }) => (
            <button
              type="button"
              data-tour="tour-nav-profile"
              onClick={toggle}
              className={s.avatarBtn}
              data-open={open ? 'true' : undefined}
            >
              <Avatar name={user.name} size="sm" />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div className={s.menuHeader}>
                <div className={s.menuName}>{user.name}</div>
                <div className={s.menuEmail}>{user.email}</div>
              </div>
              <MenuItem
                icon={<UserIcon size={16} strokeWidth={2.2} />}
                onClick={() => {
                  close();
                  onProfile?.();
                }}
              >
                {t('header.profile')}
              </MenuItem>
              {onHelp && (
                <MenuItem
                  icon={<HelpCircle size={16} strokeWidth={2.2} />}
                  onClick={() => {
                    close();
                    onHelp();
                  }}
                >
                  {helpLabel ?? 'Help'}
                </MenuItem>
              )}
              <div className={s.menuDivider} />
              <MenuItem
                icon={<LogOut size={16} strokeWidth={2.2} />}
                tone="danger"
                onClick={() => {
                  close();
                  onLogout?.();
                }}
              >
                {t('header.signOut')}
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
