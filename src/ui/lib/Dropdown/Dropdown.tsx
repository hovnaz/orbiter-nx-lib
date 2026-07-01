import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import s from './Dropdown.module.css';

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
    <div ref={ref} className={s.root}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={s.menu}
          data-align={align}
          style={{ '--dropdown-min-width': `${minWidth}px` } as CSSProperties}
        >
          {typeof children === 'function'
            ? children({ close: () => setOpen(false) })
            : children}
        </div>
      )}
    </div>
  );
}
