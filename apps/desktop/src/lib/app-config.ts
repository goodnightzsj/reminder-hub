import { Store } from "@tauri-apps/plugin-store";

export type AppMode = "local" | "remote";

export type AppConfig = {
  mode: AppMode;
  remoteBaseUrl: string;
  token: string | null;
};

const CONFIG_FILE = "config.json";

export async function loadConfig(): Promise<AppConfig> {
  const store = await Store.load(CONFIG_FILE);
  const mode = ((await store.get<string>("mode")) as AppMode) ?? "local";
  const remoteBaseUrl = (await store.get<string>("remoteBaseUrl")) ?? "";
  const token = (await store.get<string>("token")) ?? null;
  return { mode, remoteBaseUrl, token };
}

export async function saveConfig(config: AppConfig) {
  const store = await Store.load(CONFIG_FILE);
  await store.set("mode", config.mode);
  await store.set("remoteBaseUrl", config.remoteBaseUrl);
  if (config.token) await store.set("token", config.token);
  else await store.delete("token");
  await store.save();
}
