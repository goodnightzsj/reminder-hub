import { ReactNode } from "react";

type CardProps = {
    children: ReactNode;
    className?: string; // Allow overriding/appending classes
    interactive?: boolean;
};

export function Card({ children, className = "", interactive = false }: CardProps) {
    const interactiveClasses = interactive
        ? "hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out cursor-pointer"
        : "";

    return (
        <div className={`rounded-2xl border border-default bg-elevated shadow-sm ${interactiveClasses} ${className}`}>
            {children}
        </div>
    );
}
