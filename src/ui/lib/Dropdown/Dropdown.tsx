import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface DropdownTriggerArgs {
  open: boolean;
  toggle: () => void;
}

export interface DropdownChildArgs {
  close: () => void;
}

export interface DropdownProps {
  trigger: (args: DropdownTriggerArgs) => ReactNode;
  children: ReactNode | ((args: DropdownChildArgs) => ReactNode);
  align?: 'left' | 'right';
  minWidth?: number;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  minWidth = 220,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          style={{
            position: 'absolute',
            [align]: 0,
            top: 'calc(100% + 8px)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            boxShadow: 'var(--sh-lg)',
            minWidth,
            padding: 6,
            zIndex: 50,
            animation: 'modalIn 180ms var(--ease-out)',
          }}
        >
          {typeof children === 'function'
            ? children({ close: () => setOpen(false) })
            : children}
        </div>
      )}
    </div>
  );
}
