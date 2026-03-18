import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const projectRootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function resolveDatabaseFilePath() {
  const url = process.env.DATABASE_URL ?? null;
  if (!url) {
    const filePath = process.env.DATABASE_FILE_PATH ?? "./data/app.db";
    return path.resolve(projectRootPath, filePath);
  }
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    return path.resolve(projectRootPath, filePath);
  }

  return path.resolve(projectRootPath, url);
}

function sha256HexFromFile(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function loadJournal() {
  const journalPath = path.join(projectRootPath, "drizzle", "meta", "_journal.json");
  const raw = fs.readFileSync(journalPath, "utf8");
  const parsed = JSON.parse(raw);
  const entries = Array.isArray(parsed?.entries) ? parsed.entries : [];
  return { entries };
}

function getJournalWhen(entries, tag) {
  for (const entry of entries) {
    if (entry && typeof entry === "object" && entry.tag === tag && typeof entry.when === "number") {
      return entry.when;
    }
  }
  return null;
}

const databaseFilePath = resolveDatabaseFilePath();
const db = new Database(databaseFilePath);
db.pragma("foreign_keys = ON");

const { entries: journalEntries } = loadJournal();

function tableExists(tableName) {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(tableName);
  return !!row;
}

function getAppliedMigrationHashes() {
  if (!tableExists("__drizzle_migrations")) return new Set();
  const rows = db.prepare(`SELECT hash FROM __drizzle_migrations`).all();
  return new Set(rows.map((r) => r.hash).filter((hash) => typeof hash === "string"));
}

function insertMigrationHash(hash, createdAt) {
  db.prepare(`INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)`).run(hash, createdAt);
}

function baselineMigrationIfAlreadyApplied(tag, isAlreadyApplied) {
  if (!tableExists("__drizzle_migrations")) return { tag, skipped: true, reason: "__drizzle_migrations_missing" };

  const sqlPath = path.join(projectRootPath, "drizzle", `${tag}.sql`);
  if (!fs.existsSync(sqlPath)) return { tag, skipped: true, reason: "sql_missing" };

  const when = getJournalWhen(journalEntries, tag);
  if (when === null) return { tag, skipped: true, reason: "journal_missing" };

  const hash = sha256HexFromFile(sqlPath);
  const applied = getAppliedMigrationHashes();
  if (applied.has(hash)) return { tag, skipped: true, reason: "already_recorded" };

  if (!isAlreadyApplied()) return { tag, skipped: true, reason: "schema_not_applied" };

  insertMigrationHash(hash, when);
  return { tag, inserted: true };
}

const actions = [];

// Repair: Some dev DBs were created via push/manual DDL, leaving migrations missing but schema present.
// 0018 creates brand_metadata (non-idempotent), so drizzle-kit migrate would fail if the table already exists.
actions.push(baselineMigrationIfAlreadyApplied(
  "0018_orange_nick_fury",
  () => tableExists("brand_metadata"),
));

const inserted = actions.filter((a) => a && a.inserted).map((a) => a.tag);

if (inserted.length > 0) {
  console.log(`Drizzle baseline: inserted ${inserted.join(", ")} into __drizzle_migrations`);
}

db.close();
