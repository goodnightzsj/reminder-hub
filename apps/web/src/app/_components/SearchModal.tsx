import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Icons } from "./Icons";

type SearchModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Handle ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onClose]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        router.push(`/search?q=${encodeURIComponent(query)}`);
        onClose();
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
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
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white/90 p-0 shadow-2xl backdrop-blur-2xl dark:bg-zinc-900/90 dark:border-white/10"
                    >
                        {/* Spotlight Glow Effect */}
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                            <div className="absolute -top-[50%] left-[20%] w-[60%] h-[100%] bg-brand-primary/10 blur-[80px] rounded-full animate-pulse-slow" />
                        </div>

                        <div className="relative z-10 p-4">
                            <form onSubmit={handleSearch} className="flex items-center gap-3">
                                <Icons.Search className="h-5 w-5 text-muted/80 ml-1" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="flex-1 bg-transparent text-lg text-primary outline-none placeholder:text-muted/60 h-10"
                                    placeholder="搜索..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:text-primary transition-colors"
                                    >
                                        ESC
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Quick Tips Footer (Static for now, but styled) */}
                        <div className="relative z-10 border-t border-divider bg-surface/50 px-4 py-2.5">
                            <div className="flex items-center justify-between text-[10px] text-muted font-medium">
                                <span>支持自然语言搜索</span>
                                <div className="flex gap-2">
                                    <span>↵ 确认</span>
                                    <span>↑↓ 切换</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
