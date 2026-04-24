"use client";

import { useActionState, useState } from "react";
import { Icon } from "@iconify/react";
import { login, type AuthActionState } from "@/app/_actions/auth";

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(login, null);
  const hasError = !!state?.error;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-base p-4">
      <div className="fixed inset-0 z-[-1] bg-mesh-gradient opacity-60 pointer-events-none" />
      <div className="fixed inset-0 z-[-1] bg-noise pointer-events-none" />

      <div className="w-full max-w-[380px] animate-slide-up">
        <div className={`rounded-2xl bg-glass overflow-hidden shadow-xl ${hasError ? "animate-shake" : ""}`}>
          <div className="h-1.5 bg-gradient-to-r from-brand-primary to-brand-secondary" />

          <div className="px-8 pt-10 pb-8">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg shadow-brand-primary/25">
                <Icon icon="ri:lock-2-line" className="h-8 w-8 text-white" />
              </div>
            </div>

            <h1 className="text-center font-display text-xl font-bold tracking-tight mb-1">
              Reminder Hub
            </h1>
            <p className="text-center text-sm text-secondary mb-8">
              请输入管理密码以继续
            </p>

            <form action={formAction}>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="输入密码"
                  autoFocus
                  autoComplete="current-password"
                  required
                  className="h-12 w-full rounded-xl border border-default bg-transparent px-4 pr-12 text-base text-primary outline-none transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-primary transition-colors"
                  tabIndex={-1}
                >
                  <Icon icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"} className="h-5 w-5" />
                </button>
              </div>

              {hasError && (
                <p className="mt-3 text-sm text-danger flex items-center gap-1.5 animate-fade-in">
                  <Icon icon="ri:error-warning-line" className="h-4 w-4 shrink-0" />
                  {state.error}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="mt-6 h-12 w-full rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white font-medium shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/30 transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    验证中...
                  </span>
                ) : (
                  "登  录"
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          个人提醒管理中心
        </p>
      </div>
    </div>
  );
}
