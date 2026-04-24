import { useState } from "react";
import { Icon } from "@iconify/react";
import { RemoteDataStore } from "@reminder-hub/datastore";
import type { AppConfig } from "./preferences";

type LoginProps = {
  config: AppConfig;
  onSaved: (c: AppConfig) => Promise<void>;
};

export function Login({ config, onSaved }: LoginProps) {
  const [mode, setMode] = useState<AppConfig["mode"]>(config.mode);
  const [remoteBaseUrl, setRemoteBaseUrl] = useState(config.remoteBaseUrl);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      if (!remoteBaseUrl) {
        await onSaved({ mode: "local", remoteBaseUrl: "", token: null });
        return;
      }
      if (!password) {
        setError("请输入管理密码");
        setLoading(false);
        return;
      }
      const remote = new RemoteDataStore(remoteBaseUrl, () => null);
      const result = await remote.authLogin(password);
      await onSaved({ mode, remoteBaseUrl, token: result.token });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col pt-safe px-safe overflow-hidden">
      <div className="absolute inset-0 bg-mesh opacity-40 pointer-events-none" />

      <div className="relative flex-1 flex flex-col justify-center p-6 pb-safe max-w-md mx-auto w-full">
        {/* Hero */}
        <div className="mb-8 animate-slide-up">
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
          <p className="text-center text-sm text-muted-foreground">
            选择数据模式开始使用
          </p>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 animate-slide-up">
          <button
            onClick={() => setMode("local")}
            className={`tap-scale p-3.5 rounded-2xl border text-left transition-all ${
              mode === "local"
                ? "border-brand-primary/60 bg-brand-primary/5"
                : "border-border bg-card/50"
            }`}
          >
            <Icon icon="ri:hard-drive-2-line" className="h-5 w-5 text-brand-primary mb-1.5" />
            <div className="text-sm font-semibold">本地优先</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">数据存手机，可选同步</p>
          </button>
          <button
            onClick={() => setMode("remote")}
            className={`tap-scale p-3.5 rounded-2xl border text-left transition-all ${
              mode === "remote"
                ? "border-brand-primary/60 bg-brand-primary/5"
                : "border-border bg-card/50"
            }`}
          >
            <Icon icon="ri:cloud-line" className="h-5 w-5 text-brand-primary mb-1.5" />
            <div className="text-sm font-semibold">纯云端</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">完全依赖服务器</p>
          </button>
        </div>

        {/* Server URL */}
        <div className="mb-3 animate-slide-up">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 px-1">
            服务器地址 {mode === "local" && "（可选）"}
          </label>
          <div className="relative">
            <Icon
              icon="ri:global-line"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
            />
            <input
              value={remoteBaseUrl}
              onChange={(e) => setRemoteBaseUrl(e.target.value)}
              placeholder="https://reminder.example.com"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm outline-none"
            />
          </div>
        </div>

        {/* Password */}
        {remoteBaseUrl && (
          <div className="mb-4 animate-slide-up">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 px-1">
              管理密码
            </label>
            <div className="relative">
              <Icon
                icon="ri:lock-line"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
                autoCapitalize="none"
                autoCorrect="off"
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-11 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground active:bg-muted/50"
              >
                <Icon icon={showPassword ? "ri:eye-off-line" : "ri:eye-line"} className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 px-3 py-2.5 rounded-xl bg-danger/10 text-danger text-xs flex items-center gap-1.5 animate-fade-in">
            <Icon icon="ri:error-warning-line" className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={submit}
          disabled={loading}
          className="tap-scale h-12 w-full rounded-2xl bg-gradient-to-b from-brand-primary to-brand-secondary text-white font-medium shadow-lg shadow-brand-primary/25 disabled:opacity-50 animate-slide-up"
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

        <p className="text-center text-[10px] text-muted-foreground mt-8 opacity-60">
          Reminder Hub · 个人提醒管理中心
        </p>
      </div>
    </div>
  );
}
