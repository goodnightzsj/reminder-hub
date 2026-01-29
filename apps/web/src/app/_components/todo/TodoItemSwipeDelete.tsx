import { IconTrash } from "../Icons";
import { deleteTodo } from "../../_actions/todos.actions";

type TodoItemSwipeDeleteProps = {
    todoId: string;
};

export function TodoItemSwipeDelete({ todoId }: TodoItemSwipeDeleteProps) {
    return (
        <div className="absolute inset-y-0 right-0 z-0 flex w-24 items-center justify-center bg-destructive text-destructive-foreground sm:hidden">
            <form action={deleteTodo} className="flex h-full w-full items-center justify-center">
                <input type="hidden" name="id" value={todoId} />
                <button type="submit" className="flex h-full w-full items-center justify-center">
                    <IconTrash className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
}

