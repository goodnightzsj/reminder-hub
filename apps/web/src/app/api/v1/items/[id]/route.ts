import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeItem } from "@/server/api/serializers";
import { db } from "@/server/db";
import { items } from "@/server/db/schema";
import { itemStatusValues, type ItemStatus } from "@/lib/items";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const load = (id: string) => db.select().from(items).where(eq(items.id, id)).get();

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  const row = await load(id);
  if (!row) return apiErrors.notFound();
  return jsonOk({ item: serializeItem(row) });
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  if (!(await load(id))) return apiErrors.notFound();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiErrors.badRequest("invalid json");
  }

  const patch: Partial<typeof items.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.name === "string") {
    const t = body.name.trim();
    if (!t) return apiErrors.badRequest("name cannot be empty");
    patch.name = t;
  }
  if (typeof body.priceCents === "number" || body.priceCents === null) patch.priceCents = body.priceCents as number | null;
  if (typeof body.currency === "string") patch.currency = body.currency;
  if (typeof body.purchasedDate === "string" || body.purchasedDate === null) patch.purchasedDate = body.purchasedDate as string | null;
  if (typeof body.category === "string" || body.category === null) patch.category = body.category as string | null;
  if (typeof body.status === "string" && (itemStatusValues as readonly string[]).includes(body.status)) {
    patch.status = body.status as ItemStatus;
  }
  if (typeof body.usageCount === "number") patch.usageCount = body.usageCount;
  if (typeof body.targetDailyCostCents === "number" || body.targetDailyCostCents === null) {
    patch.targetDailyCostCents = body.targetDailyCostCents as number | null;
  }

  await db.update(items).set(patch).where(eq(items.id, id));
  const row = await load(id);
  if (!row) return apiErrors.serverError("update ok but row missing");
  return jsonOk({ item: serializeItem(row) });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  if (!(await load(id))) return apiErrors.notFound();

  const hard = new URL(request.url).searchParams.get("hard") === "1";
  if (hard) {
    await db.delete(items).where(eq(items.id, id));
  } else {
    await db.update(items).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(items.id, id));
  }
  return jsonOk({ ok: true });
}
