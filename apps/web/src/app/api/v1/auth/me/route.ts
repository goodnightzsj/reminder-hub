import { NextRequest } from "next/server";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  return jsonOk({
    authEnabled: auth.authEnabled,
    authenticated: true,
  });
}
