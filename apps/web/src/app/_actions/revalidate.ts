import "server-only";

import { revalidatePath, updateTag } from "next/cache";

export function revalidatePaths(paths: readonly string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

/**
 * 批量触发 tag 失效（read-your-own-writes）。
 * Next.js 16 新增 `updateTag(tag)`：专为 Server Action 场景，立即让缓存失效并保证
 * 下一次读取看到刚写入的值。相比 `revalidateTag(tag, profile)` 不需要 profile 参数。
 */
export function revalidateTags(tags: readonly string[]) {
  for (const tag of tags) {
    updateTag(tag);
  }
}
