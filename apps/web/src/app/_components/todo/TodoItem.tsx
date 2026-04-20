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

// 列表节奏：去掉"万物卡片"的边框 + 发光堆叠，改用：
// - 透明底 + 下分隔线形成节奏
// - 左侧 2px accent bar 表达优先级（overdue > high > medium）
// - 仅在 overdue 时叠一层极淡背景色强化识别
const todoItemBaseClassName =
    "group relative overflow-hidden transition-colors border-b border-divider/50 last:border-b-0";
const todoItemOverdueClassName =
    "bg-[hsl(var(--destructive)/0.05)] hover:bg-[hsl(var(--destructive)/0.09)] before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[hsl(var(--destructive))]";
const todoItemDefaultClassName = "hover:bg-muted/30";
const todoItemHighPriorityShadowClassName =
    "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[hsl(var(--destructive)/0.7)]";
const todoItemMediumPriorityShadowClassName =
    "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-[hsl(var(--warning)/0.7)]";

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
