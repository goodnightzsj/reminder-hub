import "server-only";

import { redirect } from "next/navigation";

import { FLASH_TOAST_QUERY_KEY, type FlashAction } from "@/lib/flash";

export function withSearchParam(path: string, key: string, value: string): string {
  try {
    const url = new URL(path, "http://localhost");
    url.searchParams.set(key, value);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    const sep = path.includes("?") ? "&" : "?";
    return `${path}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
}

export function withAction(path: string, action: FlashAction): string {
  return withSearchParam(path, FLASH_TOAST_QUERY_KEY.ACTION, action);
}

export type SearchParamValue = string | number | boolean;

export function withSearchParams(
  path: string,
  params: Record<string, SearchParamValue>,
): string {
  let result = path;
  for (const [key, value] of Object.entries(params)) {
    result = withSearchParam(result, key, String(value));
  }
  return result;
}

/** 执行带 flash action 参数的重定向（成功提示类场景）。 */
export function redirectFlashAction(path: string, action: FlashAction): never {
  redirect(withAction(path, action));
}

/**
 * 执行带 flash error 参数的重定向（校验失败、业务错误场景）。
 * 默认 errorCode = "validation-failed"，与历史行为一致。
 */
export function redirectFlashError(
  path: string,
  errorCode: string = "validation-failed",
): never {
  redirect(withSearchParams(path, { [FLASH_TOAST_QUERY_KEY.ERROR]: errorCode }));
}
