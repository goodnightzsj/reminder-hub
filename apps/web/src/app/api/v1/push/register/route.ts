import { NextRequest } from "next/server";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { db } from "@/server/db";
import { deviceTokens } from "@/server/db/schema";

export const dynamic = "force-dynamic";

const VALID_PLATFORMS = new Set(["ios", "android", "web"]);

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  let body: { token?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const platform = typeof body.platform === "string" ? body.platform : "";

  if (!token) return apiErrors.badRequest("token required");
  if (!VALID_PLATFORMS.has(platform)) return apiErrors.badRequest("platform must be ios, android, or web");

  const now = new Date();
  await db
    .insert(deviceTokens)
    .values({ token, platform, lastActiveAt: now })
    .onConflictDoUpdate({
      target: deviceTokens.token,
      set: { platform, lastActiveAt: now },
    });

  return jsonOk({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return apiErrors.badRequest("token required");

  const { eq } = await import("drizzle-orm");
  await db.delete(deviceTokens).where(eq(deviceTokens.token, token));

  return jsonOk({ ok: true });
}
