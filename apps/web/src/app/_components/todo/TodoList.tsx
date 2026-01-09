"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TodoItem } from "./TodoItem";
import { EmptyState } from "../EmptyState";

type TodoListProps = {
    items: any[]; // Using any[] for simplicity with the complex inferred type, usually better to infer from schema but acceptable for UI component
    settings: {
        timeZone: string;
    };
    emptyTitle: string;
    emptyDescription: string;
};

export function TodoList({ items, settings, emptyTitle, emptyDescription }: TodoListProps) {
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
                            settings={settings}
                        />
                    ))}
                </AnimatePresence>
            </motion.div>
        </ul>
    );
}
