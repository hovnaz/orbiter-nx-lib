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

const TONES: Record<
  ToastTone,
  {
    bg: string;
    border: string;
    color: string;
    Icon: typeof CheckCircle2;
  }
> = {
  success: {
    bg: 'var(--success-soft)',
    border: 'var(--success)',
    color: '#15803D',
    Icon: CheckCircle2,
  },
  danger: {
    bg: 'var(--danger-soft)',
    border: 'var(--danger)',
    color: '#B91C1C',
    Icon: AlertCircle,
  },
  info: {
    bg: 'var(--info-soft)',
    border: 'var(--info)',
    color: '#1D4ED8',
    Icon: Info,
  },
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
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
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
  const tones = TONES[tone];
  const { Icon } = tones;
  const duration = durationMs ?? defaultDurationMs;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  return (
    <div
      role="status"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        padding: '12px 14px',
        minWidth: 280,
        maxWidth: 360,
        background: 'var(--bg-elevated)',
        border: `1px solid ${tones.border}`,
        borderLeft: `4px solid ${tones.border}`,
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--sh-md)',
        animation: 'fadeInUp 200ms var(--ease-out)',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: tones.bg,
          color: tones.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} strokeWidth={2.4} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-secondary)',
              marginTop: 2,
              lineHeight: 1.45,
            }}
          >
            {description}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 2,
          display: 'inline-flex',
        }}
      >
        <X size={14} strokeWidth={2.2} />
      </button>
    </div>
  );
}
