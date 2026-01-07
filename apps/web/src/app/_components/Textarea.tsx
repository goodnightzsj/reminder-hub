import { ComponentProps } from "react";

type TextareaProps = ComponentProps<"textarea">;

export function Textarea({ className = "", ...props }: TextareaProps) {
    return (
        <textarea
            className={`block w-full rounded-lg border border-default bg-transparent px-3 py-2 text-base text-primary outline-none transition-shadow placeholder:text-muted focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm ${className}`}
            {...props}
        />
    );
}
