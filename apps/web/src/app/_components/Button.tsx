import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
    size?: "sm" | "default" | "lg" | "icon";
    loading?: boolean;
};

export function Button({ className = "", variant = "primary", size = "default", loading = false, disabled, children, ...props }: ButtonProps) {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 ring-offset-background active-press";

    const variants = {
        primary: "bg-brand-primary text-inverted hover:bg-brand-primary/90 shadow-sm border border-transparent",
        secondary: "bg-surface text-primary hover:bg-interactive-hover border border-transparent",
        outline: "border border-default bg-transparent hover:bg-interactive-hover text-primary",
        ghost: "bg-transparent hover:bg-interactive-hover text-secondary border border-transparent",
        danger: "bg-[#dc2626] text-white hover:bg-[#b91c1c] dark:bg-[#b91c1c] dark:hover:bg-[#991b1b] border border-transparent",
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
