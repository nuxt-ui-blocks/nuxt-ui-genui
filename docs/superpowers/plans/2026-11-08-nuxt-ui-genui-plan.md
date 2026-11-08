# Nuxt UI GenUI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `nuxt-ui-genui-mvp` scaffold into a proper pnpm workspace with a framework-independent core, a playground app, tests, CI, and a boundary-validated OpenAI transport — exactly the Phase 0/1 scope of the approved spec.

**Architecture:** Conservative move (Approach 1). Phase 0 = copy the scaffold into a new standalone repo with git + MIT + CI (frozen install + typecheck only). Phase 1a = relocate the demo into `apps/playground`, extract framework-independent `packages/core`, add Vitest + boundary tests. Phase 1b = wire OpenAI behind a playground-only adapter with boundary validation (no Lang 1.0, no auto-repair, no streaming).

**Tech Stack:** Nuxt 4, Nuxt UI 4, Vue 3.5+, TypeScript strict, Zod 4 (`zod/v4`), `@openuidev/vue-lang` 0.4.x, Vercel AI SDK (`ai` + `@ai-sdk/openai`), Vitest, Vue Test Utils, pnpm 9+ workspaces.

**Spec:** `docs/superpowers/specs/2026-11-08-nuxt-ui-genui-design.md` (travels with this plan — executors must read both)

## Global Constraints

- Repo: `E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui` (GitHub `nuxt-ui-blocks/nuxt-ui-genui`); MIT license; default branch `main`.
- pnpm only (9+); Node.js 20.19+; lockfile committed; CI = `pnpm install --frozen-lockfile` + `pnpm typecheck` (+`pnpm test` after Phase 1a).
- Workspace packages = `apps/*` + `packages/*` only; actual packages = `apps/playground` + `packages/core` only. No empty future packages.
- `packages/core` (`nuxt-ui-genui-core`) = framework-independent contracts: types, Zod schemas, component specs, adapter interface. **Zero imports** from Nuxt/Vue/Nuxt UI/`@openuidev/vue-lang`.
- `apps/playground` (`nuxt-ui-genui-playground`) = Nuxt 4 app: demo, SalesDashboard slice, client-only `genuiLibrary`, Phase 1b OpenAI adapter.
- Server/shared code must never import Vue SFCs, `library.ts`, or `#components`. Enforced by `tests/import-boundary.test.ts`.
- OpenUI Lang wire format = positional args in **Zod property order** (`title, description, metrics, orders`). Changing order breaks the demo. Key-order test required.
- `@openuidev/vue-lang` stays at **0.4.x** — no Lang 1.0 parity; `@openuidev/lang-core` is **not** a Phase 1 dependency.
- Never evaluate model-generated JavaScript/Vue; strict component allowlist; UI actions are requests, privileged ops server-authorized.
- No streaming, no repair/retry, no stub `packages/ai-sdk` in this plan. `/api/genui/demo` = offline deterministic mode; `/api/genui/chat` = model-backed.
- `OPENAI_API_KEY` + `OPENAI_MODEL` required, no package default.
- Raw ChatGPT transcript must NOT enter the new repo (it is moved to Desktop in Task 1).
- Honest reporting: never claim tests pass that have not been run; `node_modules` starts empty.
- Old `E:\projects\javascript\nuxt-ui-genui` is a backup — do not modify it in this plan.

---

## Phase 0 — Standalone repo, git, workspace, CI

### Task 1: Create the new repo from the scaffold (baseline import commit)

**Files:**
- Create: `E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui\` (new root)
- Create: `docs/superpowers/plans/2026-11-08-nuxt-ui-genui-plan.md` (this plan, copied in)
- Modify: old repo — move raw transcript to Desktop (not copied)

**Interfaces:**
- Consumes: scaffold at `E:\projects\javascript\nuxt-ui-genui` (package.json, nuxt.config.ts, app/, server/, shared/, .env.example, .gitignore, README.md, AGENTS.md, docs/architecture.md, docs/superpowers/specs/2026-11-08-nuxt-ui-genui-design.md, opencode.json, .agents/skills/openui/, skills-lock.json).
- Produces: a git repo on `main` with one baseline commit; new repo created but NOT yet modified.

- [ ] **Step 1: Verify the target does not exist**

```powershell
Test-Path 'E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui'
```

Expected: `False`. If `True`, STOP and report — do not overwrite anything.

- [ ] **Step 2: Create the parent and copy only the needed files**

```powershell
$old = 'E:\projects\javascript\nuxt-ui-genui'
$new = 'E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui'
New-Item -ItemType Directory -Force (Split-Path $new) | Out-Null
New-Item -ItemType Directory -Force $new | Out-Null
$items = @('package.json','nuxt.config.ts','app','server','shared','.env.example','.gitignore','README.md','AGENTS.md','docs','opencode.json','.agents','skills-lock.json')
foreach ($i in $items) { Copy-Item -Path (Join-Path $old $i) -Destination (Join-Path $new $i) -Recurse -Force }
# Remove the raw transcript from the copy if it hitched in under docs/
Remove-Item -Force "$new\docs\ChatGPT_Nuxt-Generative-UI-Architecture_20261108-0551.md" -ErrorAction SilentlyContinue
```

- [ ] **Step 2b: OpenUI skill and Context7 MCP travel with the repo**

`.agents/skills/openui/` (project-local OpenUI agent skill, installed via `npx skills add thesysdev/skills --skill openui -y --copy`), `skills-lock.json`, and `opencode.json` (project-local `mcp.servers.context7` → `https://mcp.context7.com/mcp`) are part of the copy in Step 2 and must be committed in the baseline so future OpenCode sessions in the new repo inherit them. Do NOT exclude them in `.gitignore`.



- [ ] **Step 3: Copy this plan into the new repo**

The plan file is created by the writing-plans step (this file). It must travel with the new repo:

```powershell
New-Item -ItemType Directory -Force "$new\docs\superpowers\plans" | Out-Null
Copy-Item "$old\docs\superpowers\plans\2026-11-08-nuxt-ui-genui-plan.md" "$new\docs\superpowers\plans\"
```

- [ ] **Step 4: Move the raw transcript to the Desktop**

