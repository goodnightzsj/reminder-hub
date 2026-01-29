import { Tooltip } from "../ui/Tooltip";
import { ConfirmSubmitButton } from "../ConfirmSubmitButton";
import { IconArchiveRestore, IconChevronDown, IconChevronRight, IconTrash } from "../Icons";
import {
    deleteTodo,
    moveTodoDown,
    moveTodoUp,
    restoreTodo,
    toggleTodo,
} from "../../_actions/todos.actions";
import { TodoCompleteButton } from "./TodoCompleteButton";

type TodoItemActionsProps = {
    todoId: string;
    isDeleted: boolean;
    isDone: boolean;
};

export function TodoItemActions({ todoId, isDeleted, isDone }: TodoItemActionsProps) {
    return (
        <div className="flex shrink-0 items-center gap-2">
            {isDeleted ? (
                <div className="flex items-center gap-1.5">
                    <form action={restoreTodo}>
                        <input type="hidden" name="id" value={todoId} />
                        <Tooltip content="恢复">
                            <button
                                type="submit"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-white shadow-md shadow-success/20 hover:scale-110 active:scale-95 transition-all"
                            >
                                <IconArchiveRestore className="h-4 w-4" />
                            </button>
                        </Tooltip>
                    </form>

                    <form action={deleteTodo}>
                        <input type="hidden" name="id" value={todoId} />
                        <Tooltip content="彻底删除">
                            <ConfirmSubmitButton
                                confirmMessage="确定彻底删除这个 Todo 吗？"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-danger text-white shadow-md shadow-danger/20 hover:bg-danger/90 hover:scale-110 active:scale-95 transition-all"
                            >
                                <IconTrash className="h-4 w-4" />
                            </ConfirmSubmitButton>
                        </Tooltip>
                    </form>
                </div>
            ) : (
                <div className="flex flex-col items-end gap-3">
                    <TodoCompleteButton
                        todoId={todoId}
                        isDone={isDone}
                        onToggle={toggleTodo}
                    />

                    {/* Desktop Actions - visible on hover */}
                    <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="上移顺序">
                            <button
                                onClick={() => moveTodoUp(todoId)}
                                className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface"
                            >
                                <IconChevronRight className="w-4 h-4 -rotate-90" />
                            </button>
                        </Tooltip>
                        <Tooltip content="下移顺序">
                            <button
                                onClick={() => moveTodoDown(todoId)}
                                className="p-1.5 rounded text-muted hover:text-primary hover:bg-surface"
                            >
                                <IconChevronDown className="w-4 h-4" />
                            </button>
                        </Tooltip>

                        <form action={deleteTodo}>
                            <input type="hidden" name="id" value={todoId} />
                            <Tooltip content="移至回收站">
                                <ConfirmSubmitButton
                                    confirmMessage="确定删除这个待办吗？"
                                    className="p-1.5 rounded text-muted hover:text-danger hover:bg-danger/10"
                                >
                                    <IconTrash className="w-4 h-4" />
                                </ConfirmSubmitButton>
                            </Tooltip>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

