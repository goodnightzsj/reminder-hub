import { IconCalendar, IconCheck } from "../Icons";
import { formatDateTime } from "@/lib/format";

type Subtask = {
    id: string;
    isDone: boolean;
};

type TodoItemMetaProps = {
    subtasks?: Subtask[];
    dueAt: Date | null;
    timeZone: string;
    isOverdue: boolean;
};

export function TodoItemMeta({ subtasks, dueAt, timeZone, isOverdue }: TodoItemMetaProps) {
    const hasSubtasks = subtasks && subtasks.length > 0;
    const doneCount = hasSubtasks ? subtasks.filter(s => s.isDone).length : 0;
    const totalCount = subtasks?.length ?? 0;

    return (
        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
            {hasSubtasks && (
                <div className="flex items-center gap-1">
                    <IconCheck className="h-3.5 w-3.5" />
                    <span>
                        {doneCount}/{totalCount}
                    </span>
                </div>
            )}

            {dueAt && (
                <div className={`flex items-center gap-1 ${isOverdue ? "text-danger font-bold" : ""}`}>
                    <IconCalendar className="h-3.5 w-3.5" />
                    <span>{formatDateTime(dueAt, timeZone)}</span>
                </div>
            )}
        </div>
    );
}

