import { NextRequest } from "next/server";

import { loginWithPassword } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json body");
  }

  const result = await loginWithPassword(typeof body?.password === "string" ? body.password : "");

  if (!result.ok) {
    return apiErrors.unauthorized(result.message);
  }

  if (!result.authEnabled) {
    return jsonOk({ authEnabled: false, token: null });
  }

  return jsonOk({ authEnabled: true, token: result.token });
}
