"use client";

import { useEffect } from "react";
import { Button } from "./Button";
import { motion, AnimatePresence } from "framer-motion";
import { useBodyScrollLock } from "./useBodyScrollLock";
import { useEscapeKey } from "./useEscapeKey";
import { Portal } from "./Portal";

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
};

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "确认操作",
    message,
    confirmLabel = "确定",
    cancelLabel = "取消",
    isDestructive = false,
}: ConfirmModalProps) {
    useBodyScrollLock(isOpen);
    useEscapeKey(onClose, isOpen);

    useEffect(() => {
        const mainContent = document.getElementById("main-content");
        if (isOpen) {
            mainContent?.classList.add("recess-effect");
        } else {
            mainContent?.classList.remove("recess-effect");
        }
        return () => {
            mainContent?.classList.remove("recess-effect");
        };
    }, [isOpen]);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/60 backdrop-blur-md"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={`relative w-full max-w-sm mx-4 transform overflow-hidden rounded-[2rem] border bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl p-8 shadow-2xl ${isDestructive ? "border-danger/30" : "border-white/10"}`}
                        >
                            <div className="flex flex-col items-center gap-6 text-center">
                                {isDestructive && (
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10 text-danger shadow-inner">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <h3 className={`text-xl font-bold tracking-tight ${isDestructive ? "text-danger" : "text-primary"}`}>
                                        {title}
                                    </h3>
                                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-xl text-base font-semibold"
                                >
                                    {cancelLabel}
                                </Button>
                                <Button
                                    variant={isDestructive ? "danger" : "primary"}
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 h-12 rounded-xl text-base font-semibold ${isDestructive ? "shadow-lg shadow-danger/25" : "shadow-lg shadow-brand-primary/25"}`}
                                >
                                    {confirmLabel}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
