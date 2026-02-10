import "server-only";

import { redirect } from "next/navigation";
import type { FlashAction } from "@/lib/flash";
import { withAction } from "./redirect-url";
import { ROUTES } from "@/lib/routes";
import { revalidatePaths } from "./revalidate";

export function redirectWithTodoAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePaths([ROUTES.home, `${ROUTES.todo}/${todoId}`]);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePaths([ROUTES.home, ROUTES.todo, `${ROUTES.todo}/${todoId}`]);
}


