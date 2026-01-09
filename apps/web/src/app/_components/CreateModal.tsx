"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "./Icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CreateModalProps = {
    children: React.ReactNode;
    title: string;
};

export function CreateModal({ children, title }: CreateModalProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    // Check if modal should be open
    const isOpen = searchParams.get("modal") === "create";

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    // Handle ESC key to close modal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    const handleClose = () => {
        // Remove 'modal' param but keep others
        const params = new URLSearchParams(searchParams.toString());
        params.delete("modal");
        router.replace(`${pathname}?${params.toString()}`);
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-base sm:rounded-2xl rounded-t-2xl shadow-2xl border border-default flex flex-col max-h-[90dvh]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-divider">
                            <h2 className="text-lg font-semibold">{title}</h2>
                            <button
                                onClick={handleClose}
                                className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-surface"
                            >
                                <Icons.X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
