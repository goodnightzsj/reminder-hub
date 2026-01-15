import { type TodoPriority } from "@/lib/todo";
import type { TodoRecurrence, TodoRecurrenceUnit } from "./TodoRecurrence.types";

export type TodoUpdateFormTodo = {
    id: string;
    title: string;
    description: string | null;
    taskType: string;
    priority: TodoPriority;
};

export type { TodoRecurrence, TodoRecurrenceUnit };
