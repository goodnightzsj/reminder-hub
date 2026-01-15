"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildCreateModalHref } from "@/lib/url";
import { ROUTES } from "@/lib/routes";

type KeyboardShortcutsProps = {
    onOpenSearch?: () => void;
};

export function KeyboardShortcuts({ onOpenSearch }: KeyboardShortcutsProps) {
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if user is typing in an input/textarea
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            const isMod = e.metaKey || e.ctrlKey;

            // Cmd/Ctrl + K: Open Search
            if (isMod && e.key === "k") {
                e.preventDefault();
                onOpenSearch?.();
                return;
            }

            // Cmd/Ctrl + N: New Todo
            if (isMod && e.key === "n") {
                e.preventDefault();
                router.push(buildCreateModalHref(ROUTES.todo));
                return;
            }

            // Cmd/Ctrl + /: Go to Settings
            if (isMod && e.key === "/") {
                e.preventDefault();
                router.push(ROUTES.settings);
                return;
            }

            // G then D: Go to Dashboard
            // G then T: Go to Todo
            // G then A: Go to Anniversaries
            // G then S: Go to Subscriptions
            // G then I: Go to Items
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [router, onOpenSearch]);

    return null; // This is a behavior-only component
}
