"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ToastProvider } from "./_components/ui/Toast";
import { KeyboardShortcuts } from "./_components/KeyboardShortcuts";
import { ConfettiProvider } from "./_components/ConfettiProvider";
import { ColorThemeInitializer } from "./_components/ColorThemeInitializer";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ColorThemeInitializer />
            <ToastProvider>
                <ConfettiProvider>
                    <KeyboardShortcuts />
                    {children}
                </ConfettiProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}

