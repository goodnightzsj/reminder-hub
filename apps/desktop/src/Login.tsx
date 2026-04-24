import { useState } from "react";
import { Icon } from "@iconify/react";
import { RemoteDataStore } from "@reminder-hub/datastore";
import type { AppConfig } from "./lib/app-config";
import { localizeError } from "./lib/errors";
import { sanitizeBaseUrl } from "./lib/url";

type LoginProps = {
  config: AppConfig;
  onSaved: (c: AppConfig) => Promise<void>;
};

export function Login({ config, onSaved }: LoginProps) {
  const [mode, setMode] = useState(config.mode);
  const [remoteBaseUrl, setRemoteBaseUrl] = useState(config.remoteBaseUrl);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsLogin = mode === "remote" || (mode === "local" && remoteBaseUrl);

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!remoteBaseUrl.trim()) {
        // Pure local mode — no server required, just save and continue.
        await onSaved({ mode: "local", remoteBaseUrl: "", token: null });
        return;
      }
      const sanitized = sanitizeBaseUrl(remoteBaseUrl);
      if (!sanitized.ok) {
        setError(sanitized.error);
        setLoading(false);
        return;
      }
      if (!password) {
        setError("请输入管理密码");
        setLoading(false);
        return;
      }
      const cleanUrl = sanitized.value;
      const remote = new RemoteDataStore(cleanUrl, () => null);
      const result = await remote.authLogin(password);
      setRemoteBaseUrl(cleanUrl);
      await onSaved({ mode, remoteBaseUrl: cleanUrl, token: result.token });
    } catch (e) {
      setError(localizeError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none animate-pulse-slow" />

      <div className="relative w-full max-w-[420px] animate-slide-up">
        <div className="rounded-3xl bg-glass overflow-hidden shadow-2xl">
          <div className="h-1.5 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-primary bg-[length:200%_100%]" />

          <div className="p-8">
            <div className="flex justify-center mb-5">
              <div className="relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary blur-xl opacity-40 animate-pulse-slow" />
                <div className="relative h-16 w-16 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-lg">
                  <Icon icon="ri:shield-keyhole-line" className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            <h1 className="text-center text-2xl font-bold tracking-tight mb-1">
              Reminder Hub
            </h1>
            <p className="text-center text-sm text-muted-foreground mb-8">
              桌面客户端 · 选择数据模式开始使用
            </p>

            {/* Mode selector */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                onClick={() => setMode("local")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "local"
                    ? "border-brand-primary/60 bg-brand-primary/5 ring-2 ring-brand-primary/20"
                    : "border-border bg-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="ri:hard-drive-2-line" className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm font-semibold">本地优先</span>
                </div>
                <p className="text-xs text-muted-foreground">数据存本机，可选同步</p>
              </button>
              <button
                onClick={() => setMode("remote")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  mode === "remote"
                    ? "border-brand-primary/60 bg-brand-primary/5 ring-2 ring-brand-primary/20"
                    : "border-border bg-transparent hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon icon="ri:cloud-line" className="h-4 w-4 text-brand-primary" />
                  <span className="text-sm font-semibold">纯云端</span>
                </div>
                <p className="text-xs text-muted-foreground">完全依赖服务器</p>
              </button>
            </div>

            {/* Server URL */}
            {(mode === "remote" || mode === "local") && (
              <div className="mb-3">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  服务器地址 {mode === "local" && "（可选）"}
                </label>
                <div className="relative">
                  <Icon
                    icon="ri:global-line"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  />
                  <input
                    value={remoteBaseUrl}
                    onChange={(e) => setRemoteBaseUrl(e.target.value)}
                    placeholder="https://reminder.example.com"
                    autoFocus={!config.remoteBaseUrl}
                    className="h-10 w-full rounded-lg border border-border bg-transparent pl-9 pr-3 text-sm outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {needsLogin && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  管理密码
                </label>
                <div className="relative">
                  <Icon
                    icon="ri:lock-line"
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submit()}
                    placeholder="输入密码"
                    autoFocus={!!config.remoteBaseUrl}
                    className="h-10 w-full rounded-lg border border-border bg-transparent pl-9 pr-10 text-sm outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    <Icon icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"} className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-danger/10 text-danger text-xs flex items-center gap-1.5 animate-fade-in">
                <Icon icon="ri:error-warning-line" className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="h-11 w-full rounded-xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white font-medium shadow-md shadow-brand-primary/25 hover:shadow-lg hover:shadow-brand-primary/30 hover:-translate-y-[1px] transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Icon icon="line-md:loading-twotone-loop" className="h-4 w-4" />
                  连接中...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {remoteBaseUrl ? "登录并开始" : "本地模式开始"}
                  <Icon icon="ri:arrow-right-line" className="h-4 w-4" />
                </span>
              )}
            </button>

            {mode === "local" && !remoteBaseUrl && (
              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                不填服务器地址即进入完全离线模式
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
          Reminder Hub · 个人提醒管理中心
        </p>
      </div>
    </div>
  );
}
