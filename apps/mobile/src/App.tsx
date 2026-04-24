import { useEffect, useState } from "react";
import {
  LocalDataStore,
  RemoteDataStore,
  SyncEngine,
  type DataStore,
  type TodoRecord,
} from "@reminder-hub/datastore";
import { createCapacitorSqlDriver } from "./capacitor-driver";
import { loadConfig, saveConfig } from "./preferences";
import { registerPushNotifications } from "./push";

type AppMode = "local" | "remote";

type AppConfig = {
  mode: AppMode;
  remoteBaseUrl: string;
  token: string | null;
};

export function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [store, setStore] = useState<DataStore | null>(null);
  const [syncEngine, setSyncEngine] = useState<SyncEngine | null>(null);
  const [todos, setTodos] = useState<TodoRecord[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    loadConfig().then(setConfig).catch((e) => setStatus(`加载配置失败: ${e}`));
  }, []);

  useEffect(() => {
    if (!config) return;
    (async () => {
      try {
        const driver = await createCapacitorSqlDriver();
        const local = new LocalDataStore(driver);

        if (config.mode === "remote" && config.remoteBaseUrl) {
          const remote = new RemoteDataStore(config.remoteBaseUrl, () => config.token);
          setStore(remote);
          setSyncEngine(null);
        } else if (config.mode === "local" && config.remoteBaseUrl && config.token) {
          const remote = new RemoteDataStore(config.remoteBaseUrl, () => config.token);
          setStore(local);
          setSyncEngine(new SyncEngine(local, remote));
          // Register for push notifications when connected to a remote.
          registerPushNotifications(async (token, platform) => {
            try {
              await fetch(`${config.remoteBaseUrl}/api/v1/push/register`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${config.token}`,
                },
                body: JSON.stringify({ token, platform }),
              });
            } catch (e) {
              console.warn("failed to register push token:", e);
            }
          }).catch((e) => console.warn("push registration failed:", e));
        } else {
          setStore(local);
          setSyncEngine(null);
        }
        setStatus("");
      } catch (e) {
        setStatus(`初始化数据层失败: ${e instanceof Error ? e.message : e}`);
      }
    })();
  }, [config]);

  useEffect(() => {
    if (!store) return;
    store.listTodos().then(setTodos).catch((e) => setStatus(`加载待办失败: ${e}`));
  }, [store]);

  if (!config) return <div style={pad}>加载中…</div>;

  const refresh = async () => {
    if (!store) return;
    setTodos(await store.listTodos());
  };

  const addTodo = async () => {
    if (!store || !newTitle.trim()) return;
    await store.createTodo({ title: newTitle.trim() });
    setNewTitle("");
    await refresh();
  };

  const toggleTodo = async (todo: TodoRecord) => {
    if (!store) return;
    await store.updateTodo(todo.id, { isDone: !todo.isDone });
    await refresh();
  };

  const doSync = async () => {
    if (!syncEngine) return;
    setStatus("同步中…");
    const result = await syncEngine.run();
    if (result.kind === "success") {
      setStatus(`同步完成：上传 ${result.uploaded}，下载 ${result.downloaded}`);
      await refresh();
    } else if (result.kind === "error") {
      setStatus(`同步失败：${result.message}`);
    }
  };

  return (
    <div style={{ ...pad, fontFamily: "-apple-system, sans-serif", paddingBottom: 80 }}>
      <h1 style={{ fontSize: 22, marginBottom: 12 }}>Reminder Hub</h1>

      <ConfigPanel config={config} onSave={async (c) => { await saveConfig(c); setConfig(c); }} />

      {status && (
        <div style={{ margin: "12px 0", padding: "8px 12px", background: "#f0f7ff", borderRadius: 6, fontSize: 13 }}>
          {status}
        </div>
      )}

      {syncEngine && (
        <button onClick={doSync} style={btn}>
          立即同步
        </button>
      )}

      <h2 style={{ marginTop: 20, marginBottom: 10, fontSize: 16 }}>待办</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="新建待办"
          style={input}
        />
        <button onClick={addTodo} style={btn}>
          添加
        </button>
      </div>

      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {todos.map((t) => (
          <li
            key={t.id}
            onClick={() => toggleTodo(t)}
            style={{
              padding: "14px 12px",
              borderBottom: "1px solid #eee",
              textDecoration: t.isDone ? "line-through" : "none",
              color: t.isDone ? "#999" : "#222",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <input type="checkbox" checked={t.isDone} readOnly style={{ pointerEvents: "none" }} />
            <span>{t.title}</span>
          </li>
        ))}
        {todos.length === 0 && (
          <li style={{ padding: "24px 0", color: "#999", textAlign: "center" }}>暂无待办</li>
        )}
      </ul>
    </div>
  );
}

function ConfigPanel({
  config,
  onSave,
}: {
  config: AppConfig;
  onSave: (c: AppConfig) => Promise<void>;
}) {
  const [mode, setMode] = useState(config.mode);
  const [remoteBaseUrl, setRemoteBaseUrl] = useState(config.remoteBaseUrl);
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [err, setErr] = useState("");

  const login = async () => {
    setErr("");
    setLoggingIn(true);
    try {
      const remote = new RemoteDataStore(remoteBaseUrl, () => null);
      const result = await remote.authLogin(password);
      await onSave({ mode, remoteBaseUrl, token: result.token });
      setPassword("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div style={{ background: "#f8f9fa", padding: 12, borderRadius: 8, fontSize: 13 }}>
      <div style={{ marginBottom: 8 }}>
        <label style={{ marginRight: 12 }}>
          <input type="radio" checked={mode === "local"} onChange={() => setMode("local")} /> 本地
        </label>
        <label>
          <input type="radio" checked={mode === "remote"} onChange={() => setMode("remote")} /> 云端
        </label>
      </div>

      <input
        value={remoteBaseUrl}
        onChange={(e) => setRemoteBaseUrl(e.target.value)}
        placeholder="https://your-server.example.com"
        style={{ ...input, width: "100%", marginBottom: 6 }}
      />

      {!config.token && remoteBaseUrl && (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="管理密码"
            style={{ ...input, flex: 1 }}
          />
          <button onClick={login} disabled={loggingIn} style={btn}>
            {loggingIn ? "登录中…" : "登录"}
          </button>
        </div>
      )}

      {config.token && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: "#28a745" }}>✓ 已登录</span>
          <button onClick={async () => { await onSave({ mode, remoteBaseUrl, token: null }); }} style={{ ...btn, background: "#fee", color: "#c33" }}>
            注销
          </button>
          <button onClick={async () => { await onSave({ mode, remoteBaseUrl, token: config.token }); }} style={btn}>
            保存
          </button>
        </div>
      )}

      {err && <div style={{ color: "#c33", marginTop: 6 }}>{err}</div>}
    </div>
  );
}

const pad: React.CSSProperties = {
  padding: 20,
  maxWidth: 600,
  margin: "0 auto",
};

const btn: React.CSSProperties = {
  padding: "10px 14px",
  border: "none",
  borderRadius: 6,
  background: "#2970ed",
  color: "white",
  fontSize: 14,
  cursor: "pointer",
};

const input: React.CSSProperties = {
  padding: "10px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14,
  flex: 1,
};
