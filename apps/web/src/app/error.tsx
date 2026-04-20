"use client";

import Link from "next/link";
import { useEffect } from "react";

import { ROUTES } from "@/lib/routes";

type ErrorPageProps = {
    error: Error & { digest?: string };
    reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        // 开发期直接抛到控制台，生产期同样打一条 console.error 方便 self-host 看到。
        console.error("[app:error]", error);
    }, [error]);

    return (
        <main className="min-h-dvh bg-base text-primary flex items-center justify-center px-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-[hsl(var(--destructive)/0.12)]">
                    <span className="font-display text-xl font-bold tracking-tight text-[hsl(var(--destructive))]">
                        !
                    </span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">出了点状况</h1>
                    <p className="text-sm text-muted-foreground leading-relaxed break-words">
                        {error.message || "服务端抛出了未预期的错误。"}
                    </p>
                    {error.digest && (
                        <p className="text-[11px] font-mono text-muted-foreground/70">
                            digest: {error.digest}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                        type="button"
                        onClick={reset}
                        className="inline-flex h-10 items-center rounded-lg bg-brand-primary px-4 text-sm font-medium text-white hover:opacity-90 transition-opacity"
                    >
                        重试
                    </button>
                    <Link
                        href={ROUTES.home}
                        className="inline-flex h-10 items-center rounded-lg border border-default px-4 text-sm text-secondary hover:bg-muted/30 transition-colors"
                    >
                        回到主页
                    </Link>
                </div>
            </div>
        </main>
    );
}
