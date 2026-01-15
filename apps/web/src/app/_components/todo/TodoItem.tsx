import { motion } from "framer-motion";
import { TODO_PRIORITY, type TodoPriority } from "@/lib/todo";
import type { TodoItemData } from "./TodoItem.types";
import { TodoItemDraggableContent } from "./TodoItemDraggableContent";
import { TodoItemSwipeDelete } from "./TodoItemSwipeDelete";

export type { TodoItemData } from "./TodoItem.types";

type TodoItemProps = {
    item: TodoItemData;
    timeZone: string;
};

const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
};

const todoItemBaseClassName =
    "group relative overflow-hidden rounded-xl border transition-all";
const todoItemOverdueClassName =
    "bg-red-500/10 border-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.6)] hover:bg-red-500/20 dark:bg-red-900/20 dark:border-red-400";
const todoItemDefaultClassName = "bg-elevated border-transparent hover:bg-muted/30";
const todoItemHighPriorityShadowClassName =
    "shadow-[0_0_15px_-3px_rgba(239,68,68,0.15)] hover:shadow-[0_0_20px_-3px_rgba(239,68,68,0.25)] dark:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]";
const todoItemMediumPriorityShadowClassName =
    "shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]";

function getTodoItemContainerClassName(options: {
    isOverdue: boolean;
    priority: TodoPriority;
}) {
    const { isOverdue, priority } = options;

    return [
        todoItemBaseClassName,
        isOverdue ? todoItemOverdueClassName : todoItemDefaultClassName,
        !isOverdue && priority === TODO_PRIORITY.HIGH ? todoItemHighPriorityShadowClassName : "",
        !isOverdue && priority === TODO_PRIORITY.MEDIUM ? todoItemMediumPriorityShadowClassName : "",
    ]
        .filter(Boolean)
        .join(" ");
}

function getTodoItemState(
    item: Pick<TodoItemData, "deletedAt" | "dueAt" | "isDone">,
    now: Date,
) {
    const isDeleted = item.deletedAt != null;
    const isPastDue = item.dueAt !== null && item.dueAt < now;
    const isOverdue = isPastDue && !item.isDone;

    return { isDeleted, isOverdue, isPastDue };
}

export function TodoItem({ item, timeZone }: TodoItemProps) {
    const now = new Date();
    const { isDeleted, isOverdue, isPastDue } = getTodoItemState(item, now);
    const containerClassName = getTodoItemContainerClassName({
        isOverdue,
        priority: item.priority,
    });

    return (
        <motion.li
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            className={containerClassName}
        >
            {/* Mobile Swipe Action (Delete) - Background Layer */}
            {!isDeleted && (
                <TodoItemSwipeDelete todoId={item.id} />
            )}

            {/* Main Content - Draggable */}
            <TodoItemDraggableContent
                item={item}
                timeZone={timeZone}
                isDeleted={isDeleted}
                isOverdue={isOverdue}
                isPastDue={isPastDue}
            />
        </motion.li>
    );
}
