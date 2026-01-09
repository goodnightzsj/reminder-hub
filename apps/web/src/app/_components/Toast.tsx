"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";
type ToastItem = {
    id: string;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    toast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            removeToast(id);
        }, 3000);
    }, [removeToast]);

    const value = useMemo(() => ({
        toast: addToast,
        success: (msg: string) => addToast(msg, "success"),
        error: (msg: string) => addToast(msg, "error"),
    }), [addToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: string) => void }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    onClick={() => onDismiss(t.id)}
                    className={`
            min-w-[300px] max-w-sm cursor-pointer rounded-lg border p-4 shadow-lg transition-all animate-slide-up
                    ${t.type === "success"
                            ? "border-success/20 bg-success/10 text-success"
                            : t.type === "error"
                                ? "border-danger/20 bg-danger/10 text-danger"
                                : "border-default bg-elevated text-primary"
                        }
          `}
                >
                    <div className="text-sm font-medium">{t.message}</div>
                </div>
            ))}
        </div>,
        document.body
    );
}
