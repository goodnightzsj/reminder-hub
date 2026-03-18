import "server-only";
import { cache } from "react";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { appSettings } from "./schema";

import {
  DEFAULT_DATE_REMINDER_TIME,
  DEFAULT_TIME_ZONE,
  SETTINGS_ID,
} from "./app-settings.constants";

export { DEFAULT_DATE_REMINDER_TIME, DEFAULT_TIME_ZONE, SETTINGS_ID } from "./app-settings.constants";

async function ensureAppSettingsRow() {
  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone: DEFAULT_TIME_ZONE,
      dateReminderTime: DEFAULT_DATE_REMINDER_TIME,
      updatedAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function getAppSettings() {
  let existing: typeof appSettings.$inferSelect | undefined;
  try {
    existing = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.id, SETTINGS_ID))
      .get();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("no such column")) {
      throw new Error(
        `Database schema is out-of-date. Run \`cd apps/web && npm run db:migrate\` and restart the server. Original error: ${message}`,
        { cause: err instanceof Error ? err : undefined },
      );
    }
    throw err;
  }

  if (existing) return existing;

  await ensureAppSettingsRow();

  const created = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .get();

  if (created) return created;

  throw new Error("Failed to create default app settings");
}

export type AppTimeSettings = {
  timeZone: string;
  dateReminderTime: string;
};

/**
 * Cached getter for app settings using React.cache.
 * WARNING: This cache is request-scoped. If you mutate settings in the same request (e.g. in the same Server Action),
 * subsequent calls to this function WILL return stale data.
 * Ensure mutations and reads are separated or handle cache invalidation manually if needed.
 */
export const getAppTimeSettings = cache(async function getAppTimeSettings(): Promise<AppTimeSettings> {
  const existing = await db
    .select({
      timeZone: appSettings.timeZone,
      dateReminderTime: appSettings.dateReminderTime,
    })
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .get();

  if (existing) return existing;

  await ensureAppSettingsRow();

  const created = await db
    .select({
      timeZone: appSettings.timeZone,
      dateReminderTime: appSettings.dateReminderTime,
    })
    .from(appSettings)
    .where(eq(appSettings.id, SETTINGS_ID))
    .get();

  if (created) return created;

  throw new Error("Failed to create default app settings");
});

export async function setAppTimeZone(timeZone: string) {
  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone,
      dateReminderTime: DEFAULT_DATE_REMINDER_TIME,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { timeZone, updatedAt: new Date() },
    });
}

export async function setAppDateReminderTime(dateReminderTime: string) {
  const existing = await getAppTimeSettings();

  await db
    .insert(appSettings)
    .values({
      id: SETTINGS_ID,
      timeZone: existing.timeZone,
      dateReminderTime,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: appSettings.id,
      set: { dateReminderTime, updatedAt: new Date() },
    });
}
