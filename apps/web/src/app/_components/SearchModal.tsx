"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Input } from "./Input";

type SearchModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

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

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg transform rounded-2xl border border-white/20 bg-white/90 p-4 shadow-2xl backdrop-blur-xl transition-all dark:bg-zinc-900/90 dark:border-white/10 animate-zoom-in">
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <svg
                        className="h-5 w-5 text-muted"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-transparent text-lg text-primary outline-none placeholder:text-muted"
                        placeholder="搜索..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md bg-surface px-2 py-1 text-xs font-medium text-secondary hover:bg-interactive-hover"
                        aria-label="关闭搜索"
                    >
                        ESC
                    </button>
                </form>

                {/* Quick Tips or Recent Searches could go here */}
                <div className="mt-4 border-t border-divider pt-3 text-xs text-muted">
                    输入关键词并回车搜索
                </div>
            </div>
        </div>,
        document.body
    );
}
