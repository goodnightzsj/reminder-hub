import "server-only";

import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(status: number, code: string, message?: string) {
  return NextResponse.json({ error: { code, message: message ?? code } }, { status });
}

export const apiErrors = {
  unauthorized: (msg?: string) => jsonError(401, "unauthorized", msg),
  forbidden: (msg?: string) => jsonError(403, "forbidden", msg),
  notFound: (msg?: string) => jsonError(404, "not_found", msg),
  badRequest: (msg?: string) => jsonError(400, "bad_request", msg),
  serverError: (msg?: string) => jsonError(500, "server_error", msg),
};
