import {
  Calendar,
  Check,
  ChevronDown,
  HelpCircle,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../Avatar/Avatar';
import { Badge } from '../Badge/Badge';
import { Dropdown } from '../Dropdown/Dropdown';
import { MenuItem } from '../MenuItem/MenuItem';
import { OrbitGlyph } from '../OrbitGlyph/OrbitGlyph';

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
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: 64,
        background: 'var(--bg-translucent)',
        backdropFilter: 'saturate(180%) blur(14px)',
        WebkitBackdropFilter: 'saturate(180%) blur(14px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          height: '100%',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <button
          type="button"
          onClick={onLogoClick}
          aria-label={t('header.goHome')}
          disabled={!onLogoClick}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: 0,
            background: 'transparent',
            border: 'none',
            cursor: onLogoClick ? 'pointer' : 'default',
            color: 'inherit',
            font: 'inherit',
          }}
        >
          <OrbitGlyph size={32} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: '-0.02em',
              }}
            >
              Orbiter
            </span>
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 6px 4px 10px',
                  height: 26,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                  background: open
                    ? 'var(--bg-section)'
                    : 'var(--bg-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition:
                    'background 120ms var(--ease-out), border-color 120ms var(--ease-out)',
                }}
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
                          <span style={{ width: 14 }} />
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
          currentRole && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 10px',
                height: 26,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
              }}
            >
              {currentRole.label}
            </span>
          )
        )}

        <nav data-tour="tour-nav" style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {navItems.map((item) => {
            const active = isActive(item, currentPath);
            return (
              <button
                key={item.key}
                type="button"
                data-tour={`tour-nav-${item.key.split('/').pop()}`}
                onClick={() => onNavigate(item.key)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--r-md)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: active ? 'var(--bg-section)' : 'transparent',
                  transition:
                    'background 120ms var(--ease-out), color 120ms var(--ease-out)',
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {onCalendar && (
          <button
            type="button"
            onClick={onCalendar}
            aria-label={t('header.calendar')}
            style={{
              width: 36,
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--r-md)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
              transition: 'background 120ms var(--ease-out), color 120ms var(--ease-out)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-section)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
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
              style={{
                padding: 2,
                borderRadius: '50%',
                boxShadow: open ? 'var(--sh-glow)' : 'none',
                transition: 'box-shadow 120ms var(--ease-out)',
              }}
            >
              <Avatar name={user.name} size="sm" />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <div
                style={{
                  padding: '10px 12px 8px',
                  borderBottom: '1px solid var(--border-subtle)',
                  marginBottom: 6,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {user.email}
                </div>
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
              <div
                style={{
                  height: 1,
                  background: 'var(--border-subtle)',
                  margin: '6px 4px',
                }}
              />
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
