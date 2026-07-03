import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useHydrated } from '../useHydrated';
import s from './Toast.module.css';

export type ToastTone = 'success' | 'danger' | 'info';

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastContextValue {
  show: (toast: Omit<ToastItem, 'id'>) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICONS: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  danger: AlertCircle,
  info: Info,
};

export interface ToastProviderProps {
  children: ReactNode;
  defaultDurationMs?: number;
}

export function ToastProvider({
  children,
  defaultDurationMs = 4000,
}: Readonly<ToastProviderProps>) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      counter.current += 1;
      const id = `t${Date.now()}-${counter.current}`;
      setToasts((prev) => [...prev, { ...toast, id }]);
      return id;
    },
    [],
  );

  const success = useCallback(
    (title: string, description?: string) => show({ tone: 'success', title, description }),
    [show],
  );
  const error = useCallback(
    (title: string, description?: string) => show({ tone: 'danger', title, description }),
    [show],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ show, success, error, dismiss }),
    [show, success, error, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport
        toasts={toasts}
        defaultDurationMs={defaultDurationMs}
        onDismiss={dismiss}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}

function ToastViewport({
  toasts,
  defaultDurationMs,
  onDismiss,
}: Readonly<{
  toasts: ToastItem[];
  defaultDurationMs: number;
  onDismiss: (id: string) => void;
}>) {
  // The viewport is a portal into document.body, which only exists on the
  // client. Rendering it during SSR (or the first client render, before
  // hydration) would make the server HTML — nothing here — disagree with the
  // client, causing a hydration mismatch. Gate on hydration so both the server
  // and the initial client render output null, then portal in.
  const hydrated = useHydrated();

  if (!hydrated) return null;
  return createPortal(
    <div className={s.viewport}>
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          defaultDurationMs={defaultDurationMs}
          onDismiss={onDismiss}
        />
      ))}
    </div>,
    document.body,
  );
}

function ToastCard({
  toast,
  defaultDurationMs,
  onDismiss,
}: Readonly<{
  toast: ToastItem;
  defaultDurationMs: number;
  onDismiss: (id: string) => void;
}>) {
  const { tone, title, description, durationMs, id } = toast;
  const Icon = TONE_ICONS[tone];
  const duration = durationMs ?? defaultDurationMs;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  return (
    <div role="status" className={s.card} data-tone={tone}>
      <div className={s.icon} data-tone={tone}>
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div className={s.body}>
        <div className={s.title}>{title}</div>
        {description && <div className={s.description}>{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        className={s.close}
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}
