import { NextResponse } from "next/server";

import { NotificationConfigError, runNotificationsForChannel } from "@/server/notification-runner";
import { NOTIFICATION_CHANNELS, type NotificationChannel } from "@/server/notifications";

export const dynamic = "force-dynamic";

const CHANNEL_ORDER: readonly NotificationChannel[] = NOTIFICATION_CHANNELS;

function isAuthorized(request: Request): boolean {
  const secret = process.env.NOTIFY_CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ") && auth.slice("Bearer ".length) === secret) {
    return true;
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (token && token === secret) return true;

  return false;
}

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
      results.push({ channel, sent: 0, failed: 1, skipped: 0, status: "error", message });
    }
  }

  return results;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const startedAt = new Date();

  try {
    const results = await runAllChannels();
    return NextResponse.json({
      ok: true,
      startedAt: startedAt.toISOString(),
      finishedAt: new Date().toISOString(),
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: "internal_error", message },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
