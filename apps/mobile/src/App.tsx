import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  LocalDataStore,
  RemoteDataStore,
  SyncEngine,
  type DataStore,
} from "@reminder-hub/datastore";
import { createCapacitorSqlDriver } from "./capacitor-driver";
import { loadConfig, saveConfig, type AppConfig } from "./preferences";
import { registerPushNotifications } from "./push";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { ToastProvider, useToast } from "./ui/Toast";
import { localizeError } from "./lib/errors";

type AppState =
  | { kind: "booting" }
  | { kind: "needs-config"; config: AppConfig }
  | { kind: "ready"; config: AppConfig; store: DataStore; syncEngine: SyncEngine | null }
  | { kind: "error"; message: string };

export function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const [state, setState] = useState<AppState>({ kind: "booting" });
  const toast = useToast();

  useEffect(() => {
    // Respect the system color scheme for the native status bar.
    StatusBar.setStyle({ style: Style.Default }).catch(() => {});
    void boot();
  }, []);

  const boot = async () => {
    try {
      const config = await loadConfig();
      const isConfigured =
        (config.mode === "local" && (!config.remoteBaseUrl || config.token)) ||
        (config.mode === "remote" && config.token);

      if (!isConfigured) {
        setState({ kind: "needs-config", config });
        return;
      }

      await enterApp(config);
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const handleUnauthorized = () => {
    void handleLogout();
  };

  const enterApp = async (config: AppConfig) => {
    const driver = await createCapacitorSqlDriver();
    const local = new LocalDataStore(driver);

    let store: DataStore;
    let syncEngine: SyncEngine | null = null;

    if (config.mode === "remote" && config.remoteBaseUrl) {
      store = new RemoteDataStore(config.remoteBaseUrl, () => config.token, {
        onUnauthorized: handleUnauthorized,
      });
    } else if (config.mode === "local" && config.remoteBaseUrl && config.token) {
      const remote = new RemoteDataStore(config.remoteBaseUrl, () => config.token, {
        onUnauthorized: handleUnauthorized,
      });
      store = local;
      syncEngine = new SyncEngine(local, remote);

      // Register for push notifications when a server + token is present.
      registerPushNotifications(
        async (token, platform) => {
          try {
            const res = await fetch(`${config.remoteBaseUrl}/api/v1/push/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.token}`,
              },
              body: JSON.stringify({ token, platform }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          } catch (e) {
            toast.show("error", `推送同步失败：${localizeError(e)}`);
          }
        },
        (msg) => {
          toast.show("error", `推送注册失败：${msg}`);
        },
      ).catch((e) => {
        // Plugin-level setup errors (plugin missing, native API unavailable) —
        // not user-actionable, keep silent in UI.
        console.warn("push setup:", e);
      });
    } else {
      store = local;
    }

    setState({ kind: "ready", config, store, syncEngine });
  };

  const handleSaved = async (next: AppConfig) => {
    await saveConfig(next);
    await enterApp(next);
  };

  const handleLogout = async () => {
    const next: AppConfig = { mode: "local", remoteBaseUrl: "", token: null };
    await saveConfig(next);
    setState({ kind: "needs-config", config: next });
  };

  if (state.kind === "booting") {
    return (
      <div className="h-full w-full flex items-center justify-center pt-safe pb-safe">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Icon icon="line-md:loading-twotone-loop" className="h-8 w-8" />
          <p className="text-sm">启动中…</p>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 pt-safe pb-safe">
        <div className="max-w-md text-center">
          <div className="h-12 w-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Icon icon="ri:error-warning-line" className="h-6 w-6 text-danger" />
          </div>
          <h1 className="text-base font-semibold mb-1">启动失败</h1>
          <p className="text-sm text-muted-foreground">{state.message}</p>
        </div>
      </div>
    );
  }

  if (state.kind === "needs-config") {
    return <Login config={state.config} onSaved={handleSaved} />;
  }

  return (
    <Dashboard
      config={state.config}
      store={state.store}
      syncEngine={state.syncEngine}
      onLogout={handleLogout}
    />
  );
}
