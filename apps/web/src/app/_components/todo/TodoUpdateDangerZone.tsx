import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { IconTrash } from "../Icons";
import { deleteTodo } from "../../_actions/todos.actions";

type TodoUpdateDangerZoneProps = {
    todoId: string;
    createdAtLabel: string;
    redirectTo: string;
};

export function TodoUpdateDangerZone({
    todoId,
    createdAtLabel,
    redirectTo,
}: TodoUpdateDangerZoneProps) {
    return (
        <div className="flex items-center justify-between border-t border-divider pt-6">
            <span className="text-xs text-muted">
                创建于 {createdAtLabel}
            </span>
            <form action={deleteTodo}>
                <input type="hidden" name="id" value={todoId} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <ConfirmSubmitButton
                    confirmMessage="确定删除这个 Todo 吗？此操作不可撤销。"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
                >
                    <IconTrash className="h-3.5 w-3.5" />
                    删除任务
                </ConfirmSubmitButton>
            </form>
        </div>
    );
}

