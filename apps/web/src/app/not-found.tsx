import Link from "next/link";
import type { Metadata } from "next";

import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "页面未找到",
};

export default function NotFound() {
  return (
    <main className="min-h-dvh bg-base text-primary flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60">
          <span className="font-display text-3xl font-bold tracking-tight tabular-nums text-muted-foreground">
            404
          </span>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">页面不见了</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            链接可能已变动，或者对应的记录已被删除。
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href={ROUTES.home}
            className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            回到主页
          </Link>
          <Link
            href={ROUTES.dashboard}
            className="inline-flex h-10 items-center rounded-lg border border-default px-4 text-sm text-secondary hover:bg-muted/30 transition-colors"
          >
            打开仪表盘
          </Link>
        </div>
      </div>
    </main>
  );
}
