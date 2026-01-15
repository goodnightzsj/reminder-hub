import "server-only";

import { revalidatePath } from "next/cache";

import { db } from "@/server/db";
import { getAppSettings, SETTINGS_ID } from "@/server/db/settings";
import { appSettings } from "@/server/db/schema";
import { SETTINGS_PATH, redirectSettingsSaved } from "./settings.redirect";

export { SETTINGS_PATH, redirectSettingsError, redirectSettingsSaved } from "./settings.redirect";

export type ExistingAppSettings = Awaited<ReturnType<typeof getAppSettings>>;
export type AppSettingsUpdate = Partial<typeof appSettings.$inferInsert>;

export async function upsertAppSettings(
  existing: ExistingAppSettings,
  set: AppSettingsUpdate,
) {
  const now = new Date();
  await db
    .insert(appSettings)
    .values({ id: SETTINGS_ID, timeZone: existing.timeZone, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.id, set: { ...set, updatedAt: now } });
}

export function revalidateSettings() {
  revalidatePath(SETTINGS_PATH);
}

export function redirectSettingsSavedAfterRevalidate(): never {
  revalidateSettings();
  redirectSettingsSaved();
}

export function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function parsePortStringStrict(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 1 || parsed > 65535) return null;
  return parsed;
}
