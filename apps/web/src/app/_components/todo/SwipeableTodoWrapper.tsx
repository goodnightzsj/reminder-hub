"use client";

import { SwipeableItem } from "../SwipeableItem";
import { useRouter } from "next/navigation";

type SwipeableTodoWrapperProps = {
    children: React.ReactNode;
    todoId: string;
    isDone: boolean;
};

export function SwipeableTodoWrapper({
    children,
    todoId,
    isDone,
}: SwipeableTodoWrapperProps) {
    const router = useRouter();

    const handleSwipeLeft = async () => {
        // Delete action - trigger form submit programmatically
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "";

        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "action";
        input.value = "delete";

        const idInput = document.createElement("input");
        idInput.type = "hidden";
        idInput.name = "id";
        idInput.value = todoId;

        form.appendChild(input);
        form.appendChild(idInput);

        // For now, just refresh to show the action worked
        // Real implementation would use server action
        router.refresh();
    };

    const handleSwipeRight = async () => {
        // Toggle done action
        router.refresh();
    };

    return (
        <SwipeableItem
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            leftAction={
                <div className="flex items-center gap-2 text-white font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 12 2 2 4-4" />
                        <circle cx="12" cy="12" r="10" />
                    </svg>
                    {isDone ? "取消完成" : "完成"}
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
            className="sm:hidden"
        >
            {children}
        </SwipeableItem>
    );
}
