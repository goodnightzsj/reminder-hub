import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

const databaseFilePath =
  process.env.DATABASE_FILE_PATH ??
  path.join(process.cwd(), "data", "app.db");

fs.mkdirSync(path.dirname(databaseFilePath), { recursive: true });

const sqlite = new Database(databaseFilePath);
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
