import { ReactNode } from "react";

type BadgeVariant = "default" | "secondary" | "outline" | "primary" | "danger" | "warning" | "success" | "blue" | "orange" | "pink" | "purple" | "cyan" | "rose" | "indigo" | "teal" | "custom";

type BadgeProps = {
    children: ReactNode;
    variant?: BadgeVariant;
    className?: string;
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
    const base = "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-default";

    const variants: Record<BadgeVariant, string> = {
        // Default: Neutral styled (used for categories, tags, etc.)
        default: "border border-divider bg-surface text-secondary",
        // Secondary: Pro Max Neutral (Gradient)
        secondary: "border border-border/50 bg-gradient-to-b from-surface to-muted/10 text-secondary shadow-sm",
        // Outline: Transparent background
        outline: "border border-default text-secondary",
        // Primary: Brand color
        primary: "border-0 bg-gradient-to-b from-brand-primary to-brand-secondary text-white shadow-sm shadow-brand-primary/25",
        // Priority/Status
        danger: "border-0 bg-gradient-to-b from-red-500 to-red-600 text-white shadow-sm shadow-red-500/25",
        warning: "border-0 bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-sm shadow-amber-500/25",
        success: "border-0 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-sm shadow-emerald-500/25",
        // Valid Semantic Colors
        blue: "border-0 bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-sm shadow-blue-500/25",
        orange: "border-0 bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-sm shadow-orange-500/25",
        pink: "border-0 bg-gradient-to-b from-pink-500 to-pink-600 text-white shadow-sm shadow-pink-500/25",
        purple: "border-0 bg-gradient-to-b from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-500/25",
        cyan: "border-0 bg-gradient-to-b from-cyan-500 to-cyan-600 text-white shadow-sm shadow-cyan-500/25",
        rose: "border-0 bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-sm shadow-rose-500/25",
        indigo: "border-0 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/25",
        teal: "border-0 bg-gradient-to-b from-teal-500 to-teal-600 text-white shadow-sm shadow-teal-500/25",
        // Custom: No default coloring (controlled via className)
        custom: "border",
    };

    return (
        <span className={`${base} ${variants[variant]} ${className}`} >
            {children}
        </span >
    );
}

export function getBadgeVariantFromLabel(label: string | null | undefined): BadgeVariant {
    if (!label) return 'default';
    const semanticVariants: BadgeVariant[] = ['blue', 'orange', 'pink', 'purple', 'cyan', 'rose', 'indigo', 'teal'];
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % semanticVariants.length;
    return semanticVariants[index];
}
