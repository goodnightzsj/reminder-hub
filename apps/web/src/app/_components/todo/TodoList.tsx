"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TodoItem } from "./TodoItem";
import type { TodoItemData } from "./TodoItem.types";
import { EmptyState } from "../shared/EmptyState";

type TodoListProps = {
    items: TodoItemData[];
    timeZone: string;
    emptyTitle: string;
    emptyDescription: string;
};

export function TodoList({ items, timeZone, emptyTitle, emptyDescription }: TodoListProps) {
    if (items.length === 0) {
        return (
            <div className="p-8">
                <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                />
            </div>
        );
    }

    return (
        <ul className="relative flex flex-col gap-3 px-4 pb-4 pt-2">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.05 } }
                }}
                className="contents"
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item) => (
                        <TodoItem
                            key={item.id}
                            item={item}
                            timeZone={timeZone}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </ul>
    );
}
