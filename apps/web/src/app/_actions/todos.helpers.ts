import "server-only";

import { ROUTES } from "@/lib/routes";
import { BASE_TAGS_BY_DOMAIN, TAGS } from "@/lib/cache-tags";
import { revalidatePaths, revalidateTags } from "./revalidate";

// 历史别名保留，底层改用共享的 redirectFlashAction。
export { redirectFlashAction as redirectWithTodoAction } from "./redirect-url";

export function revalidateTodoDetailAndHome(todoId: string) {
  revalidatePaths([ROUTES.home, `${ROUTES.todo}/${todoId}`]);
  // tag 失效：dashboard 聚合 + 单 todo 详情
  revalidateTags([...BASE_TAGS_BY_DOMAIN.todo, TAGS.todo(todoId)]);
}

export function revalidateTodoAfterDelete(todoId: string) {
  revalidatePaths([ROUTES.home, ROUTES.todo, `${ROUTES.todo}/${todoId}`]);
  revalidateTags([...BASE_TAGS_BY_DOMAIN.todo, TAGS.todo(todoId)]);
}
