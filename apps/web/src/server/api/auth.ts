import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getAppSettings } from "@/server/db/settings";
import { verifyPassword } from "@/server/auth";

const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Token format: `{timestamp}.{randomNonce}.{hmac-sha256}`
 * Signed with the current adminPasswordHash so password changes invalidate all tokens.
 */
export function createApiToken(passwordHash: string): string {
  const payload = `${Date.now()}.${randomBytes(16).toString("hex")}`;
  const sig = sign(payload, passwordHash);
  return `${payload}.${sig}`;
}

export function verifyApiToken(token: string | null | undefined, passwordHash: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tsStr, nonce, sig] = parts;
  if (!tsStr || !nonce || !sig) return false;

  const ts = parseInt(tsStr, 10);
  if (isNaN(ts) || Date.now() - ts > TOKEN_MAX_AGE_MS) return false;

  const expected = sign(`${tsStr}.${nonce}`, passwordHash);
  if (sig.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export type ApiAuthResult =
  | { ok: true; authEnabled: true; passwordHash: string }
  | { ok: true; authEnabled: false }
  | { ok: false; status: 401; message: string };

/**
 * Check authentication for an API request. Returns:
 * - ok: true + authEnabled: false → no password set, allow through
 * - ok: true + authEnabled: true → valid bearer token, allow through
 * - ok: false → reject with the given status + message
 */
export async function checkApiAuth(request: Request): Promise<ApiAuthResult> {
  const settings = await getAppSettings();

  if (!settings.adminPasswordHash) {
    return { ok: true, authEnabled: false };
  }

  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return { ok: false, status: 401, message: "missing bearer token" };
  }

  const token = header.slice("Bearer ".length).trim();
  if (!verifyApiToken(token, settings.adminPasswordHash)) {
    return { ok: false, status: 401, message: "invalid or expired token" };
  }

  return { ok: true, authEnabled: true, passwordHash: settings.adminPasswordHash };
}

/**
 * Verify credentials for login. Returns a new API token on success.
 */
export async function loginWithPassword(password: string): Promise<
  | { ok: true; token: string; authEnabled: true }
  | { ok: true; authEnabled: false }
  | { ok: false; message: string }
> {
  const settings = await getAppSettings();

  if (!settings.adminPasswordHash) {
    return { ok: true, authEnabled: false };
  }

  if (!password) return { ok: false, message: "password required" };
  if (!verifyPassword(password, settings.adminPasswordHash)) {
    return { ok: false, message: "invalid password" };
  }

  return { ok: true, token: createApiToken(settings.adminPasswordHash), authEnabled: true };
}
