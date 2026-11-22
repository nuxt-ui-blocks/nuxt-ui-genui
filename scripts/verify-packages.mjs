#!/usr/bin/env node
// Tarball auditor — Task 5 ("Release validation scripts and CI").
//
// For every `packages/*` entry with a valid `name`/`version`:
//   - runs `npm pack --dry-run --json` with `cwd` at the package directory;
//   - asserts the tarball file list has at least one `dist/` file and a
//     `package.json`;
//   - asserts no file path starts with `src/`, `test/`, or `node_modules/`;
//   - asserts no file path or the packed `package.json` content contains
//     `.env` or the literal `THESYS_API_KEY`;
//   - asserts every `exports` target listed in the package's package.json
//     exists in the tarball file list (wildcard targets: at least one file
//     under the wildcard prefix).
//
// Prints one line per package; exits 1 on the first failure.

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const FORBIDDEN_PATH_PREFIXES = ["src/", "test/", "node_modules/"];
const FORBIDDEN_PATH_SUBSTRINGS = [".env", "THESYS_API_KEY"];

function normalizePath(p) {
  return String(p).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function packageDirs() {
  const packagesRoot = path.join(root, "packages");
  let entries;
  try {
    entries = readdirSync(packagesRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  const dirs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(packagesRoot, entry.name, "package.json");
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      continue;
    }
    if (pkg && typeof pkg.name === "string" && pkg.name && typeof pkg.version === "string" && pkg.version) {
      dirs.push({ dir: path.join(packagesRoot, entry.name), pkgPath, name: pkg.name });
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  return dirs;
}

// Run `npm pack --dry-run --json` with cwd at the package dir; return the file list.
function npmPackFiles(pkg) {
  const res = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: pkg.dir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (res.error) {
    throw new Error(`npm pack failed to start in ${pkg.dir}: ${res.error.message}`);
  }
  if (res.status !== 0) {
    throw new Error(`npm pack failed in ${pkg.dir} (exit ${res.status}): ${(res.stderr || res.stdout || "").trim().slice(-500)}`);
  }
  const parsed = JSON.parse(res.stdout);
  const files = [];
  for (const entry of Array.isArray(parsed) ? parsed : [parsed]) {
    if (typeof entry === "string") {
      files.push(normalizePath(entry));
      continue;
    }
    if (entry && Array.isArray(entry)) {
      for (const f of entry) files.push(normalizePath(f));
      continue;
    }
    if (entry && Array.isArray(entry.files)) {
      for (const f of entry.files) {
        if (typeof f === "string") files.push(normalizePath(f));
        else if (f && typeof f.path === "string") files.push(normalizePath(f.path));
      }
    }
  }
  return files;
}

function collectExportTargets(exports) {
  const targets = new Set();
  const walk = (node) => {
    if (typeof node === "string") {
      targets.add(node);
    } else if (node && typeof node === "object") {
      for (const value of Object.values(node)) walk(value);
    }
  };
  walk(exports);
  return [...targets];
}

function checkPackage(pkg) {
  const files = npmPackFiles(pkg);
  const problems = [];

  if (!files.some(f => f.startsWith("dist/"))) {
    problems.push("no dist/ file in the tarball file list");
  }
  if (!files.includes("package.json")) {
    problems.push("no package.json in the tarball file list");
  }

  for (const file of files) {
    if (FORBIDDEN_PATH_PREFIXES.some(prefix => file.startsWith(prefix))) {
      problems.push(`forbidden path prefix: ${file}`);
    }
    for (const needle of FORBIDDEN_PATH_SUBSTRINGS) {
      if (file.includes(needle)) {
        problems.push(`forbidden string in file path: ${file} (contains ${needle})`);
      }
    }
  }

  const pkgJsonContent = readFileSync(pkg.pkgPath, "utf8");
  for (const needle of FORBIDDEN_PATH_SUBSTRINGS) {
    if (pkgJsonContent.includes(needle)) {
      problems.push(`forbidden string in package.json content: ${needle}`);
    }
  }

  let pkgJson;
  try {
    pkgJson = JSON.parse(pkgJsonContent);
  } catch {
    problems.push("package.json is not valid JSON");
    pkgJson = {};
  }
  for (const target of collectExportTargets(pkgJson.exports)) {
    const t = normalizePath(target);
    const star = t.indexOf("*");
    if (star === 0) continue;
    const literal = star === -1 ? t : t.slice(0, star);
    const ok = star === -1 ? files.includes(t) : files.some(f => f.startsWith(literal));
    if (!ok) {
      problems.push(`exports target not in tarball file list: ${t}`);
    }
  }
  return problems;
}

function main() {
  const dirs = packageDirs();
  if (!dirs.length) {
    console.error("[verify-packages] FAIL: no packages/* with valid name/version found");
    process.exit(1);
  }
  let failed = false;
  for (const pkg of dirs) {
    try {
      const problems = checkPackage(pkg);
      if (problems.length > 0) {
        for (const problem of problems) {
          console.error(`[verify-packages] FAIL ${pkg.name}: ${problem}`);
        }
        failed = true;
        break;
      }
      console.log(`[verify-packages] ok ${pkg.name}`);
    } catch (error) {
      console.error(`[verify-packages] FAIL ${pkg.name}: ${error.message}`);
      failed = true;
      break;
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
