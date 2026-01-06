"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { isValidTimeZone } from "@/server/datetime";
import { db } from "@/server/db";
import { setAppDateReminderTime, setAppTimeZone } from "@/server/db/settings";
import {
  anniversaries,
  items,
  notificationDeliveries,
  subscriptions,
  todoSubtasks,
  todos,
} from "@/server/db/schema";

function parseStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isValidTimeOfDay(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;
  return true;
}

export async function updateTimeZone(formData: FormData) {
  const timeZone = parseStringField(formData, "timeZone");
  if (!timeZone) redirect("/settings?error=missing-timezone");
  if (!isValidTimeZone(timeZone)) redirect("/settings?error=invalid-timezone");

  await setAppTimeZone(timeZone);
  revalidatePath("/");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function updateDateReminderTime(formData: FormData) {
  const dateReminderTime = parseStringField(formData, "dateReminderTime");
  if (!dateReminderTime) redirect("/settings?error=missing-date-reminder-time");
  if (!isValidTimeOfDay(dateReminderTime)) redirect("/settings?error=invalid-date-reminder-time");

  await setAppDateReminderTime(dateReminderTime);
  revalidatePath("/");
  revalidatePath("/anniversaries");
  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

export async function clearAllData() {
  db.transaction((tx) => {
    tx.delete(notificationDeliveries).run();
    tx.delete(todoSubtasks).run();
    tx.delete(todos).run();
    tx.delete(anniversaries).run();
    tx.delete(subscriptions).run();
    tx.delete(items).run();
  });

  revalidatePath("/");
  revalidatePath("/anniversaries");
  revalidatePath("/subscriptions");
  revalidatePath("/items");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  redirect("/settings?dataCleared=1");
}
