import "server-only";

import { NextResponse } from "next/server";

import { DIGEST_TYPE } from "@/lib/digests";
import { runDigestForChannel } from "@/server/digest-runner";
import { NotificationConfigError } from "@/server/notification-channel-config";
import { getAppSettings } from "@/server/db/settings";
import { NOTIFICATION_CHANNELS, type NotificationChannel } from "@/server/notifications";
import { buildWeeklyDigestFromSettings, buildMonthlyDigestFromSettings } from "@/server/digests";
import { isCronAuthorized, withCronTimeout } from "@/server/cron-auth";

const CHANNEL_ORDER: readonly NotificationChannel[] = NOTIFICATION_CHANNELS;

type CronDigestType = typeof DIGEST_TYPE.WEEKLY | typeof DIGEST_TYPE.MONTHLY;
type DigestBuilder = typeof buildWeeklyDigestFromSettings | typeof buildMonthlyDigestFromSettings;

const BUILDERS: Record<CronDigestType, DigestBuilder> = {
  [DIGEST_TYPE.WEEKLY]: buildWeeklyDigestFromSettings,
  [DIGEST_TYPE.MONTHLY]: buildMonthlyDigestFromSettings,
};

export async function handleDigestCron(request: Request, digestType: CronDigestType) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const result = await withCronTimeout(runDigestJob(digestType, startedAt));
    return NextResponse.json({
      ok: true,
      digestType,
      period: result.period,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      results: result.results,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = msg.startsWith("cron_timeout:");
    console.warn(`[cron:digest:${digestType}] top-level failure`, { message: msg });
    return NextResponse.json(
      { ok: false, error: isTimeout ? "timeout" : "internal_error", message: msg },
      { status: isTimeout ? 504 : 500 },
    );
  }
}

type ChannelResult = {
  channel: NotificationChannel;
  sent: number;
  failed: number;
  skipped: number;
  status: "ok" | "skipped_config" | "error";
  message?: string;
};

async function runDigestJob(digestType: CronDigestType, startedAt: Date) {
  const settings = await getAppSettings();
  const { message, period } = await BUILDERS[digestType](settings, startedAt);

  const results: ChannelResult[] = [];
  for (const channel of CHANNEL_ORDER) {
    try {
      const r = await runDigestForChannel({
        digestType,
        channel,
        settings,
        message,
        period,
        now: startedAt,
      });
      results.push({ channel, ...r, status: "ok" });
    } catch (err) {
      if (err instanceof NotificationConfigError) {
        results.push({ channel, sent: 0, failed: 0, skipped: 0, status: "skipped_config", message: err.code });
        continue;
      }
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.warn(`[cron:digest:${digestType}] channel failed`, { channel, message: msg });
      results.push({ channel, sent: 0, failed: 1, skipped: 0, status: "error", message: msg });
    }
  }

  return { period, results };
}
