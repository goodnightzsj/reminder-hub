import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const projectRootPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRootPath = path.join(projectRootPath, "src");

function pathExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveWithExtensions(basePath) {
  if (path.extname(basePath) && pathExists(basePath)) {
    return pathToFileURL(basePath).href;
  }

  const candidates = [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.cjs`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.mjs"),
    path.join(basePath, "index.cjs"),
    path.join(basePath, "index.json"),
  ];

  for (const candidate of candidates) {
    if (pathExists(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }

  return null;
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === "server-only" || specifier === "client-only") {
    return {
      url: "data:text/javascript,export {}",
      shortCircuit: true,
    };
  }

  if (specifier.startsWith("@/")) {
    const basePath = path.join(sourceRootPath, specifier.slice(2));
    const url = resolveWithExtensions(basePath);
    if (url) {
      return { url, shortCircuit: true };
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    context.parentURL?.startsWith("file:")
  ) {
    const parentPath = fileURLToPath(context.parentURL);
    const basePath = path.resolve(path.dirname(parentPath), specifier);
    const url = resolveWithExtensions(basePath);
    if (url) {
      return { url, shortCircuit: true };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (
    url.startsWith("file:") &&
    !url.endsWith(".d.ts") &&
    (url.endsWith(".ts") || url.endsWith(".tsx") || url.endsWith(".mts"))
  ) {
    const filePath = fileURLToPath(url);
    const sourceText = fs.readFileSync(filePath, "utf8");
    const transpiled = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        esModuleInterop: true,
        resolveJsonModule: true,
        allowJs: true,
        isolatedModules: true,
        sourceMap: false,
        inlineSourceMap: false,
      },
      fileName: filePath,
    });

    return {
      format: "module",
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
