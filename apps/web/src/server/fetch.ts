import "server-only";

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

export type FetchWithTimeoutInit = FetchInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

const SAFE_HOSTS_WITH_PATH = new Set([
  "api.iconify.design",
  "api.telegram.org",
  "qyapi.weixin.qq.com",
  "raw.githubusercontent.com",
]);

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: unknown }).name === "AbortError"
  );
}

function sanitizeUrlForError(url: URL): string {
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";

  if (url.hostname === "api.telegram.org") {
    url.pathname = url.pathname.replace(/\/bot[^/]+/g, "/bot***");
  }

  if (!SAFE_HOSTS_WITH_PATH.has(url.hostname)) {
    return url.origin;
  }

  return `${url.origin}${url.pathname}`;
}

function safeUrlForError(input: Parameters<typeof fetch>[0]): string {
  try {
    if (typeof input === "string") {
      return sanitizeUrlForError(new URL(input));
    }
    if (input instanceof URL) {
      return sanitizeUrlForError(new URL(input.toString()));
    }
    if (typeof input === "object" && input !== null && "url" in input) {
      const url = (input as { url?: unknown }).url;
      if (typeof url === "string") {
        return sanitizeUrlForError(new URL(url));
      }
    }
  } catch {
    // Ignore URL parse errors; fall back to a generic label.
  }
  return "request";
}

export async function fetchWithTimeout(
  input: Parameters<typeof fetch>[0],
  init?: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init ?? {};

  const controller = new AbortController();
  const urlLabel = safeUrlForError(input);
  let didTimeout = false;
  const timeout =
    Number.isFinite(timeoutMs) && timeoutMs > 0
      ? setTimeout(() => {
          didTimeout = true;
          controller.abort();
        }, timeoutMs)
      : null;

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (err) {
    if (didTimeout && isAbortError(err)) {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${urlLabel}`, {
        cause: err instanceof Error ? err : undefined,
      });
    }
    throw err;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
