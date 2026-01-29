"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Portal } from "@/app/_components/ui/Portal";
import { useEscapeKey } from "../hooks/useEscapeKey";
import type { AppSettings, ChannelType } from "./NotificationChannelForms";
import { NOTIFICATION_CHANNEL_META } from "./NotificationChannels.meta";

export type NotificationChannelModalProps = {
    isOpen: boolean;
    onClose: () => void;
    channel: ChannelType | null;
    settings: AppSettings;
};

export function NotificationChannelModal({
    isOpen,
    onClose,
    channel,
    settings,
}: NotificationChannelModalProps) {
    useEscapeKey(onClose, isOpen);

    if (!channel) return null;
    const { modalTitle: title, icon, color, Form } = NOTIFICATION_CHANNEL_META[channel];

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        />
                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pointer-events-none"
                        >
                            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-default bg-elevated shadow-2xl pointer-events-auto flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-divider px-6 py-4 bg-surface/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-divider" style={{ color }}>
                                            <Icon icon={icon} className="h-5 w-5" />
                                        </div>
                                        <h2 className="text-lg font-semibold">{title}</h2>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full p-1 text-muted hover:bg-muted/10 transition-colors"
                                    >
                                        <Icon icon="ri:close-line" className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                                    <Form settings={settings} />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Portal>
    );
}
