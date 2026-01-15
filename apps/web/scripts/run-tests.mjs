import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRootPath = path.join(projectRootPath, "src");

function listTestFiles(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listTestFiles(entryPath));
      continue;
    }

    if (!entry.isFile()) continue;
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".test.tsx")) {
      results.push(entryPath);
    }
  }

  return results;
}

const testFiles = fs.existsSync(sourceRootPath) ? listTestFiles(sourceRootPath) : [];
testFiles.sort((a, b) => a.localeCompare(b));

if (testFiles.length === 0) {
  console.log("No test files found under src/**");
  process.exit(0);
}

const args = [
  "--test",
  "--disable-warning=MODULE_TYPELESS_PACKAGE_JSON",
  "--import",
  "./scripts/register-test-loader.mjs",
  ...testFiles.map((filePath) => path.relative(projectRootPath, filePath)),
];

const result = spawnSync(process.execPath, args, {
  cwd: projectRootPath,
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);

