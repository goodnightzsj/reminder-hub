"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { LazyMotion, domMax } from "framer-motion";
import { ToastProvider } from "./_components/ui/Toast";
import { KeyboardShortcuts } from "./_components/KeyboardShortcuts";
import { ConfettiProvider } from "./_components/ConfettiProvider";
import { ColorThemeInitializer } from "./_components/ColorThemeInitializer";

/**
 * LazyMotion + domMax：把 framer-motion 的 feature 集按需加载。
 * 配合项目内 33 个 `m as motion` 别名导入，首屏只会带入 LazyMotion 外壳（~3KB），
 * 实际动画/drag/layout 特性通过异步 chunk 加载（domMax ~15KB）。
 * 注意：domMax 已包含 drag + layout，满足 CreateModal 下滑关闭、BottomNav layoutId 等场景。
 */
export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <LazyMotion features={domMax} strict={false}>
                <ColorThemeInitializer />
                <ToastProvider>
                    <ConfettiProvider>
                        <KeyboardShortcuts />
                        {children}
                    </ConfettiProvider>
                </ToastProvider>
            </LazyMotion>
        </ThemeProvider>
    );
}
