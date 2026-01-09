"use client";

import { useEffect, useState } from "react";

const themes = [
    { id: "ocean-blue", name: "信任蓝", color: "hsl(217 91% 60%)" },
    { id: "emerald", name: "翡翠绿", color: "hsl(160 84% 39%)" },
    { id: "notion-gray", name: "棕橙", color: "hsl(32 30% 45%)" },
    { id: "todoist-zeus", name: "橄榄绿", color: "hsl(78 45% 40%)" },
    { id: "ticktick-teal", name: "青蓝", color: "hsl(174 72% 40%)" },
    { id: "fintech-gold", name: "金色", color: "hsl(45 93% 47%)" },
    { id: "peach-fuzz", name: "蜜桃", color: "hsl(24 73% 67%)" },
    { id: "aurora", name: "极光", color: "linear-gradient(135deg, hsl(210 100% 50%), hsl(328 100% 54%))" },
] as const;

type ThemeId = (typeof themes)[number]["id"];

const STORAGE_KEY = "color-theme";
const DEFAULT_THEME: ThemeId = "ocean-blue";

export function useColorTheme() {
    const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
        if (stored && themes.some((t) => t.id === stored)) {
            setThemeState(stored);
            document.documentElement.dataset.theme = stored;
        } else {
            document.documentElement.dataset.theme = DEFAULT_THEME;
        }
    }, []);

    const setTheme = (newTheme: ThemeId) => {
        setThemeState(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
        document.documentElement.dataset.theme = newTheme;
    };

    return { theme, setTheme, mounted };
}

export function ThemeSwitcher() {
    const { theme, setTheme, mounted } = useColorTheme();

    if (!mounted) {
        return (
            <div className="grid grid-cols-4 gap-2">
                {themes.map((t) => (
                    <div
                        key={t.id}
                        className="h-8 w-8 rounded-full bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {themes.map((t) => (
                <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`group flex flex-col items-center gap-1.5 rounded-lg p-2 transition-all hover:bg-muted/50 ${theme === t.id ? "bg-muted ring-2 ring-brand-primary ring-offset-2 ring-offset-background" : ""
                        }`}
                    title={t.name}
                >
                    <div
                        className="h-8 w-8 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-110"
                        style={{ background: t.color }}
                    />
                    <span className="text-[10px] text-secondary group-hover:text-primary truncate max-w-full">
                        {t.name}
                    </span>
                </button>
            ))}
        </div>
    );
}
