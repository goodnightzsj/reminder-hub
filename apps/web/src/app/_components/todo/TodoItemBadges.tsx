import { IconRepeat } from "../Icons";
import { SmartCategoryBadge } from "../shared/SmartCategoryBadge";
import { getTodoPriorityLabel, type TodoPriority } from "@/lib/todo";

const todoPriorityBadgeColorByPriority: Record<TodoPriority, string> = {
    low: "blue",
    medium: "amber",
    high: "rose",
};

type TodoItemBadgesProps = {
    isDeleted: boolean;
    isDone: boolean;
    isPastDue: boolean;
    priority: TodoPriority;
    taskType: string;
    recurrenceLabel: string | null;
};

export function TodoItemBadges({
    isDeleted,
    isDone,
    isPastDue,
    priority,
    taskType,
    recurrenceLabel,
}: TodoItemBadgesProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {/* Priority Badge */}
            {/* Delete/Archive Status */}
            {isDeleted ? (
                <SmartCategoryBadge overrideColor="red" variant="solid">
                    已删除
                </SmartCategoryBadge>
            ) : isDone ? (
                <SmartCategoryBadge overrideColor="emerald" variant="solid">
                    已完成
                </SmartCategoryBadge>
            ) : (
                <SmartCategoryBadge overrideColor="sky" variant="solid">
                    进行中
                </SmartCategoryBadge>
            )}

            {/* Overdue Badge (for completed/deleted items that are past due) */}
            {isPastDue && (isDone || isDeleted) && (
                <SmartCategoryBadge overrideColor="red" variant="glass">
                    逾期
                </SmartCategoryBadge>
            )}

            {/* Priority Badge */}
            <SmartCategoryBadge
                overrideColor={todoPriorityBadgeColorByPriority[priority]}
                variant="solid"
            >
                {getTodoPriorityLabel(priority)}
            </SmartCategoryBadge>

            {/* Category Badge */}
            <SmartCategoryBadge>
                {taskType}
            </SmartCategoryBadge>

            {recurrenceLabel ? (
                <div className="flex items-center">
                    <SmartCategoryBadge overrideColor="teal">
                        <span className="flex items-center gap-1">
                            <IconRepeat className="w-3 h-3" />
                            {recurrenceLabel}
                        </span>
                    </SmartCategoryBadge>
                </div>
            ) : null}
        </div>
    );
}
