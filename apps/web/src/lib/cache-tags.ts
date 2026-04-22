/**
 * 统一的缓存 tag 命名。
 *
 * 规则：
 * - 列表级 tag 用 `xxx:all`，mutation 后刷列表页 + dashboard 聚合
 * - 单实体 tag 用 `xxx:<id>`，只需失效对应详情
 * - `dashboard` tag 聚合了所有跨域的 todo/anniversary/subscription/item，任何
 *   mutation 都应附带刷新它
 * - `settings` tag 单独，只有 /settings 下的操作失效
 *
 * 用法：
 *   import { unstable_cache } from "next/cache";
 *   const loader = unstable_cache(fn, key, { tags: [TAGS.TODO_ALL, TAGS.DASHBOARD], revalidate: 60 });
 *
 *   // mutation
 *   import { revalidateTag } from "next/cache";
 *   revalidateTag(TAGS.TODO_ALL);
 *   revalidateTag(TAGS.DASHBOARD);
 */
export const TAGS = {
    DASHBOARD: "dashboard",
    SETTINGS: "settings",
    TODO_ALL: "todo:all",
    todo: (id: string) => `todo:${id}`,
    ANNIVERSARY_ALL: "anniversary:all",
    anniversary: (id: string) => `anniversary:${id}`,
    SUBSCRIPTION_ALL: "subscription:all",
    subscription: (id: string) => `subscription:${id}`,
    ITEM_ALL: "item:all",
    item: (id: string) => `item:${id}`,
} as const;

/** 跨域 mutation 共用的基础 tag 集合（list + dashboard），每个 mutation 至少带上自己 domain 的这组。 */
export const BASE_TAGS_BY_DOMAIN = {
    todo: [TAGS.TODO_ALL, TAGS.DASHBOARD] as string[],
    anniversary: [TAGS.ANNIVERSARY_ALL, TAGS.DASHBOARD] as string[],
    subscription: [TAGS.SUBSCRIPTION_ALL, TAGS.DASHBOARD] as string[],
    item: [TAGS.ITEM_ALL, TAGS.DASHBOARD] as string[],
} as const;
