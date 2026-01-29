"use client";

import { useEffect } from "react";

export function useEscapeKey(onEscape: () => void, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        if (typeof window === "undefined") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onEscape();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [enabled, onEscape]);
}

