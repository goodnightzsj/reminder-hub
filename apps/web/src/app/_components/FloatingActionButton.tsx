"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Icons } from "./Icons";
import { Magnetic } from "./Magnetic";

export function FloatingActionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    const actions = [
        { label: "Todo", href: "/todo?modal=create", icon: Icons.Todo },
        { label: "纪念日", href: "/anniversaries?modal=create", icon: Icons.Calendar },
        { label: "订阅", href: "/subscriptions?modal=create", icon: Icons.CreditCard },
        { label: "物品", href: "/items?modal=create", icon: Icons.Box },
    ];

    // Determine default action based on current path
    const getCurrentAction = () => {
        if (pathname.startsWith("/todo")) return { href: "/todo?modal=create" };
        if (pathname.startsWith("/anniversaries")) return { href: "/anniversaries?modal=create" };
        if (pathname.startsWith("/subscriptions")) return { href: "/subscriptions?modal=create" };
        if (pathname.startsWith("/items")) return { href: "/items?modal=create" };
        return null; // Dashboard or other pages -> Show menu
    };

    const currentAction = getCurrentAction();

    const handleClick = () => {
        if (currentAction) {
            router.push(currentAction.href);
        } else {
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="fixed right-6 bottom-24 md:bottom-10 z-50 flex flex-col items-end gap-3 pointer-events-none">
            {/* Action Menu (Only for Dashboard / No Context) */}
            {isOpen && !currentAction && (
                <div className="pointer-events-auto flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    {actions.map((action) => (
                        <button
                            key={action.href}
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
                    onClick={handleClick}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        if (currentAction) setIsOpen(!isOpen); // Long press to force menu?
                    }}
                    className={[
                        "flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-brand-primary/20 transition-all duration-300 active:scale-90 active:rotate-90",
                        "bg-brand-primary text-white border border-white/10 backdrop-blur-md", // Enhanced glass
                        isOpen ? "rotate-45" : "",
                    ].join(" ")}
                    aria-label={currentAction ? "新建" : (isOpen ? "关闭" : "添加")}
                >
                    <Icons.Plus className="h-7 w-7 stroke-[2.5px]" />
                </button>
            </Magnetic>
        </div>
    );
}
