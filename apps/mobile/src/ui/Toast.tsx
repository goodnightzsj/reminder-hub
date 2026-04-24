import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

export type ToastKind = "info" | "success" | "error";

type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
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

  useEffect(() => {
    const timers = toasts
      .filter((t) => typeof t.ttlMs === "number")
      .map((t) => window.setTimeout(() => dismiss(t.id), t.ttlMs));
    return () => {
      timers.forEach(window.clearTimeout);
    };
  }, [toasts, dismiss]);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/*
        Positioned just above the bottom tab bar (16rem = 64px tab + safe area).
        Pointer-events none on wrapper so toasts don't block tabs; each toast
        re-enables events for its own footprint.
      */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[9999] flex flex-col items-center gap-2 px-3 pb-[calc(env(safe-area-inset-bottom)+5rem)] pointer-events-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const KIND_CONFIG: Record<ToastKind, { icon: string; bar: string; iconColor: string }> = {
  info: { icon: "ri:information-line", bar: "bg-brand-primary", iconColor: "text-brand-primary" },
  success: { icon: "ri:checkbox-circle-line", bar: "bg-success", iconColor: "text-success" },
  error: { icon: "ri:error-warning-line", bar: "bg-danger", iconColor: "text-danger" },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const cfg = KIND_CONFIG[toast.kind];
  return (
    <div
      className="pointer-events-auto w-full max-w-[420px] flex items-stretch gap-0 rounded-2xl bg-glass shadow-xl animate-slide-up overflow-hidden"
      role="status"
    >
      <div className={`w-1 ${cfg.bar}`} />
      <div className="flex-1 flex items-center gap-2.5 px-3 py-3">
        <Icon icon={cfg.icon} className={`h-5 w-5 shrink-0 ${cfg.iconColor}`} />
        <div className="flex-1 text-sm text-foreground leading-snug">{toast.message}</div>
        <button
          onClick={onDismiss}
          aria-label="关闭提示"
          className="shrink-0 h-8 w-8 -mr-1 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted/60"
        >
          <Icon icon="ri:close-line" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
