"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "./Icons";
import { Input } from "./Input";

export function ExpandableSearch() {
    const [isExpanded, setIsExpanded] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isExpanded) {
            inputRef.current?.focus();
        }
    }, [isExpanded]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node) &&
                query.length === 0
            ) {
                setIsExpanded(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            // Optional: keep expanded or close?
            // Usually keep expanded or let the new page handle it.
            // But since we navigate away, it doesn't matter much unless specific transition.
        }
    };

    return (
        <div
            ref={containerRef}
            className={`relative flex items-center transition-all duration-300 ease-out ${isExpanded ? "w-64" : "w-10"
                }`}
        >
            {isExpanded ? (
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="relative">
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="搜索..."
                            className="h-9 w-full rounded-full border-default bg-surface/80 pl-9 pr-8 text-xs focus:ring-brand-primary/20 backdrop-blur-sm transition-all"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
                            <Icons.Search className="h-3.5 w-3.5" />
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setIsExpanded(false);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                        >
                            <Icons.X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setIsExpanded(true)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-interactive-hover hover:text-primary"
                    title="搜索"
                >
                    <Icons.Search className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
