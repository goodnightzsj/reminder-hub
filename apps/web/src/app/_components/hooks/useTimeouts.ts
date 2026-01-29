"use client";

import { useCallback, useEffect, useRef } from "react";

export function useTimeouts() {
    const timeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

    const scheduleTimeout = useCallback((fn: () => void, delayMs: number) => {
        const timer = setTimeout(() => {
            timeoutsRef.current.delete(timer);
            fn();
        }, delayMs);

        timeoutsRef.current.add(timer);
        return timer;
    }, []);

    const cancelTimeout = useCallback((timer: ReturnType<typeof setTimeout> | null) => {
        if (!timer) return;
        clearTimeout(timer);
        timeoutsRef.current.delete(timer);
    }, []);

    useEffect(() => {
        const timeouts = timeoutsRef.current;
        return () => {
            for (const timer of timeouts.values()) {
                clearTimeout(timer);
            }
            timeouts.clear();
        };
    }, []);

    return { scheduleTimeout, cancelTimeout };
}
