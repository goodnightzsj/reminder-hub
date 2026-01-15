import { motion } from "framer-motion";
import Link from "next/link";
import { type TodoPriority } from "@/lib/todo";
import { TodoItemActions } from "./TodoItemActions";
import { TodoItemBadges } from "./TodoItemBadges";
import { TodoItemTags } from "./TodoItemTags";
import { TodoItemMeta } from "./TodoItemMeta";
import type { TodoItemData } from "./TodoItem.types";

type TodoItemDraggableContentProps = {
    item: TodoItemData;
    timeZone: string;
    isDeleted: boolean;
    isOverdue: boolean;
    isPastDue: boolean;
};

const todoPriorityIndicatorClassNameByPriority: Record<TodoPriority, string> = {
    low: "bg-transparent",
    medium: "bg-warning",
    high: "bg-danger",
};

const todoTitleLinkBaseClassName =
    "mt-2 block truncate text-base font-medium transition-colors hover:text-brand-primary";
const todoTitleLinkDoneClassName = "text-muted line-through";
const todoTitleLinkDefaultClassName = "text-primary";

export function TodoItemDraggableContent({
    item,
    timeZone,
    isDeleted,
    isOverdue,
    isPastDue,
}: TodoItemDraggableContentProps) {
    const priorityIndicatorClassName =
        todoPriorityIndicatorClassNameByPriority[item.priority];
    const titleLinkClassName = [
        todoTitleLinkBaseClassName,
        item.isDone ? todoTitleLinkDoneClassName : todoTitleLinkDefaultClassName,
    ].join(" ");

    return (
        <motion.div
            drag={!isDeleted ? "x" : false}
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.05}
            className="relative z-10 flex items-start gap-4 bg-elevated px-5 py-4"
            whileDrag={{ x: -50 }}
        >
            {/* Priority Indicator Dot/Line */}
            <div
                className={[
                    "absolute left-1.5 top-2 bottom-2 w-[4px] rounded-full",
                    priorityIndicatorClassName,
                ].join(" ")}
            />

            <div className="flex min-w-0 flex-1 flex-col pl-2">
                <TodoItemBadges
                    isDeleted={isDeleted}
                    isDone={item.isDone}
                    isPastDue={isPastDue}
                    priority={item.priority}
                    taskType={item.taskType}
                    recurrenceLabel={item.recurrenceLabel}
                />

                <Link
                    href={`/todo/${item.id}`}
                    className={titleLinkClassName}
                    title={item.title}
                >
                    {item.title}
                </Link>

                {item.description ? (
                    <p className="mt-1 line-clamp-1 text-sm text-secondary">
                        {item.description}
                    </p>
                ) : null}

                <TodoItemTags todoId={item.id} tags={item.tags} />

                {/* Subtasks & DueDate */}
                <TodoItemMeta
                    subtasks={item.subtasks}
                    dueAt={item.dueAt}
                    timeZone={timeZone}
                    isOverdue={isOverdue}
                />
            </div>

            {/* Actions Column */}
            <TodoItemActions todoId={item.id} isDeleted={isDeleted} isDone={item.isDone} />
        </motion.div>
    );
}
