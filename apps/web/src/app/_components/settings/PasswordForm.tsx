"use client";

import { useActionState, useState } from "react";
import { Icon } from "@iconify/react";
import {
  setAdminPassword,
  changeAdminPassword,
  removeAdminPassword,
  logout,
  type AuthActionState,
} from "@/app/_actions/auth";

type Mode = "idle" | "change" | "remove";

function PasswordInput({
  name,
  placeholder,
  autoFocus,
  autoComplete,
}: {
  name: string;
  placeholder: string;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        name={name}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete ?? "off"}
        required
        className="h-10 w-full rounded-lg border border-default bg-transparent px-3 pr-10 text-sm text-primary outline-none transition-all duration-200 placeholder:text-muted-foreground focus-visible:border-brand-primary/60 focus-visible:ring-2 focus-visible:ring-brand-primary/25"
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
        tabIndex={-1}
      >
        <Icon icon={show ? "ri:eye-off-line" : "ri:eye-line"} className="h-4 w-4" />
      </button>
    </div>
  );
}

function StatusMessage({ state }: { state: AuthActionState }) {
  if (!state) return null;
  if (state.success) {
    return (
      <p className="mt-3 text-sm text-success flex items-center gap-1.5 animate-fade-in">
        <Icon icon="ri:check-line" className="h-4 w-4 shrink-0" />
        操作成功
      </p>
    );
  }
  if (state.error) {
    return (
      <p className="mt-3 text-sm text-danger flex items-center gap-1.5 animate-fade-in">
        <Icon icon="ri:error-warning-line" className="h-4 w-4 shrink-0" />
        {state.error}
      </p>
    );
  }
  return null;
}

function SetPasswordForm() {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(setAdminPassword, null);

  return (
    <div>
      <p className="text-xs text-secondary mb-4">
        当前未设置管理密码，应用处于开放访问状态。设置密码后，访问将需要验证。
      </p>
      <form action={formAction} className="space-y-3 max-w-sm">
        <PasswordInput name="password" placeholder="设置密码（至少 4 位）" autoFocus autoComplete="new-password" />
        <PasswordInput name="confirmPassword" placeholder="确认密码" autoComplete="new-password" />
        <StatusMessage state={state} />
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-lg bg-gradient-to-b from-brand-primary to-brand-secondary px-5 text-xs font-medium text-white shadow-sm shadow-brand-primary/20 hover:shadow-md transition-all disabled:opacity-50 active-press"
        >
          {isPending ? "设置中..." : "设置管理密码"}
        </button>
      </form>
    </div>
  );
}

function ChangePasswordForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(changeAdminPassword, null);

  if (state?.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-success animate-fade-in">
        <Icon icon="ri:check-line" className="h-4 w-4" />
        密码已修改
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 max-w-sm animate-slide-up">
      <PasswordInput name="currentPassword" placeholder="当前密码" autoFocus autoComplete="current-password" />
      <PasswordInput name="newPassword" placeholder="新密码（至少 4 位）" autoComplete="new-password" />
      <PasswordInput name="confirmPassword" placeholder="确认新密码" autoComplete="new-password" />
      <StatusMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-lg bg-gradient-to-b from-brand-primary to-brand-secondary px-5 text-xs font-medium text-white shadow-sm shadow-brand-primary/20 hover:shadow-md transition-all disabled:opacity-50 active-press"
        >
          {isPending ? "修改中..." : "确认修改"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-default bg-transparent px-4 text-xs font-medium text-secondary hover:bg-interactive-hover transition-colors active-press"
        >
          取消
        </button>
      </div>
    </form>
  );
}

function RemovePasswordForm({ onCancel }: { onCancel: () => void }) {
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(removeAdminPassword, null);

  if (state?.success) {
    return (
      <div className="flex items-center gap-2 text-sm text-success animate-fade-in">
        <Icon icon="ri:check-line" className="h-4 w-4" />
        密码已移除，应用恢复开放访问
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 max-w-sm animate-slide-up">
      <p className="text-xs text-danger/80">
        移除密码后，任何人都可以访问此应用。请输入当前密码以确认。
      </p>
      <PasswordInput name="currentPassword" placeholder="输入当前密码" autoFocus autoComplete="current-password" />
      <StatusMessage state={state} />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="h-9 rounded-lg bg-gradient-to-b from-red-500 to-red-600 px-5 text-xs font-medium text-white shadow-sm shadow-red-500/20 hover:shadow-md transition-all disabled:opacity-50 active-press"
        >
          {isPending ? "移除中..." : "确认移除"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg border border-default bg-transparent px-4 text-xs font-medium text-secondary hover:bg-interactive-hover transition-colors active-press"
        >
          取消
        </button>
      </div>
    </form>
  );
}

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [mode, setMode] = useState<Mode>("idle");

  if (!hasPassword) {
    return <SetPasswordForm />;
  }

  return (
    <div>
      {mode === "idle" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/15">
              <Icon icon="ri:shield-check-line" className="h-3.5 w-3.5 text-success" />
            </span>
            <span className="text-secondary">已启用密码保护</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode("change")}
              className="h-9 rounded-lg border border-default bg-surface px-4 text-xs font-medium text-primary hover:bg-interactive-hover transition-colors active-press"
            >
              修改密码
            </button>
            <button
              onClick={() => setMode("remove")}
              className="h-9 rounded-lg border border-danger/30 bg-transparent px-4 text-xs font-medium text-danger hover:bg-danger/5 transition-colors active-press"
            >
              移除密码
            </button>
            <form action={logout}>
              <button
                type="submit"
                className="h-9 rounded-lg border border-default bg-transparent px-4 text-xs font-medium text-secondary hover:bg-interactive-hover transition-colors active-press flex items-center gap-1.5"
              >
                <Icon icon="ri:logout-box-r-line" className="h-3.5 w-3.5" />
                退出登录
              </button>
            </form>
          </div>
        </div>
      )}
      {mode === "change" && <ChangePasswordForm onCancel={() => setMode("idle")} />}
      {mode === "remove" && <RemovePasswordForm onCancel={() => setMode("idle")} />}
    </div>
  );
}
