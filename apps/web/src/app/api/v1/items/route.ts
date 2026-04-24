import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import { checkApiAuth } from "@/server/api/auth";
import { apiErrors, jsonOk } from "@/server/api/response";
import { serializeItem } from "@/server/api/serializers";
import { db } from "@/server/db";
import { items } from "@/server/db/schema";
import { DEFAULT_ITEM_STATUS, itemStatusValues, type ItemStatus } from "@/lib/items";
import { DEFAULT_CURRENCY } from "@/lib/currency";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await checkApiAuth(request);
  if (!auth.ok) return apiErrors.unauthorized(auth.message);

  const url = new URL(request.url);
  const includeDeleted = url.searchParams.get("includeDeleted") === "1";
  const status = url.searchParams.get("status");

  const filters = [];
  if (!includeDeleted) filters.push(isNull(items.deletedAt));
  if (status && (itemStatusValues as readonly string[]).includes(status)) {
    filters.push(eq(items.status, status as ItemStatus));
  }

  const rows = await db
    .select()
    .from(items)
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(items.createdAt));

  return jsonOk({ items: rows.map(serializeItem) });
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

  const status = typeof body.status === "string" && (itemStatusValues as readonly string[]).includes(body.status)
    ? (body.status as ItemStatus)
    : DEFAULT_ITEM_STATUS;

  const id = typeof body.id === "string" && body.id ? body.id : randomUUID();
  const now = new Date();

  await db.insert(items).values({
    id,
    name,
    priceCents: typeof body.priceCents === "number" ? body.priceCents : null,
    currency: typeof body.currency === "string" ? body.currency : DEFAULT_CURRENCY,
    purchasedDate: typeof body.purchasedDate === "string" ? body.purchasedDate : null,
    category: typeof body.category === "string" ? body.category : null,
    status,
    usageCount: typeof body.usageCount === "number" ? body.usageCount : 0,
    targetDailyCostCents: typeof body.targetDailyCostCents === "number" ? body.targetDailyCostCents : null,
    updatedAt: now,
  });

  const row = await db.select().from(items).where(eq(items.id, id)).get();
  if (!row) return apiErrors.serverError("insert ok but row missing");
  return jsonOk({ item: serializeItem(row) }, { status: 201 });
}
