import { NextResponse } from "next/server";

import { NotificationConfigError, runNotificationsForChannel } from "@/server/notification-runner";
import { NOTIFICATION_CHANNELS, type NotificationChannel } from "@/server/notifications";
import { isCronAuthorized, withCronTimeout } from "@/server/cron-auth";

export const dynamic = "force-dynamic";

const CHANNEL_ORDER: readonly NotificationChannel[] = NOTIFICATION_CHANNELS;

async function runAllChannels() {
  const results: Array<{
    channel: NotificationChannel;
    sent: number;
    failed: number;
    skipped: number;
    status: "ok" | "skipped_config" | "error";
    message?: string;
  }> = [];

  for (const channel of CHANNEL_ORDER) {
    try {
      const r = await runNotificationsForChannel(channel);
      results.push({ channel, ...r, status: "ok" });
    } catch (err) {
      if (err instanceof NotificationConfigError) {
        results.push({ channel, sent: 0, failed: 0, skipped: 0, status: "skipped_config", message: err.code });
        continue;
      }
      const message = err instanceof Error ? err.message : "Unknown error";
      console.warn("[cron:notify] channel failed", { channel, message });
      results.push({ channel, sent: 0, failed: 1, skipped: 0, status: "error", message });
    }
  }

  return results;
}

export async function POST(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const results = await withCronTimeout(runAllChannels());
    return NextResponse.json({
      ok: true,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = message.startsWith("cron_timeout:");
    console.warn("[cron:notify] top-level failure", { message });
    return NextResponse.json(
      { ok: false, error: isTimeout ? "timeout" : "internal_error", message },
      { status: isTimeout ? 504 : 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
