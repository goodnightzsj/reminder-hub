"use client";

import { ReactNode, useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SwipeableItem } from "../SwipeableItem";
import { motion } from "framer-motion";

type TodoItemData = {
    id: string;
    title: string;
    isDone: boolean;
};

type SortableTodoItemProps = {
    item: TodoItemData;
    children: ReactNode;
    onComplete?: (id: string) => void;
    onDelete?: (id: string) => void;
};

function SortableTodoItem({ item, children, onComplete, onDelete }: SortableTodoItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        position: 'relative' as const,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            animate={{
                scale: isDragging ? 1.05 : 1,
                boxShadow: isDragging
                    ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                    : "0 0px 0px rgba(0, 0, 0, 0)",
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
            }}
            className={isDragging ? "bg-elevated rounded-xl border border-brand-primary/20" : ""}
        >
            {/* Desktop: Show drag handle */}
            <div className="hidden sm:flex items-stretch">
                <div
                    {...attributes}
                    {...listeners}
                    className="flex items-center px-2 cursor-grab active:cursor-grabbing text-muted hover:text-primary hover:bg-interactive-hover"
                    title="拖拽排序"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="19" r="1" />
                    </svg>
                </div>
                <div className="flex-1">{children}</div>
            </div>

            {/* Mobile: Show swipeable */}
            <div className="sm:hidden">
                <SwipeableItem
                    onSwipeLeft={() => onDelete?.(item.id)}
                    onSwipeRight={() => onComplete?.(item.id)}
                    leftAction={
                        <div className="flex items-center gap-2 text-white font-medium">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m9 12 2 2 4-4" />
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            {item.isDone ? "取消" : "完成"}
                        </div>
                    }
                    rightAction={
                        <div className="flex items-center gap-2 text-white font-medium">
                            删除
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                        </div>
                    }
                >
                    {children}
                </SwipeableItem>
            </div>
        </motion.div>
    );
}

type TodoListClientProps = {
    items: TodoItemData[];
    renderItem: (item: TodoItemData, index: number) => ReactNode;
    emptyMessage?: string;
    onReorder?: (ids: string[]) => void;
    onComplete?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export function TodoListClient({
    items,
    renderItem,
    emptyMessage = "暂无任务",
    onReorder,
    onComplete,
    onDelete,
}: TodoListClientProps) {
    const [localItems, setLocalItems] = useState(items);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 250, tolerance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localItems.findIndex((item) => item.id === active.id);
            const newIndex = localItems.findIndex((item) => item.id === over.id);
            const newItems = arrayMove(localItems, oldIndex, newIndex);
            setLocalItems(newItems);
            onReorder?.(newItems.map((item) => item.id));
        }
    };

    if (localItems.length === 0) {
        return (
            <div className="p-4 text-sm text-muted">{emptyMessage}</div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={localItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <ul className="divide-y divide-divider">
                    {localItems.map((item, index) => (
                        <SortableTodoItem
                            key={item.id}
                            item={item}
                            onComplete={onComplete}
                            onDelete={onDelete}
                        >
                            {renderItem(item, index)}
                        </SortableTodoItem>
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
