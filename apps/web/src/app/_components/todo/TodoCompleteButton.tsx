"use client";

import { m as motion } from "framer-motion";
import { useTransition } from "react";
import { useConfetti } from "../ConfettiProvider";
import { Tooltip } from "../ui/Tooltip";
import { IconCheck, IconRotateCcw } from "../Icons";

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
    const { triggerConfetti, triggerMicroConfetti } = useConfetti();

    const handleClick = (e: React.MouseEvent) => {
        const x = e.clientX;
        const y = e.clientY;

        startTransition(async () => {
            const formData = new FormData();
            formData.append("id", todoId);
            formData.append("isDone", isDone ? "0" : "1");
            await onToggle(formData);

            // Trigger confetti only when completing (not uncompleting)
            if (!isDone) {
                // Localized splash
                triggerMicroConfetti(x, y);
                // Big celebration
                triggerConfetti();
            }
        });
    };

    return (
        <Tooltip content={isDone ? "标记为未完成" : "完成任务"} side="bottom">
            <motion.button
                type="button"
                disabled={isPending}
                onClick={(e) => handleClick(e)}
                whileTap={{ scale: 0.9 }}
                className={`
                    group relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all
                    ${isDone
                        ? "bg-brand-primary border-brand-primary text-white"
                        : "bg-transparent border-muted hover:border-brand-primary"
                    }
                    disabled:opacity-50
                `}
            >
                <span className="sr-only">{isDone ? "取消完成" : "完成"}</span>
                {isDone ? (
                    <IconRotateCcw className="w-3.5 h-3.5" />
                ) : (
                    <IconCheck active className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-brand-primary dark:text-brand-primary" />
                )}
            </motion.button>
        </Tooltip>
    );
}
