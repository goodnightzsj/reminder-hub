"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "../Icons";
import { useCreateModal } from "../hooks/useCreateModal";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { Portal } from "../ui/Portal";

type CreateModalProps = {
    children: React.ReactNode;
    title: string;
};

export function CreateModal({ children, title }: CreateModalProps) {
    const { isOpen, close } = useCreateModal();

    useBodyScrollLock(isOpen);

    useEscapeKey(close, isOpen);

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={close}
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
                                    onClick={close}
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
            </AnimatePresence>
        </Portal>
    );
}