```powershell
Move-Item "$old\docs\ChatGPT_Nuxt-Generative-UI-Architecture_20261108-0551.md" "$env:USERPROFILE\Desktop\"
```

Expected: the file no longer exists at the old repo path. It must NOT be committed anywhere.

- [ ] **Step 5: git init and baseline import commit**

```powershell
Set-Location $new
git init -b main
git add -A
git commit -m "chore: import existing MVP scaffold as baseline"
```

Expected: one commit on `main`; `git log --oneline` shows it; `git status` is clean.

- [ ] **Step 6: Verify old repo is intact**

```powershell
Test-Path "$old\docs\ChatGPT_Nuxt-Generative-UI-Architecture_20261108-0551.md"   # False
Test-Path "$old\package.json"                                                     # True
```

### Task 2: Workspace root files, LICENSE, CI, env

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `LICENSE`
- Create: `.github/workflows/ci.yml`
- Modify: `.env.example`, `package.json`

- [ ] **Step 1: pnpm-workspace.yaml**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 2: Root package.json — workspace identity only (Task 3 keeps it app-facing; Task 4 converts fully)**

Rename `name` to `nuxt-ui-genui`, add:

```json
{
  "name": "nuxt-ui-genui",
  "private": true,
  "type": "module",
  "description": "GenUI for Nuxt UI — a Nuxt UI component library for OpenUI (experimental)",
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/nuxt-ui-blocks/nuxt-ui-genui.git" }
}
```

Keep `scripts`/`dependencies` for now — they move to the workspace-only root in Task 4. The root `test` script (`pnpm -r test`) is added in Task 4; the CI `test` step is added in Task 10.

- [ ] **Step 3: LICENSE (MIT)**

```text
MIT License

Copyright (c) 2026 nuxt-ui-blocks

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 4: `.github/workflows/ci.yml`** (minimal — frozen install + typecheck only; `test` added in Task 10)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20.19
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
```

- [ ] **Step 5: `.env.example` gains the OPENAI_MODEL contract**

Replace the file with:

```dotenv
# OpenAI / Vercel AI SDK (Phase 1b). Required — there is no default model.
# Copy this file to .env and fill in real values. .env is gitignored.
OPENAI_API_KEY=
OPENAI_MODEL=
```

- [ ] **Step 6: Verify and commit**

```powershell
git add -A
git commit -m "chore: add workspace, license, CI, and env template"
```

### Task 3: Lockfile + typecheck gate

**Files:**
- Create: `pnpm-lock.yaml` (generated)

- [ ] **Step 1: Install**

```powershell
pnpm install
```

Expected: succeeds; `postinstall` runs `nuxt prepare`; `pnpm-lock.yaml` created.

- [ ] **Step 2: Typecheck**

```powershell
pnpm typecheck
```

Expected: passes. This scaffold has never been typechecked — if it fails, fix honestly or STOP and report the exact errors. Do not weaken `strict`, do not delete failing code silently.

- [ ] **Step 3: Commit the lockfile**

```powershell
git add pnpm-lock.yaml
git commit -m "chore: commit lockfile and verify typecheck"
```

## Phase 1a — Playground + core extraction + tests

### Task 4: Move the app into `apps/playground` as a pnpm workspace

**Files:**
- Move: `app/`, `server/`, `shared/`, `nuxt.config.ts` → `apps/playground/`
- Modify: root `package.json`, new `apps/playground/package.json`

**Interfaces:**
- Consumes: the Task 3 repo.
- Produces: workspace layout; root `package.json` becomes workspace-only with filter scripts (`dev`/`build`/`typecheck` → playground; `test` → `pnpm -r test`).

- [ ] **Step 1: git mv the app into the playground**

```powershell
New-Item -ItemType Directory -Force apps/playground
git mv nuxt.config.ts apps/playground/nuxt.config.ts
git mv app apps/playground/app
git mv server apps/playground/server
git mv shared apps/playground/shared
```

- [ ] **Step 2: Create `apps/playground/package.json`**

```json
{
  "name": "nuxt-ui-genui-playground",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "typecheck": "nuxt typecheck",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/ui": "^4.12.0",
    "@openuidev/vue-lang": "^0.4.1",
    "nuxt": "^4.2.0",
    "zod": "^4.1.0",
    "nuxt-ui-genui-core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vue-tsc": "^3.0.0"
  }
}
```

- [ ] **Step 3: Rewrite root `package.json` to workspace-only**

```json
{
  "name": "nuxt-ui-genui",
  "private": true,
  "type": "module",
  "description": "GenUI for Nuxt UI — a Nuxt UI component library for OpenUI (experimental)",
  "license": "MIT",
  "repository": { "type": "git", "url": "https://github.com/nuxt-ui-blocks/nuxt-ui-genui.git" },
  "scripts": {
    "dev": "pnpm --filter nuxt-ui-genui-playground dev",
    "build": "pnpm --filter nuxt-ui-genui-playground build",
    "typecheck": "pnpm --filter nuxt-ui-genui-playground typecheck",
    "test": "pnpm -r test"
  }
}
```

Note: **remove the root `postinstall: nuxt prepare`** — it was for the monolith; pnpm runs workspace sibling `postinstall` scripts during install, so the playground's own `nuxt prepare` handles this.

- [ ] **Step 4: Install and typecheck**

```powershell
pnpm install
pnpm typecheck
```

Expected: passes (Nuxt modules resolve inside `apps/playground`; root has no `.nuxt` of its own).

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "refactor: move app to apps/playground as a pnpm workspace"
```

### Task 5: Extract `packages/core` framework-independent contracts

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/src/schemas.ts` (moved verbatim)
- Create: `packages/core/src/types.ts`
- Create: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `apps/playground/shared/genui/schemas.ts`.
- Produces: `nuxt-ui-genui-core` — importable as `nuxt-ui-genui-core` (exports `./src/index.ts`).

- [ ] **Step 1: Create the core package**

`packages/core/package.json`:

```json
{
  "name": "nuxt-ui-genui-core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "files": ["src"],
  "dependencies": { "zod": "^4.1.0" },
  "devDependencies": { "typescript": "^5.9.0" }
}
```

- [ ] **Step 2: Move the schemas verbatim**

```powershell
New-Item -ItemType Directory -Force packages/core/src
git mv apps/playground/shared/genui/schemas.ts packages/core/src/schemas.ts
```

