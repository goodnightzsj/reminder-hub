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

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl border border-default bg-elevated p-6 shadow-2xl transition-all animate-zoom-in">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-primary">{title}</h3>
                    <p className="mt-2 text-sm text-secondary">{message}</p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </Button>
                    <Button
                        variant={isDestructive ? "danger" : "primary"}
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
}
