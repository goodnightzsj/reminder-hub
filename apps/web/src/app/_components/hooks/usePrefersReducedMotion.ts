"use client";

import { useSyncExternalStore } from "react";

function getSnapshot(): boolean {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerSnapshot(): boolean {
    return false;
}

function subscribe(onStoreChange: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    mql.addEventListener?.("change", onStoreChange);
    return () => mql.removeEventListener?.("change", onStoreChange);
}

/**
 * 监听 `prefers-reduced-motion` 并返回是否应减弱动画。
 * 使用 useSyncExternalStore 以保证 SSR / CSR 快照一致、无 effect-set-state。
 */
export function usePrefersReducedMotion(): boolean {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
