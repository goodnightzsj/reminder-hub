import { ComponentProps } from "react";

type InputProps = ComponentProps<"input">;

export function Input({ className = "", ...props }: InputProps) {
    return (
        <input
            className={`h-11 w-full rounded-lg border border-default bg-transparent px-3 text-base text-primary outline-none transition-all placeholder:text-gray-400 focus:border-brand-primary/50 focus:shadow-[0_0_20px_-2px_rgba(var(--brand-primary-rgb),0.15)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
            {...props}
        />
    );
}
