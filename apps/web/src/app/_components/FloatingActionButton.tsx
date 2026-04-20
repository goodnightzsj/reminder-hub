"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IconBox, IconCalendar, IconCreditCard, IconPlus, IconTodo } from "./Icons";
import { Magnetic } from "./shared/Magnetic";
import { buildCreateModalHref } from "@/lib/url";
import { ROUTES } from "@/lib/routes";

export function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const actions = [
        { label: "Todo", pathPrefix: ROUTES.todo, href: buildCreateModalHref(ROUTES.todo), icon: IconTodo },
        { label: "纪念日", pathPrefix: ROUTES.anniversaries, href: buildCreateModalHref(ROUTES.anniversaries), icon: IconCalendar },
        { label: "订阅", pathPrefix: ROUTES.subscriptions, href: buildCreateModalHref(ROUTES.subscriptions), icon: IconCreditCard },
        { label: "物品", pathPrefix: ROUTES.items, href: buildCreateModalHref(ROUTES.items), icon: IconBox },
    ];

    // Determine default action based on current path
    const currentAction = actions.find((action) => pathname.startsWith(action.pathPrefix)) ?? null;

    const handleClick = () => {
        if (currentAction) {
            router.push(currentAction.href);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const ariaLabel = (() => {
        if (currentAction) return "新建";
        if (isOpen) return "关闭";
        return "添加";
    })();

    return (
        <div className="fixed right-6 bottom-24 md:bottom-10 z-50 flex flex-col items-end gap-3 pointer-events-none md:hidden">
            {/* Action Menu (Only for Dashboard / No Context) */}
            {isOpen && !currentAction && (
                <div className="pointer-events-auto flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {actions.map((action) => (
                        <button
                            key={action.href}
                            type="button"
                            aria-label={`新建${action.label}`}
                            onClick={() => {
                                setIsOpen(false);
                                router.push(action.href);
                            }}
                            className="flex items-center justify-end gap-3 group"
                        >
                            <span className="bg-glass text-primary px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm backdrop-blur-xl border border-white/20 origin-right transition-transform group-active:scale-95">
                                {action.label}
                            </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-md border border-white/10 text-primary transition-transform group-active:scale-90">
                                <action.icon className="h-5 w-5" />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* Main FAB Button */}
            <Magnetic strength={0.2} className="pointer-events-auto">
                <button
                    type="button"
                    onClick={handleClick}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        if (currentAction) setIsOpen(!isOpen);
                    }}
                    className={[
                        "relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-brand-primary/20",
                        "transition-all duration-300 active:scale-90 active:rotate-90",
                        "bg-theme-aware text-white border border-white/10 backdrop-blur-md overflow-hidden", // Enhanced glass
                        !isOpen && "animate-pulse-subtle", // Add subtle pulse when closed
                        isOpen ? "rotate-45" : "",
                    ].join(" ")}
                    aria-label={ariaLabel}
                >
                    {/* Ripple/Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity hover:opacity-100" />

                    <IconPlus className="h-7 w-7 stroke-[2.5px] relative z-10" />
                </button>
            </Magnetic>
        </div>
    );
}
