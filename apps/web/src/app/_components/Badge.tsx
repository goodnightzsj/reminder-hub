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
        // Priority/Status
        danger: "border border-danger bg-danger text-danger",
        warning: "border border-warning bg-warning text-warning",
        success: "border border-success bg-success text-success",
    };

    return (
        <span className={`${base} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
}
