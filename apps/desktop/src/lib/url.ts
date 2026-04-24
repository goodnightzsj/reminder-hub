export type SanitizeResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

/**
 * Normalize + validate a user-entered server base URL so downstream callers
 * can safely concatenate `${baseUrl}/api/v1/...` without producing `//` or
 * relying on the server to tolerate protocol-less input.
 *
 * Never auto-prepends https:// — quietly upgrading http->https is fine, but
 * downgrading https->http would be a silent security regression, so we
 * refuse to guess and ask the user instead.
 */
export function sanitizeBaseUrl(raw: string): SanitizeResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "服务器地址不能为空" };
  if (!/^https?:\/\//i.test(trimmed)) {
    return { ok: false, error: "服务器地址需以 http:// 或 https:// 开头" };
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, error: "服务器地址格式不正确" };
  }
  if (!url.hostname) return { ok: false, error: "服务器地址缺少主机名" };
  const cleaned =
    `${url.protocol}//${url.host}${url.pathname.replace(/\/+$/, "")}${url.search}`;
  return { ok: true, value: cleaned };
}
