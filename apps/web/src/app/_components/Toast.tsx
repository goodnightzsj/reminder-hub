"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

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
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // We want the newest toast to be at the front (index 0 after reverse)
    // Show max 4 toasts
    const visibleToasts = [...toasts].reverse().slice(0, 4);

    return createPortal(
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-none sm:bottom-8 sm:right-8">
            <AnimatePresence mode="popLayout">
                {visibleToasts.map((t, index) => {
                    // Calculate offset and scale for stacking effect
                    // index 0 is front/newest
                    // As index increases, items move "back" (upwards visually if bottom-aligned? or just behind)
                    // Let's stack them "behind" the first one, varying Y and Scale
                    // If expanded? No, just stack.

                    const isFront = index === 0;
                    const offset = index * 12; // 12px vertical spacing per card behind
                    const scale = 1 - index * 0.05; // Scale down 5% per card
                    const opacity = 1 - index * 0.2; // Fade out older cards

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
                                ${t.type === "success"
                                    ? "border-success/20 bg-success/10 text-success shadow-success/10"
                                    : t.type === "error"
                                        ? "border-danger/20 bg-danger/10 text-danger shadow-danger/10"
                                        : "border-white/10 bg-white/80 text-primary shadow-black/5 dark:bg-zinc-900/80"
                                }
                            `}
                            style={{
                                transformOrigin: "bottom center"
                            }}
                        >
                            <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${t.type === "success" ? "bg-success text-white" :
                                t.type === "error" ? "bg-danger text-white" : "bg-primary text-base"
                                }`}>
                                {t.type === "success" && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                {t.type === "error" && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>}
                                {t.type === "info" && <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                            </div>
                            <div className="flex-1 pt-0.5">
                                <p className="text-sm font-medium leading-tight">{t.message}</p>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>,
        document.body
    );
}
