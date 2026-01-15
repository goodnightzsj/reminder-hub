import { type TodoPriority } from "@/lib/todo";

export type TodoItemData = {
    id: string;
    title: string;
    description: string | null;
    taskType: string;
    priority: TodoPriority;
    tags: string[];
    dueAt: Date | null;
    recurrenceLabel: string | null;
    isDone: boolean;
    deletedAt?: Date | null;
    subtasks?: {
        id: string;
        isDone: boolean;
    }[];
};

