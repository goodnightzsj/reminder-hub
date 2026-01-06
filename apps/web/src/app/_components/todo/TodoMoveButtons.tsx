"use client";

import { useTransition } from "react";

type TodoMoveButtonsProps = {
    todoId: string;
    onMoveUp: (id: string) => Promise<void>;
    onMoveDown: (id: string) => Promise<void>;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
};

export function TodoMoveButtons({
    todoId,
    onMoveUp,
    onMoveDown,
    canMoveUp = true,
    canMoveDown = true,
}: TodoMoveButtonsProps) {
    const [isPending, startTransition] = useTransition();

    return (
        <div className="flex flex-col gap-0.5">
            <button
                type="button"
                disabled={isPending || !canMoveUp}
                onClick={() => startTransition(() => onMoveUp(todoId))}
                className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-interactive-hover hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                title="上移"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m18 15-6-6-6 6" />
                </svg>
            </button>
            <button
                type="button"
                disabled={isPending || !canMoveDown}
                onClick={() => startTransition(() => onMoveDown(todoId))}
                className="flex h-6 w-6 items-center justify-center rounded text-muted hover:bg-interactive-hover hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                title="下移"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                </svg>
            </button>
        </div>
    );
}
