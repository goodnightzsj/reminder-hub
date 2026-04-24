import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import {
  LocalDataStore,
  RemoteDataStore,
  SyncEngine,
  type DataStore,
} from "@reminder-hub/datastore";
import { createTauriSqlDriver } from "./tauri-driver";
import { Login } from "./Login";
import { Dashboard } from "./Dashboard";
import { loadConfig, saveConfig, type AppConfig } from "./lib/app-config";
import { ToastProvider } from "./ui/Toast";

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

  useEffect(() => {
    void boot();
  }, []);

  const boot = async () => {
    try {
      const config = await loadConfig();

      // Needs config if both `remoteBaseUrl` and `mode=remote` without token,
      // or if user has never opened the app before.
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

  const handleLogout = async () => {
    const next: AppConfig = { mode: "local", remoteBaseUrl: "", token: null };
    await saveConfig(next);
    setState({ kind: "needs-config", config: next });
  };

  // Called when the server returns 401 — token expired or revoked. Drop the
  // token and kick the user to the login screen so they can re-auth.
  const handleUnauthorized = () => {
    void handleLogout();
  };

  const enterApp = async (config: AppConfig) => {
    const driver = await createTauriSqlDriver();
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
    } else {
      store = local;
    }

    setState({ kind: "ready", config, store, syncEngine });
  };

  const handleConfigSaved = async (next: AppConfig) => {
    await saveConfig(next);
    await enterApp(next);
  };

  if (state.kind === "booting") {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Icon icon="line-md:loading-twotone-loop" className="h-8 w-8" />
          <p className="text-sm">启动中…</p>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
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
    return <Login config={state.config} onSaved={handleConfigSaved} />;
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
