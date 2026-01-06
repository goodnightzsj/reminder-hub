import { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export function Input({ className = "", ...props }: InputProps) {
    return (
        <input
            className={`h-11 w-full rounded-lg border border-default bg-transparent px-3 text-sm text-primary outline-none transition-shadow placeholder:text-muted focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
            {...props}
        />
    );
}
