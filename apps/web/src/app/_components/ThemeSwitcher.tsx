"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

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
            <div className="flex flex-wrap gap-4">
                {themes.map((t) => (
                    <div
                        key={t.id}
                        className="h-9 w-9 rounded-full bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-5">
            {themes.map((t) => {
                const isActive = theme === t.id;
                return (
                    <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className="group relative flex flex-col items-center gap-2"
                        title={t.name}
                    >
                        {/* 容器 */}
                        <div className="relative flex h-9 w-9 items-center justify-center">

                            {/* 选中态：外圈圆环 (支持渐变) */}
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1 : 0.8,
                                    opacity: isActive ? 1 : 0,
                                }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: t.color,
                                    maskImage: "radial-gradient(circle closest-side, transparent 83%, black 85%)",
                                    WebkitMaskImage: "radial-gradient(circle closest-side, transparent 83%, black 85%)",
                                }}
                            />

                            {/* 颜色圆球 (isActive时缩小) */}
                            <motion.div
                                className="absolute inset-0 rounded-full flex items-center justify-center"
                                initial={false}
                                animate={{
                                    scale: isActive ? 0.78 : 1, // 选中时缩小到 78% (约缩小 4px 边距)
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                style={{ background: t.color }}
                            >
                                {/* 选中态：对号 (仅在选中且缩小后显示) */}
                                <AnimatePresence>
                                    {isActive && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            transition={{ delay: 0.1, duration: 0.2 }}
                                        >
                                            <Icon icon="ri:check-line" className="text-white h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* 文本标签 */}
                        <span className={`text-[11px] font-medium transition-colors ${isActive ? "text-primary font-semibold" : "text-muted-foreground group-hover:text-primary"}`}>
                            {t.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
