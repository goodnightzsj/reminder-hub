import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeAnniversary } from "@/server/api/serializers";
import { db } from "@/server/db";
import { anniversaries } from "@/server/db/schema";
import { DEFAULT_ANNIVERSARY_DATE_TYPE, anniversaryDateTypeValues, type AnniversaryDateType } from "@/lib/anniversary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";
  const includeArchived = url.searchParams.get("includeArchived") === "1";

  const filters = [];
  if (!includeDeleted) filters.push(isNull(anniversaries.deletedAt));
  if (!includeArchived) filters.push(eq(anniversaries.isArchived, false));

  const rows = await db
    .select()
    .from(anniversaries)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(anniversaries.createdAt));

  return jsonOk({ anniversaries: rows.map(serializeAnniversary) });
}

export async function POST(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return apiErrors.badRequest("title required");
  const date = typeof body.date === "string" ? body.date.trim() : "";
  if (!date) return apiErrors.badRequest("date required");

  const dateType = typeof body.dateType === "string" && (anniversaryDateTypeValues as readonly string[]).includes(body.dateType)
    ? (body.dateType as AnniversaryDateType)
    : DEFAULT_ANNIVERSARY_DATE_TYPE;

  const remindOffsetsDays = Array.isArray(body.remindOffsetsDays)
    ? body.remindOffsetsDays.filter((n) => typeof n === "number" && Number.isFinite(n))
    : [];

  const id = typeof body.id === "string" && body.id ? body.id : randomUUID();
  const now = new Date();

  await db.insert(anniversaries).values({
    id,
    title,
    category: typeof body.category === "string" ? body.category : "anniversary",
    dateType,
    isLeapMonth: body.isLeapMonth === true,
    date,
    remindOffsetsDays: JSON.stringify(remindOffsetsDays),
    updatedAt: now,
  });

  const row = await db.select().from(anniversaries).where(eq(anniversaries.id, id)).get();
  if (!row) return apiErrors.serverError("insert succeeded but row not found");
  return jsonOk({ anniversary: serializeAnniversary(row) }, { status: 201 });
}
