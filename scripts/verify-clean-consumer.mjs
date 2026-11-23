#!/usr/bin/env node
// Clean-consumer check — Task 5 ("Release validation scripts and CI").
//
// 1. Runs `pnpm pack --json --pack-destination .release/tarballs` in each of
//    the seven `packages/*` dirs. `pnpm pack` (unlike `npm pack`) rewrites the
//    pnpm-only `workspace:*` sibling specs to a concrete version in the
//    published package.json; plain npm cannot install a `workspace:` tarball.
// 2. Writes `.release/consumer/package.json` with `file:` dependencies and
//    `overrides` for all seven tarballs (the overrides force sibling deps to
//    resolve to the local tarballs), plus peers: nuxt@^4.1.0, @nuxt/ui@^4.12.0,
//    vue@^3.5.0, @openuidev/vue-lang@^0.4.2, zod@^4.0.0.
// 3. Runs `npm install --no-audit --no-fund --ignore-scripts` in
//    `.release/consumer` — requires registry network access (documented here).
// 4. Writes and runs `.release/consumer/check.mjs`: `import.meta.resolve` for
//    every declared entry, then imports the server-safe packages and asserts
//    the named exports:
//      - @nuxt-ui-genui/core  -> createGenUILibrary, generateGenUISystemPrompt
//      - @nuxt-ui-genui/chat  -> createGenUIChat
//      - @nuxt-ui-genui/ai-sdk -> streamGenUIText
//      - @nuxt-ui-genui/server (server-safe; loads without named assertions)
//    The `/sfc` and `/nuxt` entries are resolved but never imported at
//    runtime.
//
// Exits non-zero on any failure.

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const tarballsDir = path.join(root, ".release", "tarballs");
const consumerDir = path.join(root, ".release", "consumer");

