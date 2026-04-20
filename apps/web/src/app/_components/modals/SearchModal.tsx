"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { IconSearch } from "../Icons";
import { useTimeouts } from "../hooks/useTimeouts";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useEscapeKey } from "../hooks/useEscapeKey";
import { useFocusScrollIntoView } from "../hooks/useFocusScrollIntoView";
import { Portal } from "../ui/Portal";
import { buildSearchHref } from "../../../lib/url";

type SearchModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const { scheduleTimeout, cancelTimeout } = useTimeouts();

    useBodyScrollLock(isOpen);
    useEscapeKey(onClose, isOpen);
    useFocusScrollIntoView(isOpen);

    useEffect(() => {
        let focusTimer: ReturnType<typeof setTimeout> | null = null;
        if (isOpen) {
            focusTimer = scheduleTimeout(() => inputRef.current?.focus(), 100);
        }
        return () => {
            cancelTimeout(focusTimer);
        };
    }, [isOpen, scheduleTimeout, cancelTimeout]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(buildSearchHref(query));
        onClose();
    };

    return (
        <Portal>
            <AnimatePresence>
                {isOpen && (
                    <div
                        // 移动端从顶部展开（避免键盘把面板推上去），桌面端保留 spotlight 居中上移
                        className="fixed inset-0 z-50 flex items-start justify-center px-0 sm:px-4 sm:pt-[20vh]"
                        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={onClose}
                        />

                        {/* Modal Content */}
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="搜索"
                            initial={{ opacity: 0, scale: 0.98, y: -12 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: -12 }}
                            transition={{ type: "spring", duration: 0.35, bounce: 0.22 }}
                            className="relative w-full max-w-lg overflow-hidden border border-white/20 bg-white/90 p-0 shadow-2xl backdrop-blur-2xl dark:bg-zinc-900/90 dark:border-white/10 rounded-b-2xl sm:rounded-2xl"
                        >
                            {/* Spotlight glow */}
                            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                                <div className="absolute -top-[50%] left-[20%] w-[60%] h-[100%] bg-brand-primary/10 blur-[80px] rounded-full animate-pulse-slow" />
                            </div>

                            <div className="relative z-10 p-4">
                                <form onSubmit={handleSearch} className="flex items-center gap-3">
                                    <IconSearch aria-hidden="true" className="h-5 w-5 text-muted/80 ml-1 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="flex-1 bg-transparent text-lg text-primary outline-none placeholder:text-muted/60 h-11"
                                        placeholder="搜索待办、纪念日、订阅、物品…"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        autoComplete="off"
                                        aria-label="搜索关键词"
                                    />
                                    {/* 移动端用"取消"，桌面端用"ESC" */}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="关闭搜索"
                                        className="hidden sm:inline-flex rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-primary transition-colors"
                                    >
                                        ESC
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        aria-label="关闭搜索"
                                        className="sm:hidden inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-muted hover:text-primary transition-colors"
                                    >
                                        取消
                                    </button>
                                </form>
                            </div>

                            {/* Quick tips footer — pb-safe 让 Home Indicator 不压在提示上 */}
                            <div className="relative z-10 border-t border-divider bg-surface/50 px-4 py-2.5 pb-safe">
                                <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                                    <span>支持自然语言搜索</span>
                                    <div className="hidden sm:flex gap-2">
                                        <span>↵ 确认</span>
                                        <span>↑↓ 切换</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
