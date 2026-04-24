"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from "react";
import { m as motion, AnimatePresence } from "framer-motion";
import { useTimeouts } from "../hooks/useTimeouts";
import { Portal } from "./Portal";

type ToastType = "success" | "error" | "info";
type ToastItem = {
    id: string;
    message: string;
    type: ToastType;
};

function createToastId(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 11);
}

const toastCardClassNameByType: Record<ToastType, string> = {
    success:
        "border-brand-primary/20 bg-brand-primary/10 text-brand-primary shadow-brand-primary/10",
    error: "border-destructive/20 bg-destructive/10 text-destructive shadow-destructive/10",
    info: "border-border/40 bg-card/80 text-foreground shadow-sm backdrop-blur-xl",
};

const toastIconWrapperClassNameByType: Record<ToastType, string> = {
    success: "bg-brand-primary text-white",
    error: "bg-destructive text-white",
    info: "bg-primary text-primary-foreground",
};

const toastIconByType: Record<ToastType, ReactNode> = {
    success: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
            />
        </svg>
    ),
    error: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
            />
        </svg>
    ),
    info: (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
        </svg>
    ),
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
    const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const { scheduleTimeout, cancelTimeout } = useTimeouts();

    const removeToast = useCallback((id: string) => {
        const timer = timeoutsRef.current.get(id);
        cancelTimeout(timer ?? null);
        timeoutsRef.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, [cancelTimeout]);

    const addToast = useCallback((message: string, type: ToastType = "info") => {
        const id = createToastId();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss
        const timer = scheduleTimeout(() => removeToast(id), 3000);
        timeoutsRef.current.set(id, timer);
    }, [removeToast, scheduleTimeout]);

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
    if (typeof document === "undefined") return null;

    // We want the newest toast to be at the front (index 0 after reverse)
    // Show max 4 toasts
    const visibleToasts = [...toasts].reverse().slice(0, 4);

    return (
        <Portal>
            {/* 移动端：托起到 BottomNav 上方 + 安全区；桌面端无 BottomNav，回到 bottom-8 */}
            <div className="fixed right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px)+0.5rem)] z-[100] flex flex-col items-end pointer-events-none sm:right-8 sm:bottom-8">
                <AnimatePresence mode="popLayout">
                    {visibleToasts.map((t, index) => {
                        // Calculate offset and scale for stacking effect
                        // index 0 is front/newest
                        // As index increases, items move "back" (upwards visually if bottom-aligned? or just behind)
                        // Let's stack them "behind" the first one, varying Y and Scale
                        // If expanded? No, just stack.

                        const offset = index * 12; // 12px vertical spacing per card behind
                        const scale = 1 - index * 0.05; // Scale down 5% per card
                        const opacity = 1 - index * 0.2; // Fade out older cards

                        const cardClassName = toastCardClassNameByType[t.type];
                        const iconWrapperClassName = toastIconWrapperClassNameByType[t.type];
                        const icon = toastIconByType[t.type];

                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{
                                    opacity: opacity,
                                    y: -offset, // Move up as it gets older/pushed back? 
                                    // Actually, if we want them to stack BEHIND, and we are bottom-aligned:
                                    // To make them visible "behind", we usually move them UP (negative Y) if bottom-aligned.
                                    scale: scale,
                                    zIndex: 50 - index,
                                }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 300 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x > 100) {
                                        onDismiss(t.id);
                                    }
                                }}
                                className={`
                                    pointer-events-auto absolute bottom-0 right-0 
                                    flex w-[320px] items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-xl
                                    ${cardClassName}
                                `}
                                style={{
                                    transformOrigin: "bottom center"
                                }}
                            >
                                <div
                                    className={[
                                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                                        iconWrapperClassName,
                                    ].join(" ")}
                                >
                                    {icon}
                                </div>
                                <div className="min-w-0 flex-1 pt-0.5">
                                    <p className="text-sm font-medium leading-tight break-words">{t.message}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </Portal>
    );
}
