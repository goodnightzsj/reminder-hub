"use client";

import Link from "next/link";
import { AnimatePresence, m as motion } from "framer-motion";
import { TodoItem } from "./TodoItem";
import type { TodoItemData } from "./TodoItem.types";
import { EmptyState } from "../shared/EmptyState";
import { ROUTES } from "@/lib/routes";
import { buildCreateModalHref } from "@/lib/url";

type TodoListProps = {
    items: TodoItemData[];
    timeZone: string;
    emptyTitle: string;
    emptyDescription: string;
    /** 当 true 表示这是"一条也没有"的首访场景，展示 CTA 引导用户创建第一条 */
    emptyShowCreateCta?: boolean;
};

export function TodoList({ items, timeZone, emptyTitle, emptyDescription, emptyShowCreateCta }: TodoListProps) {
    if (items.length === 0) {
        return (
            <div className="p-8">
                <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={
                        emptyShowCreateCta ? (
                            <Link
                                href={buildCreateModalHref(ROUTES.todo)}
                                className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 active:scale-95 transition-all"
                            >
                                添加第一条
                            </Link>
                        ) : undefined
                    }
                />
            </div>
        );
    }

    return (
        <ul className="relative flex flex-col gap-0.5 px-2 pb-4 pt-1 sm:px-4">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.04 } }
                }}
                className="contents"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item, index) => (
                        <TodoItem
                            key={item.id}
                            item={item}
                            timeZone={timeZone}
                            showSwipeHint={index === 0}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </ul>
    );
}
