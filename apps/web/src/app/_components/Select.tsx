import { ComponentProps } from "react";

export type SelectProps = ComponentProps<"select">;

export function Select({ className = "", ...props }: SelectProps) {
    return (
        <div className="relative">
            <select
                className={`h-11 w-full appearance-none rounded-lg border border-default bg-transparent px-3 text-sm text-primary outline-none transition-shadow focus:ring-2 focus:ring-brand-primary/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
                {...props}
            />
            {/* Custom arrow indicator */}
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </div>
        </div>
    );
}
