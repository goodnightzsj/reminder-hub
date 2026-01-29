import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "warning";
    size?: "sm" | "default" | "lg" | "icon";
    loading?: boolean;
};

export function Button({ className = "", variant = "primary", size = "default", loading = false, disabled, children, ...props }: ButtonProps) {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ring-offset-background active-press";

    const variants = {
        // Primary: Brand gradient + glow shadow (Pro Max)
        primary: "bg-gradient-to-b from-brand-primary to-brand-secondary text-white shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/30 border border-transparent",
        // Secondary: Subtle surface with border (Pro Max Neutral)
        secondary: "bg-gradient-to-b from-surface to-muted/20 text-primary shadow-sm border border-border/50 hover:bg-muted/30",
        // Outline: Clean border, transparent bg
        outline: "border border-default bg-transparent hover:bg-interactive-hover text-primary",
        // Ghost: Minimal, no border
        ghost: "bg-transparent hover:bg-interactive-hover text-secondary border border-transparent",
        // Danger: Gradient red with glow (Pro Max)
        danger: "bg-gradient-to-b from-red-500 to-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 border border-transparent",
        // Success: Gradient green with glow (Pro Max)
        success: "bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:shadow-lg hover:shadow-emerald-500/30 border border-transparent",
        // Warning: Gradient amber with glow (Pro Max)
        warning: "bg-gradient-to-b from-amber-400 to-amber-500 text-white shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/30 border border-transparent",
    };

    const sizes = {
        sm: "h-8 px-3 text-xs",
        default: "h-9 px-4 py-2 text-sm",
        lg: "h-11 px-6 text-sm",
        icon: "h-9 w-9",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : null}
            {children}
        </button>
    );
}
