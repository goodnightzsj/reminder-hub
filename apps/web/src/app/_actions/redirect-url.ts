import "server-only";

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
