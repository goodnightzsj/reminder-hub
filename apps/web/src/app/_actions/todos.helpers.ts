import "server-only";



import { redirect } from "next/navigation";
import type { FlashAction } from "@/lib/flash";
import { withAction } from "./redirect-url";
import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export function redirectWithTodoAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.todo);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}


