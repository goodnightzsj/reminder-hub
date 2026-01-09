"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type BentoCardProps = {
    children: ReactNode;
    className?: string;
    title?: string;
    icon?: ReactNode;
    action?: ReactNode;
    delay?: number;
};

export function BentoCard({
    children,
    className = "",
    title,
    icon,
    action,
    delay = 0,
}: BentoCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: delay,
                ease: [0.2, 0, 0.2, 1], // ease-out-cubic equivalent
            }}
            className={`group relative flex flex-col overflow-hidden rounded-2xl border border-default bg-elevated shadow-sm transition-all hover:bg-muted/10 ${className}`}
        >
            {(title || icon || action) && (
                <div className="flex items-center justify-between border-b border-divider px-6 py-4">
                    <div className="flex items-center gap-2">
                        {icon && <span className="text-muted-foreground">{icon}</span>}
                        {title && <h3 className="font-medium text-secondary">{title}</h3>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            <div className="flex-1 p-6">{children}</div>
        </motion.div>
    );
}
