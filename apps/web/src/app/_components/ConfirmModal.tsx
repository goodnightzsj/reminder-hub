"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const raf = requestAnimationFrame(() => setMounted(true));
        // Lock scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            cancelAnimationFrame(raf);
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-sm mx-4 transform overflow-hidden rounded-2xl border bg-elevated p-6 shadow-2xl transition-all animate-zoom-in ${isDestructive ? "border-danger/30" : "border-default"}`}>
                <div className="flex flex-col items-center gap-4 text-center">
                    {isDestructive && (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger animate-in zoom-in duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                        </div>
                    )}

                    <div className="space-y-1">
                        <h3 className={`text-lg font-bold tracking-tight ${isDestructive ? "text-danger" : "text-primary"}`}>
                            {title}
                        </h3>
                        <p className="text-sm font-medium text-secondary">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="flex-1"
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDestructive ? "danger" : "primary"}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`flex-1 ${isDestructive ? "shadow-lg shadow-danger/20" : ""}`}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
