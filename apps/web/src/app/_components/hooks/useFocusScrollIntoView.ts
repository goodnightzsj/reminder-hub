"use client";

import { useEffect } from "react";

/**
 * iOS Safari 在软键盘弹起时会把可视视口缩到键盘上方，但默认不会把聚焦的输入框 scroll
 * 到键盘上方，导致输入时被键盘挡住。该 hook 挂全局 focusin 监听：当焦点落到 input /
 * textarea / select / contenteditable 上时，延迟一帧调用 `scrollIntoView({ block: 'center' })`
 * 让其显式进入视口中央。
 *
 * 通过 `enabled` 让调用方可按条件挂载（如仅在 Modal 打开时）。
 */
export function useFocusScrollIntoView(enabled: boolean = true): void {
    useEffect(() => {
        if (!enabled) return;
        if (typeof window === "undefined") return;

        // 仅在触屏设备上启用，桌面键盘焦点无此问题
        const isTouch = window.matchMedia?.("(hover: none)").matches;
        if (!isTouch) return;

        const handler = (event: FocusEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            const tag = target.tagName;
            const isEditable =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT" ||
                target.isContentEditable;
            if (!isEditable) return;

            // 等键盘动画开始（~300ms）再滚到中心位置，避免滚到"屏幕中点"但键盘尚未弹起
            window.setTimeout(() => {
                try {
                    target.scrollIntoView({ block: "center", behavior: "smooth" });
                } catch {
                    // 旧浏览器可能不支持 options，忽略
                }
            }, 320);
        };

        document.addEventListener("focusin", handler);
        return () => {
            document.removeEventListener("focusin", handler);
        };
    }, [enabled]);
}
