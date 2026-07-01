import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

const POPOVER_HEIGHT_ESTIMATE_DATE = 320;
const POPOVER_HEIGHT_ESTIMATE_DATETIME = 380;

export interface DatePickerProps {
  value?: string;
  onChange: (next: string | undefined) => void;
  withTime?: boolean;
  min?: string;
  max?: string;
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  align?: 'left' | 'right';
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

interface ParsedValue {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

function parseValue(value: string | undefined): ParsedValue | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return { y, m, d, hh: 0, mm: 0 };
  }
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return null;
  return {
    y: dt.getFullYear(),
    m: dt.getMonth() + 1,
    d: dt.getDate(),
    hh: dt.getHours(),
    mm: dt.getMinutes(),
  };
}

function formatValue(p: ParsedValue, withTime: boolean): string {
  const date = `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
  if (!withTime) return date;
  return `${date}T${pad2(p.hh)}:${pad2(p.mm)}`;
}

/** Format for the editable input — fixed, parser-friendly form. */
function formatEditable(p: ParsedValue | null, withTime: boolean): string {
  if (!p) return '';
  const date = `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
  if (!withTime) return date;
  return `${date} ${pad2(p.hh)}:${pad2(p.mm)}`;
}

/**
 * Parse free-form user input. Accepts ISO (YYYY-MM-DD[ HH:mm]) and
 * day-first (DD.MM.YYYY / DD/MM/YYYY [HH:mm]).
 */
function parseEditable(
  raw: string,
  withTime: boolean,
): ParsedValue | null {
  const s = raw.trim();
  if (!s) return null;
  const isoRe = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?$/;
  const dotRe = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[ T](\d{1,2}):(\d{1,2}))?$/;
  const isoMatch = isoRe.exec(s);
  const dotMatch = dotRe.exec(s);
  let y: number;
  let m: number;
  let d: number;
  let hh = 0;
  let mm = 0;
  if (isoMatch) {
    y = Number(isoMatch[1]);
    m = Number(isoMatch[2]);
    d = Number(isoMatch[3]);
    if (isoMatch[4]) hh = Number(isoMatch[4]);
    if (isoMatch[5]) mm = Number(isoMatch[5]);
  } else if (dotMatch) {
    d = Number(dotMatch[1]);
    m = Number(dotMatch[2]);
    y = Number(dotMatch[3]);
    if (dotMatch[4]) hh = Number(dotMatch[4]);
    if (dotMatch[5]) mm = Number(dotMatch[5]);
  } else {
    return null;
  }
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > daysInMonth(y, m)) return null;
  if (withTime) {
    if (hh < 0 || hh > 23) return null;
    if (mm < 0 || mm > 59) return null;
  }
  return { y, m, d, hh, mm };
}

function startOfMonthOffset(y: number, m: number): number {
  // Returns 0..6 where 0=Mon
  const day = new Date(y, m - 1, 1).getDay();
  return (day + 6) % 7;
}

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function compareDays(a: ParsedValue, b: ParsedValue): number {
  if (a.y !== b.y) return a.y - b.y;
  if (a.m !== b.m) return a.m - b.m;
  return a.d - b.d;
}

