"use client";

import { m as motion } from "framer-motion";
import { ReactNode } from "react";

type BentoCardProps = {
    children: ReactNode;
    className?: string;
    title?: string;
    icon?: ReactNode;
    action?: ReactNode;
    glow?: boolean;
    delay?: number;
    /** 紧凑模式：把内容内边距从 p-6 降到 p-3，用于 stat 卡等小单元 */
    compact?: boolean;
};

export function BentoCard({ title, children, className = "", delay = 0, icon, action, glow = false, compact = false }: BentoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: delay,
                ease: [0.2, 0, 0.2, 1], // ease-out-cubic equivalent
            }}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-divider bg-elevated shadow-sm transition-all hover:shadow-md hover:border-brand-primary/30 ${className}`}
        >
            {glow && (
                <div className="absolute -inset-px bg-gradient-to-r from-brand-primary/20 via-brand-secondary/20 to-brand-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-1000 animate-pulse-slow pointer-events-none" />
            )}
            <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.03] dark:opacity-[0.05]" />
            <div className="relative flex flex-col h-full z-10">
                {(title || icon || action) && (
                    <div className="flex items-center justify-between border-b border-divider px-6 py-4">
                        <div className="flex items-center gap-2">
                            {icon && <span className="text-muted-foreground">{icon}</span>}
                            {title && <h3 className="font-medium text-secondary">{title}</h3>}
                        </div>
                        {action && <div>{action}</div>}
                    </div>
                )}
                <div className={`flex-1 ${compact ? "p-3" : "p-6"}`}>{children}</div>
            </div>
        </motion.div>
    );
}
