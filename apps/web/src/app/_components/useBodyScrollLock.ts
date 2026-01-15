"use client";

import { useEffect } from "react";

let lockCount = 0;
let savedBodyOverflow: string | null = null;

export function useBodyScrollLock(locked: boolean) {
    useEffect(() => {
        if (!locked) return;
        if (typeof document === "undefined") return;

        const { body } = document;
        if (!body) return;

        if (lockCount === 0) {
            savedBodyOverflow = body.style.overflow;
            body.style.overflow = "hidden";
        }

        lockCount += 1;

        return () => {
            if (typeof document === "undefined") return;
            const { body } = document;
            if (!body) return;

            lockCount = Math.max(0, lockCount - 1);

            if (lockCount === 0) {
                body.style.overflow = savedBodyOverflow ?? "";
                savedBodyOverflow = null;
            }
        };
    }, [locked]);
}

