import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

export type ToastKind = "info" | "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  // If set, toast dismisses itself after this many ms; otherwise stays until action.
  ttlMs?: number;
};

type ToastContextValue = {
  show: (kind: ToastKind, message: string, ttlMs?: number) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, message: string, ttlMs: number | undefined = 3500) => {
      const id = ++counter.current;
      setToasts((list) => [...list, { id, kind, message, ttlMs }]);
    },
    [],
  );

  // Auto-dismiss per toast.
  useEffect(() => {
    const timers = toasts
      .filter((t) => typeof t.ttlMs === "number")
      .map((t) =>
        window.setTimeout(() => dismiss(t.id), t.ttlMs),
      );
    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [toasts, dismiss]);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-[360px]">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const KIND_CONFIG: Record<ToastKind, { icon: string; bar: string; iconColor: string }> = {
  info: {
    icon: "ri:information-line",
    bar: "bg-brand-primary",
    iconColor: "text-brand-primary",
  },
  success: {
    icon: "ri:checkbox-circle-line",
    bar: "bg-success",
    iconColor: "text-success",
  },
  error: {
    icon: "ri:error-warning-line",
    bar: "bg-danger",
    iconColor: "text-danger",
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = KIND_CONFIG[toast.kind];
  return (
    <div
      className="pointer-events-auto flex items-start gap-3 pl-0 pr-3 py-2.5 rounded-xl bg-glass shadow-lg animate-slide-up overflow-hidden"
      role="status"
    >
      <div className={`w-1 self-stretch ${cfg.bar}`} />
      <Icon icon={cfg.icon} className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.iconColor}`} />
      <div className="flex-1 text-sm text-foreground leading-snug">{toast.message}</div>
      <button
        onClick={onDismiss}
        aria-label="关闭提示"
        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      >
        <Icon icon="ri:close-line" className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
