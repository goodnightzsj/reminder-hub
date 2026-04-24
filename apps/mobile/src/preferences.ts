import { Preferences } from "@capacitor/preferences";

export type AppConfig = {
  mode: "local" | "remote";
  remoteBaseUrl: string;
  token: string | null;
};

const KEY = "reminder-hub-config";

export async function loadConfig(): Promise<AppConfig> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return { mode: "local", remoteBaseUrl: "", token: null };
  try {
    return JSON.parse(value) as AppConfig;
  } catch {
    return { mode: "local", remoteBaseUrl: "", token: null };
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(config) });
}
