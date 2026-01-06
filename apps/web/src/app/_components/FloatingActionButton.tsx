"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const actions = [
        { label: "新建 Todo", href: "/?modal=create", icon: "✓" },
        { label: "新建纪念日", href: "/anniversaries?modal=create", icon: "📅" },
        { label: "新建订阅", href: "/subscriptions?modal=create", icon: "💳" },
    ];

    return (
        <div className="fixed bottom-20 right-4 z-50 sm:hidden">
            {/* Action Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {actions.map((action) => (
                        <button
                            key={action.href}
                            onClick={() => {
                                setIsOpen(false);
                                router.push(action.href);
                            }}
                            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-lg border border-default active-press"
                        >
                            <span>{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={[
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 active-press",
                    "bg-brand-primary text-inverted hover:bg-brand-primary/90",
                    isOpen ? "rotate-45" : "",
                ].join(" ")}
                aria-label={isOpen ? "关闭菜单" : "快速添加"}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                </svg>
            </button>
        </div>
    );
}
