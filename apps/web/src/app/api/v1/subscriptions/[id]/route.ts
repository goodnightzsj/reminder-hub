import { NextRequest } from "next/server";

import { eq } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeSubscription } from "@/server/api/serializers";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import { subscriptionCycleUnitValues, type SubscriptionCycleUnit } from "@/lib/subscriptions";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const load = (id: string) => db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();

export async function GET(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  const row = await load(id);
  if (!row) return apiErrors.notFound();
  return jsonOk({ subscription: serializeSubscription(row) });
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

  const patch: Partial<typeof subscriptions.$inferInsert> = { updatedAt: new Date() };

  if (typeof body.name === "string") {
    const t = body.name.trim();
    if (!t) return apiErrors.badRequest("name cannot be empty");
    patch.name = t;
  }
  if (typeof body.description === "string" || body.description === null) patch.description = body.description as string | null;
  if (typeof body.priceCents === "number" || body.priceCents === null) patch.priceCents = body.priceCents as number | null;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.currency === "string") patch.currency = body.currency;
  if (typeof body.cycleUnit === "string" && (subscriptionCycleUnitValues as readonly string[]).includes(body.cycleUnit)) {
    patch.cycleUnit = body.cycleUnit as SubscriptionCycleUnit;
  }
  if (typeof body.cycleInterval === "number" && body.cycleInterval > 0) patch.cycleInterval = body.cycleInterval;
  if (typeof body.nextRenewDate === "string") patch.nextRenewDate = body.nextRenewDate;
  if (typeof body.autoRenew === "boolean") patch.autoRenew = body.autoRenew;
  if (Array.isArray(body.remindOffsetsDays)) {
    patch.remindOffsetsDays = JSON.stringify(
      body.remindOffsetsDays.filter((n) => typeof n === "number" && Number.isFinite(n)),
    );
  }
  if (typeof body.icon === "string" || body.icon === null) patch.icon = body.icon as string | null;
  if (typeof body.color === "string" || body.color === null) patch.color = body.color as string | null;
  if (typeof body.isArchived === "boolean") {
    patch.isArchived = body.isArchived;
    patch.archivedAt = body.isArchived ? new Date() : null;
  }

  await db.update(subscriptions).set(patch).where(eq(subscriptions.id, id));
  const row = await load(id);
  if (!row) return apiErrors.serverError("update ok but row missing");
  return jsonOk({ subscription: serializeSubscription(row) });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);
  const { id } = await ctx.params;
  if (!(await load(id))) return apiErrors.notFound();

  const hard = new URL(request.url).searchParams.get("hard") === "1";
  if (hard) {
    await db.delete(subscriptions).where(eq(subscriptions.id, id));
  } else {
    await db.update(subscriptions).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(subscriptions.id, id));
  }
  return jsonOk({ ok: true });
}
