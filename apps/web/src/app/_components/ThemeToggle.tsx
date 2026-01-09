"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Magnetic } from "./Magnetic";
import { Tooltip } from "./Tooltip";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        const raf = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(raf);
    }, []);

    if (!mounted) return <div className="h-9 w-9" />; // Placeholder

    const toggleTheme = (event: React.MouseEvent) => {
        const x = event.clientX;
        const y = event.clientY;

        const mutateTheme = () => {
            if (theme === "light") setTheme("dark");
            else if (theme === "dark") setTheme("system");
            else setTheme("light");
        };

        // Fallback for browsers that don't support View Transitions
        if (!(document as any).startViewTransition) {
            mutateTheme();
            return;
        }

        const transition = (document as any).startViewTransition(() => {
            mutateTheme();
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(150% at ${x}px ${y}px)`,
            ];
            document.documentElement.animate(
                {
                    clipPath: theme === "dark" ? clipPath.reverse() : clipPath,
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    pseudoElement: theme === "dark" ? "::view-transition-old(root)" : "::view-transition-new(root)",
                }
            );
        });
    };

    const getIcon = () => {
        if (theme === "system") {
            return (
                // Laptop/System Icon
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <rect width="20" height="14" x="2" y="3" rx="2" />
                    <line x1="8" x2="16" y1="21" y2="21" />
                    <line x1="12" x2="12" y1="17" y2="21" />
                </svg>
            );
        }
        if (theme === "dark") {
            return (
                // Moon Icon
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
            );
        }
        // Light/Sun Icon
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
            </svg>
        );
    };

    const getTooltip = () => {
        if (theme === "light") return "切换至深色模式";
        if (theme === "dark") return "切换至系统模式";
        return "切换至浅色模式";
    };

    return (
        <Magnetic strength={0.3}>
            <Tooltip content={getTooltip()} side="bottom">
                <button
                    onClick={(e) => toggleTheme(e)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-interactive-hover hover:text-primary active-press"
                    aria-label="Toggle theme"
                >
                    {getIcon()}
                </button>
            </Tooltip>
        </Magnetic>
    );
}
