"use client";

import { useEffect } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
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
    /** 首访引导：触屏设备上自动左滑一小段再回弹，揭示"左滑删除"操作；只播一次 */
    showSwipeHint?: boolean;
};

const SWIPE_HINT_STORAGE_KEY = "todo-swipe-hint-seen";

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
    showSwipeHint = false,
}: TodoItemDraggableContentProps) {
    const priorityIndicatorClassName =
        todoPriorityIndicatorClassNameByPriority[item.priority];
    const titleLinkClassName = [
        todoTitleLinkBaseClassName,
        item.isDone ? todoTitleLinkDoneClassName : todoTitleLinkDefaultClassName,
    ].join(" ");

    // 首访引导动画：仅触屏 + 非减动偏好 + 本次会话未显示过时触发一次
    const controls = useAnimationControls();
    const prefersReducedMotion = useReducedMotion();

    useEffect(() => {
        if (!showSwipeHint || prefersReducedMotion || isDeleted) return;
        if (typeof window === "undefined") return;
        const isTouch = window.matchMedia?.("(hover: none)").matches;
        if (!isTouch) return;
        try {
            if (window.localStorage.getItem(SWIPE_HINT_STORAGE_KEY) === "1") return;
        } catch {
            // 隐身模式 localStorage 不可用，仍允许播放一次
        }

        let cancelled = false;
        const timer = window.setTimeout(() => {
            if (cancelled) return;
            controls
                .start({
                    x: [0, -56, -32, -56, 0],
                    transition: { duration: 1.2, times: [0, 0.25, 0.5, 0.75, 1], ease: "easeInOut" },
                })
                .then(() => {
                    try {
                        window.localStorage.setItem(SWIPE_HINT_STORAGE_KEY, "1");
                    } catch {
                        // ignore
                    }
                });
        }, 650);

        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [showSwipeHint, prefersReducedMotion, isDeleted, controls]);

    return (
        <motion.div
            drag={!isDeleted ? "x" : false}
            dragConstraints={{ left: -100, right: 0 }}
            dragElastic={0.05}
            animate={controls}
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
