import "server-only";

import { revalidatePath } from "next/cache";
import { ROUTES } from "@/lib/routes";

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePath(ROUTES.home);
  revalidatePath(ROUTES.todo);
  revalidatePath(`${ROUTES.todo}/${todoId}`);
}
