import "server-only";

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { getAppSettings } from "./db/settings";

const AUTH_COOKIE = "rh_session";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60;
const SCRYPT_KEYLEN = 64;

/**
 * Decide whether to flag the session cookie as Secure. Unlike the naive
 * `NODE_ENV === "production"` check, this works for Docker deployments
 * accessed over plain HTTP (localhost, intranet, reverse proxies that
 * terminate TLS elsewhere). A Secure cookie set over HTTP is silently
 * dropped by the browser on subsequent navigation, causing the user to
 * bounce straight back to the login screen.
 *
 * Priority:
 *   1. AUTH_COOKIE_SECURE=true|false explicitly overrides detection.
 *   2. X-Forwarded-Proto=https (set by reverse proxies like nginx/Traefik).
 *   3. Otherwise treat the connection as insecure and omit the Secure flag.
 */
async function computeSecureCookie(): Promise<boolean> {
  const override = process.env.AUTH_COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  try {
    const h = await headers();
    const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim().toLowerCase();
    if (proto) return proto === "https";
  } catch {
    // headers() not available in this execution context
  }
  return false;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
    return timingSafeEqual(derived, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(passwordHash: string): string {
  const payload = `${Date.now()}.${randomBytes(16).toString("hex")}`;
  const sig = signPayload(payload, passwordHash);
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined, passwordHash: string): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return false;

  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);

  const ts = parseInt(payload.split(".")[0]!, 10);
  if (isNaN(ts) || Date.now() - ts > SESSION_MAX_AGE * 1000) return false;

  const expected = signPayload(payload, passwordHash);
  if (sig.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export async function setSessionCookie(passwordHash: string): Promise<void> {
  const token = createSessionToken(passwordHash);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: await computeSecureCookie(),
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export const getAuthState = cache(async function getAuthState(): Promise<{
  authEnabled: boolean;
  authenticated: boolean;
  hasPassword: boolean;
}> {
  const settings = await getAppSettings();
  const hasPassword = !!settings.adminPasswordHash;

  if (!hasPassword) {
    return { authEnabled: false, authenticated: true, hasPassword: false };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const authenticated = verifySessionToken(token, settings.adminPasswordHash!);

  return { authEnabled: true, authenticated, hasPassword: true };
});

export async function requireAuth(): Promise<void> {
  const { authEnabled, authenticated } = await getAuthState();
  if (authEnabled && !authenticated) {
    redirect("/login");
  }
}
