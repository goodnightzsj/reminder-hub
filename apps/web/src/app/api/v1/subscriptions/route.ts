import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeSubscription } from "@/server/api/serializers";
import { db } from "@/server/db";
import { subscriptions } from "@/server/db/schema";
import {
  DEFAULT_SUBSCRIPTION_CATEGORY,
  DEFAULT_SUBSCRIPTION_CYCLE_UNIT,
  subscriptionCycleUnitValues,
  type SubscriptionCycleUnit,
} from "@/lib/subscriptions";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";
  const includeArchived = url.searchParams.get("includeArchived") === "1";

  const filters = [];
  if (!includeDeleted) filters.push(isNull(subscriptions.deletedAt));
  if (!includeArchived) filters.push(eq(subscriptions.isArchived, false));

  const rows = await db
    .select()
    .from(subscriptions)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(subscriptions.createdAt));

  return jsonOk({ subscriptions: rows.map(serializeSubscription) });
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return apiErrors.badRequest("name required");
  const nextRenewDate = typeof body.nextRenewDate === "string" ? body.nextRenewDate.trim() : "";
  if (!nextRenewDate) return apiErrors.badRequest("nextRenewDate required");

  const cycleUnit = typeof body.cycleUnit === "string" && (subscriptionCycleUnitValues as readonly string[]).includes(body.cycleUnit)
    ? (body.cycleUnit as SubscriptionCycleUnit)
    : DEFAULT_SUBSCRIPTION_CYCLE_UNIT;

  const remindOffsetsDays = Array.isArray(body.remindOffsetsDays)
    ? body.remindOffsetsDays.filter((n) => typeof n === "number" && Number.isFinite(n))
    : [];

  const id = typeof body.id === "string" && body.id ? body.id : randomUUID();
  const now = new Date();

  await db.insert(subscriptions).values({
    id,
    name,
    description: typeof body.description === "string" ? body.description : null,
    priceCents: typeof body.priceCents === "number" ? body.priceCents : null,
    category: typeof body.category === "string" ? body.category : DEFAULT_SUBSCRIPTION_CATEGORY,
    currency: typeof body.currency === "string" ? body.currency : DEFAULT_CURRENCY,
    cycleUnit,
    cycleInterval: typeof body.cycleInterval === "number" && body.cycleInterval > 0 ? body.cycleInterval : 1,
    nextRenewDate,
    autoRenew: body.autoRenew !== false,
    remindOffsetsDays: JSON.stringify(remindOffsetsDays),
    icon: typeof body.icon === "string" ? body.icon : null,
    color: typeof body.color === "string" ? body.color : null,
    updatedAt: now,
  });

  const row = await db.select().from(subscriptions).where(eq(subscriptions.id, id)).get();
  if (!row) return apiErrors.serverError("insert ok but row not found");
  return jsonOk({ subscription: serializeSubscription(row) }, { status: 201 });
}
