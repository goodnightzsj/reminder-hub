"use client";

import { useTransition } from "react";
import { useConfetti } from "../ConfettiProvider";

type TodoCompleteButtonProps = {
    todoId: string;
    isDone: boolean;
    onToggle: (formData: FormData) => Promise<void>;
};

export function TodoCompleteButton({
    todoId,
    isDone,
    onToggle,
}: TodoCompleteButtonProps) {
    const [isPending, startTransition] = useTransition();
    const { triggerConfetti } = useConfetti();

    const handleClick = () => {
        startTransition(async () => {
            const formData = new FormData();
            formData.append("id", todoId);
            formData.append("isDone", isDone ? "0" : "1");
            await onToggle(formData);

            // Trigger confetti only when completing (not uncompleting)
            if (!isDone) {
                triggerConfetti();
            }
        });
    };

    return (
        <button
            type="button"
            disabled={isPending}
            onClick={handleClick}
            className="h-9 rounded-lg border border-default px-3 text-xs font-medium hover:bg-interactive-hover disabled:opacity-50"
        >
            {isDone ? "取消完成" : "完成"}
        </button>
    );
}
