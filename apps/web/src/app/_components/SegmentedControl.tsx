"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type SegmentOption<T extends string> = {
    key: T;
    label: string;
    href: string;
};

type SegmentedControlProps<T extends string> = {
    options: SegmentOption<T>[];
    currentValue: T;
    className?: string;
    /** 用于 Framer Motion layoutId 的唯一前缀 */
    layoutId?: string;
};

/**
 * iOS 风格的分段控制器，带滑动背景动画。
 * 使用 Framer Motion 的 layoutId 实现平滑过渡。
 */
export function SegmentedControl<T extends string>({
    options,
    currentValue,
    className = "",
    layoutId = "segment-indicator",
}: SegmentedControlProps<T>) {
    return (
        <nav
            className={`relative inline-flex items-center gap-0.5 rounded-xl bg-muted/30 p-1 ${className}`}
            role="tablist"
        >
            {options.map((opt) => {
                const isActive = opt.key === currentValue;
                return (
                    <Link
                        key={opt.key}
                        href={opt.href}
                        role="tab"
                        aria-selected={isActive}
                        className={`relative z-10 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors duration-200 ${isActive
                            ? "text-primary"
                            : "text-secondary hover:text-primary"
                            }`}
                    >
                        {isActive && (
                            <motion.span
                                layoutId={layoutId}
                                className="absolute inset-0 z-[-1] rounded-lg bg-white dark:bg-white/10 shadow-sm"
                                transition={{
                                    type: "spring",
                                    stiffness: 450,
                                    damping: 38,
                                    mass: 0.8,
                                }}
                            />
                        )}
                        {opt.label}
                    </Link>
                );
            })}
        </nav>
    );
}