function packPackage(pkgDir) {
  // pnpm rewrites `workspace:*` dependencies to a concrete version when
  // packing, which is what a publisher would ship. npm pack leaves the
  // pnpm-only protocol in place and a plain npm consumer rejects it.
  const res = spawnSync("pnpm", ["pack", "--json", "--pack-destination", tarballsDir], {
    cwd: pkgDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (res.error) {
    throw new Error(`pnpm pack failed to start in ${pkgDir}: ${res.error.message}`);
  }
  if (res.status !== 0) {
    throw new Error(`pnpm pack failed in ${pkgDir} (exit ${res.status}): ${(res.stderr || res.stdout || "").trim().slice(-500)}`);
  }
  const parsed = JSON.parse(res.stdout);
  const filename = parsed && parsed.filename;
  if (!filename) {
    throw new Error(`pnpm pack produced no filename in ${pkgDir}`);
  }
  return path.basename(String(filename));
}

function packageDirs() {
  // Same enumeration as verify-packages.mjs: packages/* with valid name/version.
  const packagesRoot = path.join(root, "packages");
  const dirs = [];
  for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(packagesRoot, entry.name, "package.json");
    let pkg;
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch {
      continue;
    }
    if (pkg && typeof pkg.name === "string" && pkg.name && typeof pkg.version === "string" && pkg.version) {
      dirs.push({ dir: path.join(packagesRoot, entry.name), name: pkg.name });
    }
  }
  dirs.sort((a, b) => a.name.localeCompare(b.name));
  return dirs;
}

const ENTRIES = [
  "@nuxt-ui-genui/core",
  "@nuxt-ui-genui/chat",
  "@nuxt-ui-genui/server",
  "@nuxt-ui-genui/ai-sdk",
  "@nuxt-ui-genui/ai-sdk/chat",
  "@nuxt-ui-genui/components",
  "@nuxt-ui-genui/components/sfc",
  "@nuxt-ui-genui/components/markdown",
  "@nuxt-ui-genui/components/upload",
  "@nuxt-ui-genui/components/form-context",
  "@nuxt-ui-genui/chat-ui",
  "@nuxt-ui-genui/nuxt",
  "@nuxt-ui-genui/nuxt/vue-plugin",
];

// Server-safe packages: imported at runtime; `names` are the named exports asserted.
// The `/sfc` and `/nuxt` entries are intentionally not imported (only resolved).
const NAMED_EXPORTS = [
  ["@nuxt-ui-genui/core", ["createGenUILibrary", "generateGenUISystemPrompt"]],
  ["@nuxt-ui-genui/chat", ["createGenUIChat"]],
  ["@nuxt-ui-genui/ai-sdk", ["streamGenUIText"]],
  ["@nuxt-ui-genui/server", []],
];

const CHECK_SRC = `const entries = ${JSON.stringify(ENTRIES)};
const namedExports = ${JSON.stringify(NAMED_EXPORTS)};

const resolved = new Map();
for (const entry of entries) {
  const url = import.meta.resolve(entry);
  resolved.set(entry, url);
  console.log("[verify-consumer] resolved " + entry + " -> " + url);
}
for (const [pkgName, names] of namedExports) {
  const mod = await import(resolved.get(pkgName));
  for (const name of names) {
    if (typeof mod[name] !== "function") {
      throw new Error(pkgName + " does not export " + name + " as a function");
    }
  }
  console.log("[verify-consumer] ok " + pkgName + (names.length ? " exports " + names.join(", ") : " (server-safe, loads)"));
}
console.log("[verify-consumer] all declared entries resolved");
`;

function fail(message, extra) {
  console.error(`[verify-consumer] FAIL: ${message}`);
  if (extra) console.error(extra);
  process.exit(1);
}

function main() {
  const dirs = packageDirs();
  if (!dirs.length) {
    fail("no packages/* with valid name/version found");
  }

  mkdirSync(tarballsDir, { recursive: true });
  const dependencies = {};
  const overrides = {};
  for (const pkg of dirs) {
    const filename = packPackage(pkg.dir);
    const dest = path.join(tarballsDir, filename);
    if (!existsSync(dest)) {
      fail(`pnpm pack wrote no tarball at ${dest}`);
    }
    const spec = `file:../tarballs/${filename}`;
    dependencies[pkg.name] = spec;
    // Sibling tarballs declare concrete versions (e.g. "0.1.0" for their
    // former `workspace:*` deps); force those to the local tarballs too.
    overrides[pkg.name] = spec;
    console.log(`[verify-consumer] packed ${pkg.name} -> .release/tarballs/${filename}`);
  }

  mkdirSync(consumerDir, { recursive: true });
  const consumerPkg = {
    name: "nuxt-genui-release-consumer-check",
    private: true,
    type: "module",
    dependencies,
    overrides,
    peerDependencies: {
      nuxt: "^4.1.0",
      "@nuxt/ui": "^4.12.0",
      vue: "^3.5.0",
      "@openuidev/vue-lang": "^0.4.2",
      zod: "^4.0.0",
    },
  };
  writeFileSync(path.join(consumerDir, "package.json"), JSON.stringify(consumerPkg, null, 2) + "\n");

  console.log("[verify-consumer] note: npm install requires registry network access");
  const install = spawnSync("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"], {
    cwd: consumerDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  if (install.error) {
    fail(`npm install failed to start: ${install.error.message}`);
  }
  if (install.status !== 0) {
    fail(`npm install exited with status ${install.status} in ${consumerDir}`, [
      `stdout: ${(install.stdout || "").trim().slice(-1500)}`,
      `stderr: ${(install.stderr || "").trim().slice(-1500)}`,
    ]);
  }
  console.log("[verify-consumer] npm install ok");

  writeFileSync(path.join(consumerDir, "check.mjs"), CHECK_SRC);
  const run = spawnSync(process.execPath, ["check.mjs"], { cwd: consumerDir, encoding: "utf8" });
  if (run.status !== 0) {
    fail("consumer check failed", [
      `stdout: ${(run.stdout || "").trim().slice(-1500)}`,
      `stderr: ${(run.stderr || "").trim().slice(-1500)}`,
    ]);
  }
  console.log("[verify-consumer] ok: all declared entries resolved; named exports asserted");
}

main();
