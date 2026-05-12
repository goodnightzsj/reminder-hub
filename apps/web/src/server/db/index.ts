import "server-only";

import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import * as schema from "./schema";

const databaseFilePath =
  process.env.DATABASE_FILE_PATH ??
  path.join(process.cwd(), "data", "app.db");

fs.mkdirSync(path.dirname(databaseFilePath), { recursive: true });

const sqlite = new Database(databaseFilePath);
sqlite.pragma("foreign_keys = ON");
// WAL: readers don't block the writer and vice-versa — matches this app's
// "foreground page renders read, background scheduler / digest runner write"
// shape. Without it (default journal_mode=DELETE) a background batch write
// blocks every page request for the busy-timeout window.
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("busy_timeout = 5000");

export const db = drizzle(sqlite, { schema });

function sleepSync(ms: number) {
  const buf = new SharedArrayBuffer(4);
  const arr = new Int32Array(buf);
  Atomics.wait(arr, 0, 0, ms);
}

function withMigrateLock(fn: () => void) {
  const lockPath = path.join(path.dirname(databaseFilePath), ".drizzle-migrate.lock");
  const startedAt = Date.now();
  const maxWaitMs = 15_000;
  const staleMs = 5 * 60_000;

  while (true) {
    try {
      const fd = fs.openSync(lockPath, "wx");
      try {
        fs.writeFileSync(fd, `${process.pid} ${new Date().toISOString()}`);
      } finally {
        try {
          fs.closeSync(fd);
        } catch {
          // ignore
        }
      }

      try {
        fn();
      } finally {
        try {
          fs.unlinkSync(lockPath);
        } catch {
          // ignore
        }
      }
      return;
    } catch (err) {
      if (typeof err === "object" && err !== null && "code" in err && (err as { code?: unknown }).code === "EEXIST") {
        try {
          const stat = fs.statSync(lockPath);
          const age = Date.now() - stat.mtimeMs;
          if (age > staleMs) {
            fs.unlinkSync(lockPath);
            continue;
          }
        } catch {
          // ignore
        }

        if (Date.now() - startedAt > maxWaitMs) {
          return;
        }

        sleepSync(100);
        continue;
      }
      throw err;
    }
  }
}

if (process.env.SKIP_DB_MIGRATIONS !== "1") {
  withMigrateLock(() => {
    migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  });
}
