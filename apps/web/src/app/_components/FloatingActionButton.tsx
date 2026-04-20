"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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

    // 路由变化时自动收起菜单：这是我们与"当前路由"这个外部系统的同步，属于合理使用场景
    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { setIsOpen(false); }, [pathname]);

    // ESC 关闭
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen]);

    const handleClick = () => {
        if (currentAction) {
            router.push(currentAction.href);
        } else {
            setIsOpen((v) => !v);
        }
    };

    const ariaLabel = (() => {
        if (currentAction) return "新建";
        if (isOpen) return "关闭菜单";
        return "添加";
    })();

    const menuOpen = isOpen && !currentAction;

    return (
        <>
            {/* 菜单展开时的背景：吃掉点击事件 + 暗化下层，避免与 BottomNav 视觉混叠 */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.button
                        type="button"
                        aria-label="关闭菜单背景"
                        onClick={() => setIsOpen(false)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden"
                    />
                )}
            </AnimatePresence>

            <div
                // 位置考虑 Home Indicator：bottom = BottomNav 高度 20 + 内边距 + safe-area
                className="fixed right-6 z-50 flex flex-col items-end gap-3 pointer-events-none md:hidden"
                style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
            >
                {/* Action menu */}
                <AnimatePresence>
                    {menuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
                            className="pointer-events-auto flex flex-col gap-3"
                        >
                            {actions.map((action, i) => (
                                <motion.button
                                    key={action.href}
                                    type="button"
                                    aria-label={`新建${action.label}`}
                                    onClick={() => {
                                        setIsOpen(false);
                                        router.push(action.href);
                                    }}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.2 }}
                                    className="flex items-center justify-end gap-3 group"
                                >
                                    <span className="bg-glass text-primary px-3 py-1.5 rounded-xl text-sm font-medium shadow-sm backdrop-blur-xl border border-white/20 origin-right transition-transform group-active:scale-95">
                                        {action.label}
                                    </span>
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface shadow-md border border-white/10 text-primary transition-transform group-active:scale-90">
                                        <action.icon aria-hidden="true" className="h-5 w-5" />
                                    </div>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main FAB Button */}
                <Magnetic strength={0.2} className="pointer-events-auto">
                    <button
                        type="button"
                        onClick={handleClick}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            if (currentAction) setIsOpen((v) => !v);
                        }}
                        aria-expanded={menuOpen}
                        aria-label={ariaLabel}
                        className={[
                            "relative flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-brand-primary/20",
                            "transition-transform duration-300 active:scale-90",
                            "bg-theme-aware text-white border border-white/10 backdrop-blur-md overflow-hidden",
                            !isOpen && "animate-pulse-subtle",
                            isOpen ? "rotate-45" : "",
                        ].join(" ")}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 transition-opacity hover:opacity-100" />
                        <IconPlus aria-hidden="true" className="h-7 w-7 stroke-[2.5px] relative z-10" />
                    </button>
                </Magnetic>
            </div>
        </>
    );
}
