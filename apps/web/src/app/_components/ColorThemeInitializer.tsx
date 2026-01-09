"use client";

import { useEffect } from "react";

const STORAGE_KEY = "color-theme";
const DEFAULT_THEME = "ocean-blue";

/**
 * ColorThemeInitializer reads the color theme from localStorage
 * and applies it to the document element on mount.
 * This runs once on app load to prevent flash of default theme.
 */
export function ColorThemeInitializer() {
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        const validThemes = [
            "ocean-blue",
            "emerald",
            "notion-gray",
            "todoist-zeus",
            "ticktick-teal",
            "fintech-gold",
            "peach-fuzz",
            "aurora",
        ];
        if (stored && validThemes.includes(stored)) {
            document.documentElement.dataset.theme = stored;
        } else {
            document.documentElement.dataset.theme = DEFAULT_THEME;
        }
    }, []);

    return null;
}
