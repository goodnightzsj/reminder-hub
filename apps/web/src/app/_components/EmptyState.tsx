"use client";

import { ReactNode } from "react";
import { Icons } from "./Icons";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
                {/* Glow Background with Breathing Animation */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 -m-4 rounded-full bg-brand-primary/10 blur-2xl pointer-events-none"
                />

                {/* Floating Icon Animation */}
                <motion.div
                    animate={{
                        y: [0, -8, 0],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {icon ? (
                        <div className="relative text-muted/50 scale-110">{icon}</div>
                    ) : (
                        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-surface/50 border border-white/10 shadow-lg backdrop-blur-sm dark:bg-zinc-800/50">
                            <Icons.Box className="h-10 w-10 text-muted/80" />
                        </div>
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
