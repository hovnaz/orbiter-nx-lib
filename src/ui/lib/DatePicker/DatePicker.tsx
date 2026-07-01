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
import s from './DatePicker.module.css';

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
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const isoRe = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2}))?$/;
  const dotRe = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[ T](\d{1,2}):(\d{1,2}))?$/;
  const isoMatch = isoRe.exec(trimmed);
  const dotMatch = dotRe.exec(trimmed);
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

  const showError = Boolean(error) || draftError;

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

  const placeholderText =
    placeholder ?? (withTime ? 'YYYY-MM-DD HH:mm' : 'YYYY-MM-DD');

  return (
    <div
      ref={ref}
      className={s.root}
      data-full={fullWidth ? 'true' : 'false'}
    >
      {label && (
        <label htmlFor={id} className={s.label}>
          {label}
          {required && <span className={s.required}>*</span>}
        </label>
      )}
      <div
        ref={triggerRef}
        className={s.trigger}
        data-full={fullWidth ? 'true' : 'false'}
        data-error={showError ? 'true' : undefined}
        data-disabled={disabled ? 'true' : undefined}
      >
        <button
          type="button"
          aria-label="Open calendar"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={s.calendarBtn}
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
          className={s.input}
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
            className={s.clearBtn}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        )}
      </div>
      {(hint || error) && (
        <span className={s.message} data-error={error ? 'true' : undefined}>
          {error || hint}
        </span>
      )}

      {open && popoverPos &&
        createPortal(
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={label || 'Date picker'}
          className={s.popover}
          style={
            {
              '--dp-top': `${popoverPos.top}px`,
              '--dp-left': `${popoverPos.left}px`,
            } as CSSProperties
          }
        >
          <div className={s.header}>
            <button
              type="button"
              onClick={() => nudgeMonth(-1)}
              aria-label="Previous month"
              className={s.iconBtn}
            >
              <ChevronLeft size={16} strokeWidth={2.2} />
            </button>
            <div className={s.monthLabel}>{monthLabel}</div>
            <button
              type="button"
              onClick={() => nudgeMonth(1)}
              aria-label="Next month"
              className={s.iconBtn}
            >
              <ChevronRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          <div className={s.weekdays}>
            {WEEKDAYS.map((w) => (
              <div key={w} className={s.weekday}>
                {w}
              </div>
            ))}
          </div>

          <div className={s.grid}>
            {grid.map((d, i) => {
              if (d === null)
                return <div key={`pad-${i}`} className={s.pad} />;
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
                  className={s.day}
                  data-selected={isSelected ? 'true' : undefined}
                  data-today={isToday ? 'true' : undefined}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {withTime && (
            <div className={s.timeRow}>
              <span className={s.timeLabel}>Time</span>
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
                className={s.timeInput}
              />
              <span className={s.timeColon}>:</span>
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
                className={s.timeInput}
              />
              <div className={s.timeSpacer} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className={s.doneBtn}
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

