import Database from "@tauri-apps/plugin-sql";
import type { LocalSqlDriver } from "@reminder-hub/datastore";

/**
 * Adapts Tauri's @tauri-apps/plugin-sql to our LocalSqlDriver interface.
 * DB file: stored in Tauri's app data directory as reminder-hub.db
 */
export async function createTauriSqlDriver(): Promise<LocalSqlDriver> {
  const db = await Database.load("sqlite:reminder-hub.db");

  return {
    async execute(sql, params = []) {
      await db.execute(sql, params as unknown[]);
    },
    async select<T>(sql: string, params: unknown[] = []) {
      return (await db.select(sql, params)) as T[];
    },
  };
}
