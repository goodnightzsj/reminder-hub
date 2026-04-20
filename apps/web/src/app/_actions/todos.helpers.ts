import "server-only";

import { ROUTES } from "@/lib/routes";
import { revalidatePaths } from "./revalidate";

// 历史别名保留，底层改用共享的 redirectFlashAction。
export { redirectFlashAction as redirectWithTodoAction } from "./redirect-url";

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePaths([ROUTES.home, `${ROUTES.todo}/${todoId}`]);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePaths([ROUTES.home, ROUTES.todo, `${ROUTES.todo}/${todoId}`]);
}


