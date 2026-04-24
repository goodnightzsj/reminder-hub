"use client";

import { useActionState, useState } from "react";
import { Icon } from "@iconify/react";
import { login, type AuthActionState } from "@/app/_actions/auth";

function getGreeting(): string {
  if (typeof window === "undefined") return "你好";
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  if (h < 22) return "晚上好";
  return "夜深了";
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(login, null);
  const greeting = getGreeting();

  const hasError = !!state?.error;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-base px-4 py-8">
      <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-70 pointer-events-none animate-breathe" />
      <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />

      <div className="w-full max-w-[400px]">
        <div
          className={`group rounded-3xl bg-glass overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-300 focus-within:-translate-y-1 ${
            hasError ? "animate-shake" : "animate-slide-up"
          }`}
        >
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_100%] animate-shimmer-slow" />

          <div className="px-8 pt-10 pb-8">
            <div className="flex justify-center mb-6 animate-slide-up stagger-1">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary blur-xl opacity-40 animate-pulse-slow" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/30">
                  <Icon icon="ri:shield-keyhole-line" className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <h1
              className="text-center font-display text-2xl font-bold tracking-tight mb-1.5 animate-slide-up stagger-2"
              suppressHydrationWarning
            >
              {greeting}
            </h1>
            <p className="text-center text-sm text-secondary mb-8 animate-slide-up stagger-3">
              请输入管理密码继续访问 Reminder Hub
            </p>

            <form action={formAction} className="animate-slide-up stagger-4" aria-label="管理密码登录">
              <label htmlFor="login-password" className="sr-only">
                管理密码
              </label>
              <div className="relative">
                <Icon
                  icon="ri:lock-password-line"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="输入密码"
                  autoFocus
                  autoComplete="current-password"
                  required
                  aria-invalid={hasError}
                  aria-describedby={hasError ? "login-error" : undefined}
                  className={`h-12 w-full rounded-xl border bg-transparent pl-10 pr-12 text-base text-primary outline-none transition-all duration-200 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-brand-primary/25 ${
                    hasError
                      ? "border-danger/60 focus-visible:border-danger/80 focus-visible:ring-danger/25"
                      : "border-default focus-visible:border-brand-primary/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  aria-pressed={showPassword}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-interactive-hover transition-colors"
                >
                  <Icon icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"} className="h-4 w-4" />
                </button>
              </div>

              {hasError && (
                <p
                  id="login-error"
                  role="alert"
                  className="mt-3 text-sm text-danger flex items-center gap-1.5 animate-fade-in"
                >
                  <Icon icon="ri:error-warning-line" className="h-4 w-4 shrink-0" />
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-6 h-12 w-full rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white font-medium shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-[1px] transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none active:scale-[0.98] active:translate-y-0"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    验证中...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    登录
                    <Icon icon="ri:arrow-right-line" className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                )}
              </button>

              <p className="mt-4 text-center text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 animate-fade-in stagger-5">
                <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-default bg-surface px-1 text-[10px] font-mono">
                  Enter
                </kbd>
                快速登录
              </p>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-50 animate-fade-in stagger-5">
          Reminder Hub · 个人提醒管理中心
        </p>
      </div>
    </div>
  );
}
