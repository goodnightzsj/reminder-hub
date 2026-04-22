"use client";

import { ReactNode } from "react";
import { IconBox } from "../Icons";
import { cn } from "../../../lib/utils";
import { m as motion } from "framer-motion";

type EmptyStateProps = {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
    variant?: "default" | "minimal";
};

/**
 * Beautiful empty state component with SVG Illustration support.
 * Pro Max: Uses consistent SVG illustrations and glassmorphism glow.
 */
export function EmptyState({
    title = "暂无数据",
    description,
    icon,
    action,
    className = "",
    variant = "default",
}: EmptyStateProps) {
    if (variant === "minimal") {
        return (
            <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
                <span className="text-muted text-sm">{title}</span>
                {action && <div className="mt-2">{action}</div>}
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in select-none", className)}>
            <div className="relative mb-6">
                {/* 极弱呼吸 glow：scale 变化 ≤4%，opacity 0.12-0.20，不喧宾夺主 */}
                <motion.div
                    animate={{
                        scale: [1, 1.04, 1],
                        opacity: [0.12, 0.2, 0.12],
                    }}
                    transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="absolute inset-0 -m-4 rounded-full bg-brand-primary/30 blur-2xl pointer-events-none"
                />

                {/* 极弱漂浮：y 幅度 ±2px，周期拉长到 4.5s，保持图标清晰可读 */}
                <motion.div
                    animate={{ y: [0, -2, 0] }}
                    transition={{
                        duration: 4.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                >
                    {icon ? (
                        // 自定义 icon 走 brand-primary，不同主题下都有足够对比
                        <div className="relative text-brand-primary/80">{icon}</div>
                    ) : (
                        // 默认 icon：无 frame 无 border，直接用大号 brand 色 SVG 作主角
                        <IconBox className="relative h-20 w-20 text-brand-primary/75" />
                    )}
                </motion.div>
            </div>

            <h3 className="text-lg font-bold tracking-tight text-primary mt-2">{title}</h3>
            {description && (
                <p className="mt-2 max-w-xs text-sm text-secondary leading-relaxed">{description}</p>
            )}

            {action && <div className="mt-8">{action}</div>}
        </div>
    );
}
