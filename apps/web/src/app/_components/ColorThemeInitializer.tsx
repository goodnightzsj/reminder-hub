"use client";

import { useEffect } from "react";

import {
    COLOR_THEME_STORAGE_KEY,
    DEFAULT_COLOR_THEME_ID,
    isColorThemeId,
} from "@/lib/color-theme";

/**
 * ColorThemeInitializer reads the color theme from localStorage
 * and applies it to the document element on mount.
 * This runs once on app load to prevent flash of default theme.
 */
export function ColorThemeInitializer() {
    useEffect(() => {
        const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
        if (isColorThemeId(stored)) {
            document.documentElement.dataset.theme = stored;
        } else {
            document.documentElement.dataset.theme = DEFAULT_COLOR_THEME_ID;
        }
    }, []);

    return null;
}
