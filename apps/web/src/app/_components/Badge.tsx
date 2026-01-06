import { ReactNode } from "react";

type BadgeProps = {
    children: ReactNode;
    variant?: "default" | "outline" | "primary" | "danger" | "warning" | "success";
    className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    const base = "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-default";

    const variants = {
        // Default: Neutral styled (used for categories, tags, etc.)
        default: "border border-divider bg-surface text-secondary",
        // Outline: Transparent background
        outline: "border border-default text-secondary",
        // Primary: Brand color
        primary: "border border-brand-primary bg-brand-primary text-white",
        // Priority/Status (these semantic colors stay as-is because they are status-specific)
        danger: "border border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200",
        warning: "border border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-950/30 dark:text-yellow-200",
        success: "border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100",
    };

    return (
        <span className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