- [ ] **Step 3: Add `types.ts`**

```ts
export interface GenUIAdapterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}
export interface GenUIAdapterInput {
  messages: GenUIAdapterMessage[]
}
export interface GenUIAdapterResult {
  ui: string
  meta?: Record<string, unknown>
}
export interface GenUIModelAdapter {
  generate(input: GenUIAdapterInput): Promise<GenUIAdapterResult>
}
```

- [ ] **Step 4: Add `index.ts`**

```ts
export * from './schemas'
export * from './types'
```

- [ ] **Step 5: Verify core has no banned imports**

```powershell
Select-String -Path packages/core/src/*.ts -Pattern "@nuxt|vue|#components|library"
```

Expected: no matches.

- [ ] **Step 6: Commit**

```powershell
git add packages/core
git commit -m "feat(core): extract framework-independent schemas and adapter types"
```

### Task 6: Retarget playground imports to `nuxt-ui-genui-core`

**Files:**
- Modify: `apps/playground/shared/genui/library.ts`
- Modify: `apps/playground/server/api/genui/demo.post.ts`
- Modify: `apps/playground/app/components/genui/SalesDashboard.vue`
- Modify: `apps/playground/nuxt.config.ts`
- Modify: `apps/playground/package.json`

- [ ] **Step 1: Update `apps/playground/shared/genui/library.ts`**

```ts
import { SalesDashboardSchema } from 'nuxt-ui-genui-core'
```

(Replace the `./schemas` import; keep everything else identical.)

- [ ] **Step 2: Update `apps/playground/server/api/genui/demo.post.ts`**

```ts
import { SalesDashboardSchema } from 'nuxt-ui-genui-core'
```

- [ ] **Step 3: Update `apps/playground/app/components/genui/SalesDashboard.vue`**

```ts
import type { SalesDashboardProps } from 'nuxt-ui-genui-core'
```

- [ ] **Step 4: `apps/playground/nuxt.config.ts` — transpile the TS core package**

```ts
export default defineNuxtConfig({
  // …existing contents…
  build: {
    transpile: ['nuxt-ui-genui-core']
  }
})
```

Add `nuxt-ui-genui-core: workspace:*` to `apps/playground/package.json` dependencies (already added in Task 4).

- [ ] **Step 5: Verify no stale references**

```powershell
grep -r "#shared/genui/schemas\|shared/genui/schemas" apps/playground
```

Expected: no output.

- [ ] **Step 6: Install, typecheck, commit**

```powershell
pnpm install
pnpm typecheck
git add -A
git commit -m "refactor(playground): import GenUI contracts from nuxt-ui-genui-core"
```

### Task 7: Core tests (TDD) — wire format + key order

**Files:**
- Modify: `packages/core/package.json` (add vitest)
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/tests/schemas.test.ts`

- [ ] **Step 1: Add vitest to core and a `test` script**

```powershell
cd packages/core
pnpm add -D vitest
```

Core package.json scripts: `"test": "vitest run"`

- [ ] **Step 2: Create `packages/core/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
})
```

- [ ] **Step 3: Write `packages/core/tests/schemas.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { SalesDashboardSchema } from '../src/schemas'

const valid = {
  title: 'Revenue overview',
  description: 'Monthly snapshot',
  metrics: [{ label: 'Revenue', value: '$24,500', change: '+12.5%', trend: 'up' }],
  orders: [{ id: '#1024', customer: 'Ada Lovelace', total: '$240.00', status: 'Completed' }]
}