export function DatePicker({
  value,
  onChange,
  withTime = false,
  min,
  max,
  label,
  hint,
  error,
  placeholder,
  disabled = false,
  required = false,
  fullWidth = true,
  align = 'left',
}: Readonly<DatePickerProps>) {
  const parsed = useMemo(() => parseValue(value), [value]);
  const minP = useMemo(() => parseValue(min), [min]);
  const maxP = useMemo(() => parseValue(max), [max]);

  const today = useMemo(() => {
    const t = new Date();
    return {
      y: t.getFullYear(),
      m: t.getMonth() + 1,
      d: t.getDate(),
      hh: 0,
      mm: 0,
    } satisfies ParsedValue;
  }, []);

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<{ y: number; m: number }>(() => ({
    y: parsed?.y ?? today.y,
    m: parsed?.m ?? today.m,
  }));
  // Viewport-relative coordinates for the portal'd popover. Recomputed on
  // open and on scroll/resize so the popover stays anchored to the trigger
  // even when the parent modal scrolls.
  const [popoverPos, setPopoverPos] = useState<{
    top: number;
    left: number;
    placement: 'down' | 'up';
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // Local input text — lets the user type freely without committing on every
  // keystroke; we only call onChange when the input parses cleanly OR on blur.
  const [draft, setDraft] = useState<string>(() =>
    formatEditable(parsed, withTime),
  );
  const [draftError, setDraftError] = useState(false);

  // Keep input in sync when external value changes (and the user isn't typing).
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setDraft(formatEditable(parsed, withTime));
    setDraftError(false);
  }, [parsed, withTime]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      const insideTrigger = !!ref.current?.contains(target);
      const insidePopover = !!popoverRef.current?.contains(target);
      if (!insideTrigger && !insidePopover) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (parsed && open)
      setView({ y: parsed.y, m: parsed.m });
  }, [open, parsed]);

  // Position the portal'd popover relative to the trigger using viewport
  // (fixed) coordinates. Re-runs on open + on scroll/resize so the popover
  // stays anchored when the surrounding modal/page scrolls.
  useLayoutEffect(() => {
    if (!open) return;
    const popoverWidth = 280;

    function reposition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const estimated = withTime
        ? POPOVER_HEIGHT_ESTIMATE_DATETIME
        : POPOVER_HEIGHT_ESTIMATE_DATE;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const placement: 'down' | 'up' =
        spaceBelow < estimated && spaceAbove > spaceBelow ? 'up' : 'down';
      const top =
        placement === 'down' ? rect.bottom + 6 : rect.top - 6 - estimated;
      // Align to align prop side; clamp so the popover stays in viewport.
      let left = align === 'right' ? rect.right - popoverWidth : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - popoverWidth - 8));
      setPopoverPos({ top, left, placement });
    }

    reposition();
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, withTime, align]);

  function emit(next: ParsedValue | null) {
    if (!next) {
      onChange(undefined);
      return;
    }
    onChange(formatValue(next, withTime));
  }

  function handleDraftChange(next: string) {
    setDraft(next);
    if (next.trim() === '') {
      setDraftError(false);
      onChange(undefined);
      return;
    }
    const p = parseEditable(next, withTime);
    if (p) {
      setDraftError(false);
      setView({ y: p.y, m: p.m });
      emit(p);
    } else {
      // Don't commit yet, but flag so the border turns red after a moment.
      setDraftError(true);
    }
  }

  function handleDraftBlur() {
    if (draft.trim() === '') {
      setDraftError(false);
      return;
    }
    const p = parseEditable(draft, withTime);
    if (p) {
      setDraftError(false);
      setDraft(formatEditable(p, withTime));
    } else {
      // Restore to last good value.
      setDraft(formatEditable(parsed, withTime));
      setDraftError(false);
    }
  }

  function pickDay(day: number) {
    const next: ParsedValue = {
      y: view.y,
      m: view.m,
      d: day,
      hh: parsed?.hh ?? 0,
      mm: parsed?.mm ?? 0,
    };
    emit(next);
    setDraft(formatEditable(next, withTime));
    setDraftError(false);
    if (!withTime) setOpen(false);
  }

  function nudgeMonth(delta: number) {
    setView((v) => {
      let m = v.m + delta;
      let y = v.y;
      while (m < 1) {
        m += 12;
        y -= 1;
      }
      while (m > 12) {
        m -= 12;
        y += 1;
      }
      return { y, m };
    });
  }

  function isOutOfRange(day: ParsedValue): boolean {
    if (minP && compareDays(day, minP) < 0) return true;
    if (maxP && compareDays(day, maxP) > 0) return true;
    return false;
  }

  const showError = error || (draftError ? ' ' : '');
  const borderColor = showError ? 'var(--danger)' : 'var(--border)';

  const grid: (number | null)[] = [];
  const lead = startOfMonthOffset(view.y, view.m);
  for (let i = 0; i < lead; i += 1) grid.push(null);
  const totalDays = daysInMonth(view.y, view.m);
  for (let d = 1; d <= totalDays; d += 1) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);

  const monthLabel = new Date(view.y, view.m - 1, 1).toLocaleDateString(
    undefined,
    { month: 'long', year: 'numeric' },
  );

  const triggerStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    width: fullWidth ? '100%' : 'auto',
    padding: '6px 10px',
    minHeight: 38,
    fontSize: 14,
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    background: 'var(--bg-elevated)',
    border: `1px solid ${borderColor}`,
    borderRadius: 'var(--r-sm)',
    cursor: disabled ? 'not-allowed' : 'text',
    opacity: disabled ? 0.6 : 1,
  };

  const inputStyle: CSSProperties = {
    flex: 1,
    minWidth: 0,
    padding: 0,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    color: 'inherit',
    font: 'inherit',
  };

  const placeholderText =
    placeholder ?? (withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');

  return (
    <div
      ref={ref}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          {label}
          {required && (
            <span style={{ color: 'var(--danger)', marginLeft: 2 }}>*</span>
          )}
        </label>
      )}
      <div ref={triggerRef} style={triggerStyle}>
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            padding: 0,
            color: 'var(--text-muted)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          <Calendar size={14} strokeWidth={2} />
        </button>
        <input
          id={id}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          placeholder={placeholderText}
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onBlur={handleDraftBlur}
          onFocus={() => setOpen(true)}
          style={inputStyle}
        />
        {parsed && !disabled && (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              emit(null);
              setDraft('');
              setDraftError(false);
              setOpen(false);
            }}
            style={{
              display: 'inline-flex',
              padding: 2,
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              borderRadius: 'var(--r-xs)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        )}
      </div>
      {(hint || error) && (
        <span
          style={{
            fontSize: 11,
            color: error ? 'var(--danger)' : 'var(--text-muted)',
          }}
        >
          {error || hint}
        </span>
      )}

      {open && popoverPos &&
        createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={label || 'Date picker'}
          style={{
            position: 'fixed',
            top: popoverPos.top,
            left: popoverPos.left,
            zIndex: 1000,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh-lg)',
            padding: 12,
            width: 280,
            animation: 'modalIn 160ms var(--ease-out)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <button
              type="button"
              onClick={() => nudgeMonth(-1)}
              aria-label="Previous month"
              style={iconBtnStyle}
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                textTransform: 'capitalize',
              }}
            >
              {monthLabel}
            </div>
            <button
              type="button"
              onClick={() => nudgeMonth(1)}
              aria-label="Next month"
              style={iconBtnStyle}
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
              marginBottom: 4,
            }}
          >
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: '4px 0',
                }}
              >
                {w}
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: 2,
            }}
          >
            {grid.map((d, i) => {
              if (d === null)
                return <div key={`pad-${i}`} style={{ height: 32 }} />;
              const cell: ParsedValue = {
                y: view.y,
                m: view.m,
                d,
                hh: 0,
                mm: 0,
              };
              const isSelected =
                parsed &&
                parsed.y === view.y &&
                parsed.m === view.m &&
                parsed.d === d;
              const isToday =
                today.y === view.y && today.m === view.m && today.d === d;
              const out = isOutOfRange(cell);
              return (
                <button
                  key={d}
                  type="button"
                  disabled={out}
                  onClick={() => pickDay(d)}
                  style={dayBtnStyle({
                    selected: Boolean(isSelected),
                    today: isToday,
                    disabled: out,
                  })}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {withTime && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: 10.5,
                }}
              >
                Time
              </span>
              <input
                type="number"
                min={0}
                max={23}
                value={pad2(parsed?.hh ?? 0)}
                onChange={(e) => {
                  const v = Math.max(
                    0,
                    Math.min(23, Number(e.target.value) || 0),
                  );
                  if (!parsed) {
                    emit({ ...today, hh: v, mm: 0 });
                    return;
                  }
                  emit({ ...parsed, hh: v });
                }}
                aria-label="Hours"
                style={timeInputStyle}
              />
              <span style={{ fontWeight: 700 }}>:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={pad2(parsed?.mm ?? 0)}
                onChange={(e) => {
                  const v = Math.max(
                    0,
                    Math.min(59, Number(e.target.value) || 0),
                  );
                  if (!parsed) {
                    emit({ ...today, hh: 0, mm: v });
                    return;
                  }
                  emit({ ...parsed, mm: v });
                }}
                aria-label="Minutes"
                style={timeInputStyle}
              />
              <div style={{ flex: 1 }} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--teal-pressed)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                }}
              >
                Done
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

const iconBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 28,
  height: 28,
  padding: 0,
  background: 'transparent',
  color: 'var(--text-secondary)',
  border: '1px solid transparent',
  borderRadius: 'var(--r-sm)',
  cursor: 'pointer',
};

const timeInputStyle: CSSProperties = {
  width: 50,
  padding: '4px 6px',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  textAlign: 'center',
  color: 'var(--text-primary)',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-sm)',
  outline: 'none',
};

function dayBtnStyle({
  selected,
  today,
  disabled,
}: {
  selected: boolean;
  today: boolean;
  disabled: boolean;
}): CSSProperties {
  let background = 'transparent';
  let color = 'var(--text-primary)';
  let border = '1px solid transparent';
  if (disabled) {
    color = 'var(--text-muted)';
  } else if (selected) {
    background = 'var(--teal)';
    color = '#fff';
  } else if (today) {
    border = '1px solid var(--teal)';
    color = 'var(--teal-pressed)';
  }
  return {
    height: 32,
    fontSize: 12.5,
    fontFamily: 'var(--font-mono)',
    fontWeight: 600,
    color,
    background,
    border,
    borderRadius: 'var(--r-sm)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
  };
}
