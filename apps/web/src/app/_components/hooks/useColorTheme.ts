"use client";

import { useEffect, useState } from "react";
import {
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME_ID,
  type ColorThemeId,
  isColorThemeId,
} from "@/lib/color-theme";

export function useColorTheme() {
  const [theme, setThemeState] = useState<ColorThemeId>(DEFAULT_COLOR_THEME_ID);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setMounted(true);
      const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
      if (isColorThemeId(stored)) {
        setThemeState(stored);
        document.documentElement.dataset.theme = stored;
      } else {
        document.documentElement.dataset.theme = DEFAULT_COLOR_THEME_ID;
      }
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  const setTheme = (newTheme: ColorThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem(COLOR_THEME_STORAGE_KEY, newTheme);
    document.documentElement.dataset.theme = newTheme;
  };

  return { theme, setTheme, mounted };
}