describe('SalesDashboardSchema', () => {
  it('round-trips a valid dashboard', () => {
    const parsed = SalesDashboardSchema.parse(valid)
    expect(parsed.title).toBe(valid.title)
    expect(parsed.metrics[0]?.trend).toBe('up')
    expect(parsed.orders[0]?.status).toBe('Completed')
  })

  it('keeps the wire-format property order (OpenUI Lang positional args)', () => {
    expect(Object.keys(SalesDashboardSchema.shape)).toEqual([
      'title',
      'description',
      'metrics',
      'orders'
    ])
  })

  it('rejects an unknown trend enum', () => {
    const bad = structuredClone(valid) as typeof valid
    bad.metrics[0]!.trend = 'sideways' as never
    expect(() => SalesDashboardSchema.parse(bad)).toThrow()
  })
})
```

- [ ] **Step 4: Run the tests**

```powershell
cd packages/core
pnpm test
```

Expected: PASS (3 tests). If the key-order test fails, STOP — someone reordered the schema; that breaks the OpenUI Lang wire format.

- [ ] **Step 5: Commit**

```powershell
git add packages/core
git commit -m "test(core): schema round-trip and positional-arg key-order tests"
```

### Task 8: Server/client import-boundary test (playground)

**Files:**
- Create: `apps/playground/tests/import-boundary.test.ts`

**Interfaces:**
- Consumes: the layout from Tasks 4–6.
- Produces: a hard check that `packages/core/src/**` and `apps/playground/server/**` contain no Vue SFC imports, no `library.ts`, no `#components`, no `@nuxt/ui`, no `@openuidev/vue-lang`.

- [ ] **Step 1: Write the test**

Create `apps/playground/tests/import-boundary.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const roots = [
  path.resolve(process.cwd(), '../../packages/core/src'),
  path.resolve(process.cwd(), 'server')
]

const banned: Array<[RegExp, string]> = [
  [/\.vue['"]/, '.vue import'],
  [/library\.ts|#shared\/genui\/library/, 'client-only library import'],
  [/#components/, '#components import'],
  [/@nuxt\/ui/, 'Nuxt UI import'],
  [/@openuidev\/vue-lang/, 'OpenUI client renderer import']
]

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  )
}

describe('server/client import boundary', () => {
  it('core and server never import client-only surfaces', () => {
    const violations: string[] = []
    for (const root of roots) {
      for (const file of walk(root)) {
        if (!/\.(ts|vue|mjs|js)$/.test(file)) continue
        const source = readFileSync(file, 'utf8')
        for (const [pattern, label] of banned) {
          if (pattern.test(source)) violations.push(`${file}: ${label}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
```

- [ ] **Step 2: Run it**

```powershell
cd apps/playground
pnpm vitest run tests/import-boundary.test.ts
```

Expected: PASS. If it fails, the banned import is real — remove it, do not relax the test.

- [ ] **Step 3: Commit**

```powershell
git add apps/playground/tests/import-boundary.test.ts
git commit -m "test(playground): enforce server/client import boundary"
```

### Task 9: Playground component smoke test (Vue Test Utils)

**Files:**
- Modify: `apps/playground/package.json`
- Create: `apps/playground/vitest.config.ts`
- Create: `apps/playground/tests/SalesDashboard.test.ts`

- [ ] **Step 1: Add devDeps and a `test` script**

```powershell
cd apps/playground
pnpm add -D vitest @vue/test-utils @vitejs/plugin-vue happy-dom
```

`apps/playground/package.json` scripts add: `"test": "vitest run"`

- [ ] **Step 2: Create `apps/playground/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts']
  }
})
```

- [ ] **Step 3: Write `apps/playground/tests/SalesDashboard.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SalesDashboard from '../app/components/genui/SalesDashboard.vue'

const props = {
  title: 'Revenue overview',
  description: 'Monthly snapshot',
  metrics: [
    { label: 'Revenue', value: '$24,500', change: '+12.5%', trend: 'up' },
    { label: 'Orders', value: '1,240', change: '+4.1%', trend: 'up' },
    { label: 'Avg. order', value: '$58', change: '-2.0%', trend: 'down' },
    { label: 'Refunds', value: '12', change: '0%', trend: 'neutral' }
  ],
  orders: [
    { id: '#1024', customer: 'Ada Lovelace', total: '$240.00', status: 'Completed' },
    { id: '#1023', customer: 'Grace Hopper', total: '$132.50', status: 'Pending' },
    { id: '#1022', customer: 'Alan Turing', total: '$98.00', status: 'Cancelled' },
    { id: '#1021', customer: 'Edsger Dijkstra', total: '$410.25', status: 'Completed' }
  ]
} as const

const stubs = {
  UCard: { props: ['ui'], template: '<div><slot /></div>' },
  UBadge: { props: ['color', 'variant'], template: '<span><slot /></span>' }
}

describe('SalesDashboard', () => {
  it('renders the title and all orders', () => {
    const wrapper = mount(SalesDashboard, {
      props: { props, renderNode: () => null as never },
      global: { stubs }
    })
    expect(wrapper.text()).toContain('Revenue overview')
    expect(wrapper.text()).toContain('Ada Lovelace')
    expect(wrapper.findAll('tbody tr').length).toBe(4)
  })
})
```

- [ ] **Step 4: Run it**

```powershell
cd apps/playground
pnpm vitest run tests/SalesDashboard.test.ts
```

Expected: PASS. Fall back to `shallowMount` only if `mount` fails on Nuxt UI internals — do not stub the component under test.

- [ ] **Step 5: Commit**

```powershell
git add apps/playground/package.json apps/playground/vitest.config.ts apps/playground/tests/SalesDashboard.test.ts pnpm-lock.yaml
git commit -m "test(playground): add SalesDashboard component smoke test"
```

### Task 10: Root `pnpm test`, CI test step, AGENTS.md, clean-reinstall verification

**Files:**
- Modify: `.github/workflows/ci.yml`, `AGENTS.md`

- [ ] **Step 1: CI gains the test step**

`.github/workflows/ci.yml`:

```yaml
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm test
```

- [ ] **Step 2: Verify root `test` script**

```powershell
pnpm test
```

Expected: runs core + playground vitest suites; all PASS.

- [ ] **Step 3: Rewrite `AGENTS.md` (monorepo)**

```markdown
# AGENTS.md

Nuxt UI GenUI — experimental Nuxt UI component library for OpenUI. pnpm monorepo. Not production-ready.

## Commands

- `pnpm install` — install; playground `postinstall` runs `nuxt prepare`.
- `pnpm dev` — Nuxt dev server (`apps/playground`).
- `pnpm build` — production build (playground).
- `pnpm typecheck` — `nuxt typecheck` in the playground (strict TS).
- `pnpm test` — `pnpm -r test` (core + playground vitest).
- Single suite: `cd apps/playground; pnpm vitest run tests/import-boundary.test.ts` (same pattern for other files; core: `cd packages/core; pnpm vitest run tests/schemas.test.ts`).
- Node 20.19+, pnpm 9+. Package versions float on `^` ranges (lockfile committed).

## Layout

- `apps/playground/` — Nuxt 4 app: demo route, components, client-only `genuiLibrary`, Phase 1b OpenAI adapter. Owns `nuxt.config.ts`.
- `packages/core/` — framework-independent contracts (`nuxt-ui-genui-core`): Zod schemas, types, component specs. **zod-only**; never imports Nuxt/Vue/Nuxt UI/`@openuidev/vue-lang`.

## Critical boundaries (do not break)

- Wire format = positional OpenUI Lang args in **Zod property order** (`title, description, metrics, orders`). Enforced by `packages/core/tests/schemas.test.ts` key-order test.
- Server/shared code must never import Vue SFCs, `#shared/genui/library`, `#components`, `@nuxt/ui`, or `@openuidev/vue-lang`. Enforced by `apps/playground/tests/import-boundary.test.ts`.
- Client-only: `apps/playground/shared/genui/library.ts` (creates `genuiLibrary` via `createLibrary`/`defineComponent`) and all `.vue` SFCs.
- `schemas.ts`/`specs.ts` in core are serializable and safe for server + client.

## OpenUI

- `@openuidev/vue-lang` is 0.4.x; **no Lang 1.0 parity**. Do not install `@openuidev/lang-core` ≥1.x (React-only Lang 1.0). Phase 1 uses no lang-core at all.
- Strict allowlist; never evaluate model-generated JS/Vue. UI actions are requests; privileged ops must be server-authorized.
- `/api/genui/demo` = deterministic offline mode; `/api/genui/chat` (Phase 1b) = model-backed transport, 400/500/502/422 error model.

## Repo status

- Publishing deferred (no npm publish workflow). Packages are `private`.
- No lint config yet. CI = frozen install + typecheck + test.
```

- [ ] **Step 4: Clean-reinstall verification**

```powershell
Remove-Item -Recurse -Force node_modules, apps/playground/node_modules, packages/core/node_modules -ErrorAction SilentlyContinue
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
```

Expected: all pass. Fix failures honestly; do not skip this gate.

- [ ] **Step 5: Commit**

```powershell
git add .github/workflows/ci.yml AGENTS.md
git commit -m "chore: add test to CI and rewrite AGENTS.md for monorepo"
```

### Task 11: Add framework-free component specs to core

**Files:**
- Create: `packages/core/src/specs.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `SalesDashboardSchema` from `packages/core/src/schemas.ts`.
- Produces: `ComponentSpec` and `componentSpecs` — the single framework-free source of prompt/registry metadata shared by the client `genuiLibrary` (Task 12) and the server adapter (Task 13).

- [ ] **Step 1: Create `packages/core/src/specs.ts`**

```ts
import type { z } from 'zod/v4'
import { SalesDashboardSchema } from './schemas'

export interface ComponentSpec {
  name: string
  description: string
  props: z.ZodTypeAny
}

export const componentSpecs: ComponentSpec[] = [
  {
    name: 'SalesDashboard',
    description: 'A compact sales dashboard with KPI metrics and a recent-orders table.',
    props: SalesDashboardSchema
  }
]
```

- [ ] **Step 2: Re-export from `packages/core/src/index.ts`**

```ts
export * from './schemas'
export * from './types'
export * from './specs'
```

- [ ] **Step 3: Verify (playground typecheck covers the new module via workspace resolution)**

```powershell
pnpm typecheck
```

- [ ] **Step 4: Commit**

```powershell
git add packages/core
git commit -m "feat(core): add framework-free component specs"
```

### Task 12: Model the client library on the core specs

**Files:**
- Modify: `apps/playground/shared/genui/library.ts`
- Modify: `apps/playground/package.json`

**Interfaces:**
- Consumes: `componentSpecs` from `nuxt-ui-genui-core` (Task 11).
- Produces: a `genuiLibrary` whose name/description/props come from core — so client and server can never drift apart on component metadata.

- [ ] **Step 1: Add AI SDK deps to `apps/playground/package.json`**

Add to `dependencies`:

```json
"ai": "^5.0.0",
"@ai-sdk/openai": "^2.0.0",
```

(Confirm exact published majors with `npm view ai version` and `npm view @ai-sdk/openai version` at execution time; match the repo's `^` convention.)

- [ ] **Step 2: Rewrite `apps/playground/shared/genui/library.ts`**

```ts
import { createLibrary, defineComponent } from '@openuidev/vue-lang'
import SalesDashboard from '~/components/genui/SalesDashboard.vue'
import { componentSpecs } from 'nuxt-ui-genui-core'
import type { SalesDashboardSchema } from 'nuxt-ui-genui-core'

const spec = componentSpecs[0]!

const SalesDashboardComponent = defineComponent({
  name: spec.name,
  description: spec.description,
  props: spec.props as typeof SalesDashboardSchema,
  component: SalesDashboard
})

export const genuiLibrary = createLibrary({
  components: [SalesDashboardComponent],
  root: 'SalesDashboard'
})
```

Note: `componentSpecs[].props` is typed `z.ZodTypeAny`; `defineComponent` expects the concrete object schema, so the `as` cast is required. Do not widen the core type — the cast keeps the client honest without coupling core to vue-lang. If `defineComponent` accepts `z.ZodTypeAny` directly at execution time, drop the cast.

- [ ] **Step 3: Reinstall and typecheck**

```powershell
pnpm install
pnpm typecheck
```

Expected: passes; lockfile updated with `ai` + `@ai-sdk/openai`.

- [ ] **Step 4: Commit**

```powershell
git add apps/playground/package.json apps/playground/shared/genui/library.ts pnpm-lock.yaml
git commit -m "feat(playground): build genuiLibrary from core component specs"
```

### Task 13: Server adapter with boundary validation (TDD)

**Files:**
- Create: `apps/playground/server/utils/genuiAdapter.ts`
- Create: `apps/playground/tests/genuiAdapter.test.ts`

**Interfaces:**
- Consumes: `SalesDashboardSchema`, `componentSpecs`, `GenUIAdapterInput`, `GenUIAdapterMessage` from `nuxt-ui-genui-core`.
- Produces: `ChatRequestSchema`, `AdapterConfigError`, `buildSystemPrompt`, `extractUi`, `splitPositionalArgs`, `validateUi`, `generateUi` — consumed by the chat route (Task 14).

Design (locked):

- **Hand-built system prompt** from core specs. No `@openuidev/lang-core` dependency. (lang-core, if ever used, must stay `^0.4` — 1.x is React-only Lang 1.0 — but this plan does not use it at all.)
- **Boundary**: strip one optional code fence → split top-level positional args with a bracket/string-aware scanner → `JSON.parse` each arg → assemble `{ title, description, metrics, orders }` in Zod property order → `SalesDashboardSchema.safeParse`.
- **Failure**: return `{ ok: false, issues }` — the route maps this to **422** (`{ error, issues }`).
- **Injectable model** (`GenUiModel`) so unit tests never hit the network.
- **No repair, no retry, no streaming.**
- Throws `AdapterConfigError` when `OPENAI_API_KEY` or `OPENAI_MODEL` is missing (no package default model). The route maps this to **500**.

- [ ] **Step 1: Write the failing tests**

Create `apps/playground/tests/genuiAdapter.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import {
  AdapterConfigError,
  ChatRequestSchema,
  generateUi,
  validateUi
} from '../server/utils/genuiAdapter'

const VALID_UI = 'root = SalesDashboard("Revenue overview", "Monthly snapshot", [{"label":"Revenue","value":"$24,500","change":"+12.5%","trend":"up"}], [{"id":"#1024","customer":"Ada Lovelace","total":"$240.00","status":"Completed"}])'

describe('validateUi', () => {
  it('accepts a valid bare Lang line', () => {
    const result = validateUi(VALID_UI)
    expect(result).toEqual({ ok: true, ui: VALID_UI })
  })

  it('accepts the same line wrapped in one code fence', () => {
    const fenced = '```lang\n' + VALID_UI + '\n```'
    const result = validateUi(fenced)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.ui).toBe(VALID_UI)
  })

  it('rejects non-Lang output with issues', () => {
    const result = validateUi('Here is your dashboard!')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.length).toBeGreaterThan(0)
  })

  it('rejects the wrong number of positional arguments', () => {
    const result = validateUi('root = SalesDashboard("Only title")')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]).toMatch(/4 positional arguments/)
  })

  it('rejects invalid schema payloads', () => {
    const bad = 'root = SalesDashboard("Title", "Desc", [{"label":"M","value":"1","trend":"sideways"}], [])'
    const result = validateUi(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.join(' ')).toMatch(/trend|Invalid/i)
  })
})

describe('ChatRequestSchema', () => {
  it('accepts a minimal valid request', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [{ role: 'user', content: 'hi' }] })
    expect(parsed.success).toBe(true)
  })

  it('rejects an empty message list', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [] })
    expect(parsed.success).toBe(false)
  })

  it('rejects unknown roles', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [{ role: 'tool', content: 'x' }] })
    expect(parsed.success).toBe(false)
  })
})

describe('generateUi', () => {
  it('throws AdapterConfigError when env is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    vi.stubEnv('OPENAI_MODEL', '')
    await expect(
      generateUi({ messages: [{ role: 'user', content: 'dash' }] })
    ).rejects.toBeInstanceOf(AdapterConfigError)
    vi.unstubAllEnvs()
  })

  it('returns validated ui when the model output is valid', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_MODEL', 'gpt-test')
    const mockModel = async () => ({ text: VALID_UI })
    const result = await generateUi(
      { messages: [{ role: 'user', content: 'dashboard' }] },
      mockModel
    )
    expect(result).toEqual({
      ok: true,
      ui: VALID_UI,
      meta: { mode: 'chat', model: 'gpt-test', validated: true }
    })
    vi.unstubAllEnvs()
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

```powershell
cd apps/playground
pnpm vitest run tests/genuiAdapter.test.ts
```

Expected: FAIL — `server/utils/genuiAdapter.ts` does not exist yet.

- [ ] **Step 3: Implement `apps/playground/server/utils/genuiAdapter.ts`**

```ts
import { z } from 'zod/v4'
import { SalesDashboardSchema, componentSpecs } from 'nuxt-ui-genui-core'
import type { GenUIAdapterInput, GenUIAdapterMessage } from 'nuxt-ui-genui-core'

export const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string().min(1)
      })
    )
    .min(1)
})

export class AdapterConfigError extends Error {}

export function buildSystemPrompt(): string {
  const shape = Object.entries(SalesDashboardSchema.shape)
    .map(([key, value]) => `- ${key}: ${(value as z.ZodTypeAny).description ?? '(no description)'}`)
    .join('\n')

  return [
    `You generate OpenUI Lang for the following registered components only:`,
    ...componentSpecs.map((spec) => `- ${spec.name}: ${spec.description}`),
    ``,
    `Emit EXACTLY one line and nothing else. No prose before or after. No code fences.`,
    `Shape: root = SalesDashboard("<title>", "<description>", [<metrics>], [<orders>])`,
    `Arguments are positional JSON values in this EXACT Zod property order:`,
    shape,
    `metrics: at most 4 entries of { "label": string, "value": string, "change"?: string, "trend"?: "up" | "down" | "neutral" }.`,
    `orders: at most 8 entries of { "id": string, "customer": string, "total": string, "status": "Completed" | "Pending" | "Cancelled" }.`,
    `Use realistic business data. Do not include markdown. Do not reference any other component.`
  ].join('\n')
}

export function extractUi(text: string): string {
  const trimmed = text.trim()
  const fence = trimmed.match(/^```(?:\w+)?\n([\s\S]*?)\n```$/)
  return (fence?.[1] ?? trimmed).trim()
}

export function splitPositionalArgs(source: string): string[] {
  const match = source.match(/^root\s*=\s*SalesDashboard\s*\(([\s\S]*)\)\s*$/)
  if (!match) {
    throw new Error('Output must be a single `root = SalesDashboard(...)` statement.')
  }

  const args: string[] = []
  let depth = 0
  let inString = false
  let escaped = false
  let current = ''

  for (const ch of match[1] ?? '') {
    if (escaped) {
      current += ch
      escaped = false
      continue
    }
    if (inString) {
      current += ch
      if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      current += ch
      continue
    }
    if (ch === '[' || ch === '{') {
      depth += 1
      current += ch
      continue
    }
    if (ch === ']' || ch === '}') {
      depth -= 1
      current += ch
      continue
    }
    if (ch === ',' && depth === 0) {
      args.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }
  if (current.trim()) args.push(current.trim())
  return args
}

export type ValidateResult = { ok: true; ui: string } | { ok: false; issues: string[] }

export function validateUi(text: string): ValidateResult {
  try {
    const ui = extractUi(text)
    const args = splitPositionalArgs(ui)
    if (args.length !== 4) {
      return {
        ok: false,
        issues: [`Expected exactly 4 positional arguments (title, description, metrics, orders), got ${args.length}.`]
      }
    }
    const assembled = {
      title: JSON.parse(args[0]!) as unknown,
      description: JSON.parse(args[1]!) as unknown,
      metrics: JSON.parse(args[2]!) as unknown,
      orders: JSON.parse(args[3]!) as unknown
    }
    const parsed = SalesDashboardSchema.safeParse(assembled)
    if (!parsed.success) {
      return {
        ok: false,
        issues: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      }
    }
    return { ok: true, ui }
  } catch (error) {
    return { ok: false, issues: [error instanceof Error ? error.message : String(error)] }
  }
}

export type GenUiModel = (input: {
  system: string
  messages: GenUIAdapterMessage[]
}) => Promise<{ text: string }>

export type ChatAdapterResult =
  | { ok: true; ui: string; meta: { mode: 'chat'; model: string; validated: true } }
  | { ok: false; issues: string[] }

export async function generateUi(
  input: GenUIAdapterInput,
  model?: GenUiModel
): Promise<ChatAdapterResult> {
  const apiKey = process.env.OPENAI_API_KEY
  const modelName = process.env.OPENAI_MODEL
  if (!apiKey || !modelName) {
    throw new AdapterConfigError(
      'OPENAI_API_KEY and OPENAI_MODEL must be set (see .env.example). No default model is provided.'
    )
  }

  const run: GenUiModel =
    model ??
    (async ({ system, messages }) => {
      const [{ generateText }, { openai }] = await Promise.all([
        import('ai'),
        import('@ai-sdk/openai')
      ])
      const result = await generateText({
        model: openai(modelName),
        system,
        messages
      })
      return { text: result.text }
    })

  const { text } = await run({ system: buildSystemPrompt(), messages: input.messages })
  const validated = validateUi(text)

  return validated.ok
    ? { ok: true, ui: validated.ui, meta: { mode: 'chat', model: modelName, validated: true } }
    : { ok: false, issues: validated.issues }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```powershell
pnpm vitest run tests/genuiAdapter.test.ts
```

Expected: PASS (6 tests). If the fenced-valid assertion fails, adjust only `extractUi`, not the test.

- [ ] **Step 5: Confirm the boundary test still passes**

```powershell
pnpm vitest run tests/import-boundary.test.ts
```

Expected: PASS — `server/utils/genuiAdapter.ts` imports only core + `zod`, no banned surfaces. (Note: the boundary test scans `.ts` files; this file legitimately contains no banned imports.)

- [ ] **Step 6: Commit**

```powershell
git add apps/playground/server/utils/genuiAdapter.ts apps/playground/tests/genuiAdapter.test.ts
git commit -m "feat(playground): add boundary-validated GenUI server adapter with tests"
```

### Task 14: Chat route `/api/genui/chat`

**Files:**
- Create: `apps/playground/server/api/genui/chat.post.ts`

**Interfaces:**
- Consumes: `ChatRequestSchema`, `generateUi`, `AdapterConfigError` (Task 13).
- Produces: the route the client calls by default (Task 15). Error model: 400 (bad body) / 500 (adapter config) / 502 (provider failure) / 422 (boundary validation). Success: `{ ui, meta }`.

- [ ] **Step 1: Create the route**

```ts
import {
  AdapterConfigError,
  ChatRequestSchema,
  generateUi
} from '../../utils/genuiAdapter'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ChatRequestSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body. Expected { messages: [{ role, content }] } with at least one message.'
    })
  }

  try {
    const result = await generateUi({ messages: parsed.data.messages })

    if (!result.ok) {
      throw createError({
        statusCode: 422,
        statusMessage: 'Model output failed validation.',
        data: {
          error: 'Model output could not be parsed as OpenUI Lang.',
          issues: result.issues
        }
      })
    }

    return { ui: result.ui, meta: result.meta }
  } catch (cause) {
    if (cause instanceof AdapterConfigError) {
      throw createError({ statusCode: 500, statusMessage: cause.message })
    }
    if (
      typeof cause === 'object' &&
      cause !== null &&
      'statusCode' in cause
    ) {
      throw cause
    }
    throw createError({
      statusCode: 502,
      statusMessage: 'The model provider request failed. Check OPENAI_API_KEY / OPENAI_MODEL and try again.'
    })
  }
})
```

- [ ] **Step 2: Verify typecheck and boundary test**

```powershell
pnpm typecheck
cd apps/playground
pnpm vitest run tests/import-boundary.test.ts
```

Expected: both PASS. The chat route is inside `server/`, so the boundary test covers it.

- [ ] **Step 3: Commit**

```powershell
git add apps/playground/server/api/genui/chat.post.ts
git commit -m "feat(playground): add /api/genui/chat route with 400/500/502/422 error model"
```

### Task 15: Wire the client to the chat route and surface render errors

**Files:**
- Modify: `apps/playground/app/composables/useGenUIChat.ts`
- Modify: `apps/playground/app/pages/index.vue`
- Modify: `apps/playground/app/components/genui/GenUIRenderer.vue` (only if the emit signature needs it — read before editing)

**Interfaces:**
- Consumes: `/api/genui/chat` (Task 14).
- Produces: prompt entry hits the real (gated) endpoint by default; `/api/genui/demo` remains the documented offline deterministic mode. Render errors become visible instead of silent.

- [ ] **Step 1: Read the current files**

```powershell
cat apps/playground/app/composables/useGenUIChat.ts
cat apps/playground/app/pages/index.vue
cat apps/playground/app/components/genui/GenUIRenderer.vue
```

- [ ] **Step 2: Update `useGenUIChat.ts`**

Change the endpoint and the request body; keep the composable's external shape (`messages`, `isStreaming`, `error`, `sendMessage`, `handleAction`) unchanged:

- `fetch('/api/genui/demo', …)` → `fetch('/api/genui/chat', …)`.
- Body `{ prompt: content }` → `{ messages: [...messages.value.filter((m) => m.id !== 'welcome').map((m) => ({ role: m.role, content: m.text })), { role: 'user', content }] }`.
- Welcome message copy → mentions the model-backed transport and the offline demo route, e.g. `"Ask me to create a dashboard. I use OpenAI to generate the UI — /api/genui/demo is kept as an offline deterministic demo."` Keep `id: 'welcome'`.
- Error mapping: read the Nuxt `$fetch` error body when present:

```ts
const data = (cause as { data?: { error?: string; statusMessage?: string } } | null)?.data
error.value =
  data?.error ??
  data?.statusMessage ??
  (cause instanceof Error ? cause.message : 'Generation failed.')
```

- [ ] **Step 3: Update `app/pages/index.vue`**

- Footer `Demo transport · OpenUI Lang renderer` → `Model-backed · OpenUI Lang renderer · offline demo at /api/genui/demo`.
- Add `const renderError = ref<string | null>(null)`.
- Bind the renderer's error emit: `@error="(errors) => { renderError = errors[0]?.message ?? 'Render failed.' }"` (confirm the emitted argument shape in `GenUIRenderer.vue` / vue-lang docs — it is `OpenUIError[]`; adjust the handler to match, do not invent fields).
- Clear it on submit (`renderError.value = null` inside `submit()`).
- Add a second visible banner under the existing one:

```html
<UAlert v-if="renderError" color="error" variant="subtle" title="Render error" :description="renderError" />
```

- [ ] **Step 4: Verify**

```powershell
pnpm typecheck
pnpm test
```

Expected: both PASS. (`pnpm test` runs the adapter unit tests, boundary test, and component smoke test.)

- [ ] **Step 5: Commit**

```powershell
git add apps/playground/app/composables/useGenUIChat.ts apps/playground/app/pages/index.vue apps/playground/app/components/genui/GenUIRenderer.vue
git commit -m "feat(playground): default chat client to /api/genui/chat with visible render errors"
```

### Task 16: Reframe docs to match Phase 0/1 reality

**Files:**
- Modify: `docs/architecture.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: the merged state after Tasks 4–15.
- Produces: docs that describe what exists — no future-tense monorepo claims, no unimplemented promises.

- [ ] **Step 1: Rewrite `docs/architecture.md`**

Keep these headings; rewrite bodies to actual behavior:

- `Product boundary` — `nuxt-ui-genui` is an experimental Nuxt UI component library for OpenUI; one registered component (`SalesDashboard`); not production-ready.
- `Dependency direction` — `apps/playground` → `nuxt-ui-genui-core`; core depends on `zod` only. Server/shared import only core; client library (`shared/genui/library.ts`, SFCs) is client-only.
- `OpenUI boundary` — OpenUI stays behind project-owned APIs (`genuiLibrary`, `/api/genui/chat`); strict allowlist; no generated JS; wire format = positional args follow Zod property order; vue-lang stays 0.4.x (no Lang 1.0 parity); `@openuidev/lang-core` is not used in Phase 1.
- `Registry model` — core `componentSpecs` is the single source of prompt/registry metadata; the client library spreads the specs and attaches SFCs; the server prompt is hand-built from the same specs.
- `Server–client split` — enforced by `tests/import-boundary.test.ts` (core + playground server must not import SFCs / `library.ts` / `#components` / `@nuxt/ui` / `vue-lang`).
- `Model transport` — provider-agnostic `GenUIModelAdapter`-shaped boundary in core (`GenUIAdapterInput`/`GenUIAdapterMessage`/`GenUIAdapterResult`/`GenUIModelAdapter`); first implementation = Vercel AI SDK + OpenAI **in the playground only**; `OPENAI_API_KEY`/`OPENAI_MODEL` required, no default; non-streaming `generateText`; hand-built system prompt; boundary validation in `server/utils/genuiAdapter.ts`; error model 400/500/502/422; no repair, retry, or streaming.
- `Interaction and security` — model output is untrusted until it passes the boundary; actions are requests; privileged ops require server authorization; strict allowlist; prompt-injection resistance is a design goal (the system prompt constrains output to a single registered component); destructive ops need confirmation (future phases).
- `Compatibility` — Nuxt 4 + Nuxt UI 4 + Vue 3.5+ + Zod 4 (`zod/v4`) + vue-lang 0.4.x. Node 20.19+, pnpm 9+.
- `Out of scope (Phases 2+)` — streaming, agentic tools, publishing, extra packages, Vue/Vite/Inertia entrypoints, docs site, motion integration (nuxt-motion-block consumes GenUI later).

Delete: exit criteria from the old doc, claims that the registry was extracted or that streaming exists, "monorepo (planned)" wording for what now exists.

- [ ] **Step 2: Rewrite `README.md`**

- Status banner: experimental, not production-ready.
- Quickstart:

```powershell
pnpm install
Copy-Item .env.example .env  # then set OPENAI_API_KEY and OPENAI_MODEL
pnpm --filter nuxt-ui-genui-playground dev
```

- Offline fallback: `/api/genui/demo` works without keys; the client defaults to `/api/genui/chat` which requires them.
- Env var table: `OPENAI_API_KEY` (required), `OPENAI_MODEL` (required, no default).
- Verification commands: `pnpm typecheck`, `pnpm test`.
- Structure diagram + link to `docs/architecture.md` + MIT license.

- [ ] **Step 3: Sync `AGENTS.md`**

Base it on the Task 10 content; add the Phase-1b facts: `/api/genui/chat` is the default transport (requires env vars); `/api/genui/demo` is the offline deterministic route; the server adapter lives at `apps/playground/server/utils/genuiAdapter.ts`; error model is 400/500/502/422; no streaming, no repair.

- [ ] **Step 4: Verify no stale claims remain**

```powershell
grep -rniE "monorepo \(planned\)|streaming is supported|Lang 1.0|lang-core" docs README.md AGENTS.md
```

Expected: no hits (matches for "lang-core" in the "not used / must stay ^0.4" context are fine).

- [ ] **Step 5: Commit**

```powershell
git add docs/architecture.md README.md AGENTS.md
git commit -m "docs: reframe architecture, README, and AGENTS for Phase 0/1 reality"
```

### Task 17: Full clean-slate verification

**Files:** none (verification only).

- [ ] **Step 1: Remove installed modules**

```powershell
Remove-Item -Recurse -Force node_modules, apps/playground/node_modules, packages/core/node_modules -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Frozen install (exactly what CI does)**

```powershell
pnpm install --frozen-lockfile
```

Expected: succeeds using the committed `pnpm-lock.yaml`. If it fails, the lockfile is stale — run `pnpm install`, commit the updated lockfile, and repeat this step.

- [ ] **Step 3: Typecheck and tests**

```powershell
pnpm typecheck
pnpm test
```

Expected: both PASS.

- [ ] **Step 4 (optional, manual): production build**

```powershell
pnpm build
```

Expected: `nuxt build` completes. Not part of CI; run locally before shipping. If it fails, report — do not weaken the build to make it pass.

- [ ] **Step 5: Manual OpenAI smoke test (user-assisted, optional)**

Start the dev server with real `OPENAI_API_KEY`/`OPENAI_MODEL` in `.env` and submit a dashboard prompt. **Do not claim this works unless it was actually run with a real key** — if not run, report it as unverified and point the user to the two env vars. The offline `/api/genui/demo` path is the deterministic verification path.

- [ ] **Step 6: Confirm repo boundary and history**

```powershell
Test-Path E:\projects\javascript\nuxt-ui-genui   # old backup still present
git -C E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui log --oneline
```

Expected: old scaffold untouched (only the raw ChatGPT transcript moved to the Desktop); new repo has the task commits in order.

- [ ] **Step 7: Final state summary**

Report honestly: what is verified (install, typecheck, unit/component/boundary tests, offline demo), what is not (live OpenAI round-trip unless smoke-tested), and what remains out of scope.
