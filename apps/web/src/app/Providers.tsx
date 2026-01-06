"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { ToastProvider } from "./_components/Toast";
import { KeyboardShortcuts } from "./_components/KeyboardShortcuts";
import { ConfettiProvider } from "./_components/ConfettiProvider";

export function Providers({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ToastProvider>
                <ConfettiProvider>
                    <KeyboardShortcuts />
                    {children}
                </ConfettiProvider>
            </ToastProvider>
        </ThemeProvider>
    );
}
