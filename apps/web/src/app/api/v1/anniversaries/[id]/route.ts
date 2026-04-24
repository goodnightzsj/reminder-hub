import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeAnniversary } from "@/server/api/serializers";
import { db } from "@/server/db";
import { anniversaries } from "@/server/db/schema";
import { anniversaryDateTypeValues, type AnniversaryDateType } from "@/lib/anniversary";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const load = (id: string) => db.select().from(anniversaries).where(eq(anniversaries.id, id)).get();

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  const row = await load(id);
  if (!row) return apiErrors.notFound();
  return jsonOk({ anniversary: serializeAnniversary(row) });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  const existing = await load(id);
  if (!existing) return apiErrors.notFound();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const patch: Partial<typeof anniversaries.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (!t) return apiErrors.badRequest("title cannot be empty");
    patch.title = t;
  }
  if (typeof body.date === "string") patch.date = body.date;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.dateType === "string" && (anniversaryDateTypeValues as readonly string[]).includes(body.dateType)) {
    patch.dateType = body.dateType as AnniversaryDateType;
  }
  if (typeof body.isLeapMonth === "boolean") patch.isLeapMonth = body.isLeapMonth;
  if (Array.isArray(body.remindOffsetsDays)) {
    patch.remindOffsetsDays = JSON.stringify(
      body.remindOffsetsDays.filter((n) => typeof n === "number" && Number.isFinite(n)),
    );
  }
  if (typeof body.isArchived === "boolean") {
    patch.isArchived = body.isArchived;
    patch.archivedAt = body.isArchived ? new Date() : null;
  }

  await db.update(anniversaries).set(patch).where(eq(anniversaries.id, id));
  const row = await load(id);
  if (!row) return apiErrors.serverError("update ok but row missing");
  return jsonOk({ anniversary: serializeAnniversary(row) });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  const existing = await load(id);
  if (!existing) return apiErrors.notFound();

  const hard = new URL(request.url).searchParams.get("hard") === "1";
  if (hard) {
    await db.delete(anniversaries).where(eq(anniversaries.id, id));
  } else {
    await db.update(anniversaries).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(anniversaries.id, id));
  }
  return jsonOk({ ok: true });
}
