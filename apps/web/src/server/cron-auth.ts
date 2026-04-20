import "server-only";

import { timingSafeEqual } from "node:crypto";

/**
 * 常量时间字符串比较，避免基于响应时间的侧信道泄露。
 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/**
 * 校验 cron 请求：未配置 NOTIFY_CRON_SECRET 时放行；否则必须携带正确的 Bearer 或 ?token=。
 */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.NOTIFY_CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    if (safeEqual(auth.slice("Bearer ".length), secret)) return true;
  }

  const token = new URL(request.url).searchParams.get("token");
  if (token && safeEqual(token, secret)) return true;

  return false;
}

/**
 * 给异步任务套上硬超时（默认 55s，略小于 Serverless 60s 上限）。
 * 超时后 Promise reject，任务本身不会被真正中断，用于快速返回给调用方。
 */
export async function withCronTimeout<T>(
  task: Promise<T>,
  timeoutMs: number = 55_000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race<T>([
      task,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`cron_timeout:${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
