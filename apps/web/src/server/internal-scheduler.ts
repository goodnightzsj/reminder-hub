import "server-only";

import { DIGEST_TYPE } from "@/lib/digests";
import { NOTIFICATION_CHANNELS, type NotificationChannel } from "@/server/notifications";

import { runAllNotificationsInOrder } from "@/server/notification-runner";
import { NotificationConfigError } from "@/server/notification-channel-config";
import { getAppSettings } from "@/server/db/settings";
import { buildMonthlyDigestFromSettings, buildWeeklyDigestFromSettings } from "@/server/digests";
import { runDigestForChannel } from "@/server/digest-runner";
import { addDaysToDateString, formatDateInTimeZone } from "@/server/date";
import { dateTimeLocalToUtcDate, isValidTimeOfDay } from "@/server/datetime";

declare global {
  var __todoListInternalSchedulerStarted: boolean | undefined;
}

function isOneOffLifecycle(): boolean {
  const lifecycle = process.env.npm_lifecycle_event;
  return lifecycle === "build" || lifecycle === "test" || lifecycle === "lint" || lifecycle === "check";
}

function safeUnref(timer: NodeJS.Timeout) {
  try {
    timer.unref();
  } catch {
    // ignore
  }
}

let notifyRunning = false;
let digestRunning = false;
let notifyTimer: NodeJS.Timeout | null = null;
let digestTimer: NodeJS.Timeout | null = null;
let currentNotifyIntervalSeconds: number | null = null;
let currentDigestKey: string | null = null;

async function runNotifyOnce() {
  if (notifyRunning) return;
  notifyRunning = true;
  try {
    const settings = await getAppSettings();
    if (!settings.internalSchedulerEnabled) return;
    if (!settings.internalNotifyEnabled) return;

    await runAllNotificationsInOrder(NOTIFICATION_CHANNELS);
  } catch {
    // ignore errors to keep scheduler alive
  } finally {
    notifyRunning = false;
  }
}

async function runDigestsOnce(now: Date) {
  if (digestRunning) return;
  digestRunning = true;
  try {
    const settings = await getAppSettings();
    const channels: readonly NotificationChannel[] = NOTIFICATION_CHANNELS;
    if (!settings.internalSchedulerEnabled) return;

    if (settings.internalWeeklyDigestEnabled) {
      const { message, period } = await buildWeeklyDigestFromSettings(settings, now);
      for (const channel of channels) {
        try {
          await runDigestForChannel({
            digestType: DIGEST_TYPE.WEEKLY,
            channel,
            settings,
            message,
            period,
            now,
          });
        } catch (err) {
          if (err instanceof NotificationConfigError) continue;
        }
      }
    }

    if (settings.internalMonthlyDigestEnabled) {
      const { message, period } = await buildMonthlyDigestFromSettings(settings, now);
      for (const channel of channels) {
        try {
          await runDigestForChannel({
            digestType: DIGEST_TYPE.MONTHLY,
            channel,
            settings,
            message,
            period,
            now,
          });
        } catch (err) {
          if (err instanceof NotificationConfigError) continue;
        }
      }
    }
  } catch {
    // ignore errors to keep scheduler alive
  } finally {
    digestRunning = false;
  }
}

async function scheduleNextDigestRun() {
  if (digestTimer) {
    clearTimeout(digestTimer);
    digestTimer = null;
  }

  const now = new Date();
  const settings = await getAppSettings();
  if (!settings.internalSchedulerEnabled) return;
  const timeZone = settings.timeZone;

  const rawTime = settings.internalDigestTime?.trim() || "10:00";
  const digestTime = isValidTimeOfDay(rawTime) ? rawTime : "10:00";

  const today = formatDateInTimeZone(now, timeZone);
  const todayAtUtc = dateTimeLocalToUtcDate(`${today}T${digestTime}`, timeZone);

  let nextUtc: Date | null = todayAtUtc;
  const graceMs = 30 * 60 * 1000;
  if (todayAtUtc && todayAtUtc.getTime() <= now.getTime() + 1000) {
    const passedMs = now.getTime() - todayAtUtc.getTime();
    if (passedMs >= 0 && passedMs <= graceMs) {
      nextUtc = new Date(now.getTime() + 60_000);
    }
  }

  if (!nextUtc || nextUtc.getTime() <= now.getTime() + 1000) {
    const tomorrow = addDaysToDateString(today, 1);
    nextUtc = tomorrow ? dateTimeLocalToUtcDate(`${tomorrow}T${digestTime}`, timeZone) : null;
  }

  if (!nextUtc) return;

  const delayMs = Math.max(0, nextUtc.getTime() - Date.now());
  const timer = setTimeout(async () => {
    const startedAt = new Date();
    await runDigestsOnce(startedAt);
    await scheduleNextDigestRun();
  }, delayMs);

  digestTimer = timer;
  safeUnref(timer);
}

function stopNotifyTimer() {
  if (!notifyTimer) return;
  clearInterval(notifyTimer);
  notifyTimer = null;
  currentNotifyIntervalSeconds = null;
}

function stopDigestTimer() {
  if (!digestTimer) return;
  clearTimeout(digestTimer);
  digestTimer = null;
  currentDigestKey = null;
}

function normalizeIntervalSeconds(value: number | null | undefined): number {
  if (typeof value !== "number") return 300;
  if (!Number.isFinite(value)) return 300;
  const floored = Math.floor(value);
  if (floored < 60 || floored > 86400) return 300;
  return floored;
}

export async function syncInternalScheduler(): Promise<void> {
  if (isOneOffLifecycle()) return;

  let settings: Awaited<ReturnType<typeof getAppSettings>>;
  try {
    settings = await getAppSettings();
  } catch {
    return;
  }

  if (!settings.internalSchedulerEnabled) {
    stopNotifyTimer();
    stopDigestTimer();
    return;
  }

  // Notify job
  if (settings.internalNotifyEnabled) {
    const intervalSeconds = normalizeIntervalSeconds(settings.internalNotifyIntervalSeconds);
    if (!notifyTimer || currentNotifyIntervalSeconds !== intervalSeconds) {
      stopNotifyTimer();
      currentNotifyIntervalSeconds = intervalSeconds;
      // Run once shortly after startup, then on interval.
      safeUnref(setTimeout(() => void runNotifyOnce(), 2_000));
      const timer = setInterval(() => void runNotifyOnce(), intervalSeconds * 1000);
      notifyTimer = timer;
      safeUnref(timer);
    }
  } else {
    stopNotifyTimer();
  }

  // Digest job (daily, idempotent)
  const digestKey = [
    settings.timeZone,
    settings.internalDigestTime,
    settings.internalWeeklyDigestEnabled ? "w1" : "w0",
    settings.internalMonthlyDigestEnabled ? "m1" : "m0",
  ].join("|");
  const wantDigests = settings.internalWeeklyDigestEnabled || settings.internalMonthlyDigestEnabled;
  if (wantDigests) {
    if (!digestTimer || currentDigestKey !== digestKey) {
      stopDigestTimer();
      currentDigestKey = digestKey;
      safeUnref(setTimeout(() => void scheduleNextDigestRun().catch(() => {}), 5_000));
    }
  } else {
    stopDigestTimer();
  }
}

export function ensureInternalSchedulerStarted() {
  if (globalThis.__todoListInternalSchedulerStarted) return;
  globalThis.__todoListInternalSchedulerStarted = true;

  if (isOneOffLifecycle()) return;

  void syncInternalScheduler();
}
