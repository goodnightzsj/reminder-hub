"use client";

import { useState, type ReactNode } from "react";
import { IconChevronRight } from "../Icons";

type AdvancedOptionsProps = {
    children: ReactNode;
    /** 触发行文本；默认"更多选项" */
    label?: string;
    /** 默认是否展开 */
    defaultOpen?: boolean;
    className?: string;
};

/**
 * 表单的渐进披露容器：核心字段常驻，次要字段折在这里。
 * 首次打开表单时默认收起，降低首屏认知负担。
 */
export function AdvancedOptions({
    children,
    label = "更多选项",
    defaultOpen = false,
    className = "",
}: AdvancedOptionsProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={className}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="group flex w-full items-center justify-between rounded-lg px-0.5 py-1 text-xs font-medium text-secondary hover:text-primary transition-colors"
            >
                <span>{label}</span>
                <IconChevronRight
                    aria-hidden="true"
                    className={`h-4 w-4 text-muted transition-transform duration-200 ${open ? "rotate-90" : ""}`}
                />
            </button>
            {/* grid-template-rows 过渡保证高度动画不抖字；关闭时不渲染内容可避免 tab 泄漏 */}
            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? "grid-rows-[1fr] mt-3" : "grid-rows-[0fr]"}`}
            >
                <div className="overflow-hidden">
                    {open && children}
                </div>
            </div>
        </div>
    );
}
