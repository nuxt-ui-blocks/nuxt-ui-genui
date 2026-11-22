# OpenUI Cloud demo and release hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in OpenUI Cloud provider to the playground with credential-free automated coverage, then add the package/release validation needed to publish an alpha safely.

**Architecture:** Keep `@nuxt-ui-genui/*` provider-neutral. A playground-only resolver maps `GENAI_PROVIDER` to one of three configurations and feeds the existing injected `@nuxt-ui-genui/ai-sdk` adapter. OpenUI Cloud (Gateway) is OpenAI-compatible at a fixed base URL, so it needs no new SDK dependency: only injected `{ apiKey, baseURL, model }` plus a `cloud: true` system prompt from the existing core helper. Release validation stays outside package source: a tarball auditor, a clean-consumer installer, and CI.

**Tech Stack:** Nuxt 4, Nuxt UI 4, Vue 3.5, pnpm 9 workspace, Vercel AI SDK 6 (adapter package only), `@openuidev/lang-core` 0.4.x, Vitest 3, Node >=20.19, PowerShell on Windows.

**Spec:** `docs/superpowers/specs/2026-11-22-openui-cloud-demo-design.md`

## Global Constraints

- Nuxt 4 + Nuxt UI 4 only; playground stays `ssr: false`.
- `OPENUI_TELEMETRY_DISABLED=1` for every build/test command.
- `THESYS_API_KEY` is read only in Nitro server code; never in `runtimeConfig.public`, client code, tests, docs examples, logs, or tarballs. Use dummy literals such as `test-key` in tests only.
- No `ai` / `@ai-sdk/*` import in `@nuxt-ui-genui/{core,components,nuxt,chat}`; no cloud-specific code or dependency in any published package.
- OpenUI Cloud Gateway base URL is fixed: `https://api.thesys.dev/v1/embed` (endpoint `POST .../chat/completions`). No host override.
- Gateway system prompt must be generated with `cloud: true`; send exactly one OpenUI system prompt per request.
- Model ids are `{provider}/{model}` (e.g. `openai/gpt-5`, `anthropic/claude-sonnet-5`; free models end in `-free`). Never invent a default model; require `GENAI_MODEL` for cloud mode.
- Existing behavior when `GENAI_PROVIDER` is unset must be byte-for-byte equivalent to today's mock/live selection.
- No push, merge, publish, or live cloud request without explicit user approval. Local commits only.

## Review Focus

- **Unknown `GENAI_PROVIDER` value** → clear 503-style configuration error; never silently fall back to mock. Task 2, provider resolver tests.
- **Missing `THESYS_API_KEY` or `GENAI_MODEL` in cloud mode** → explicit error, no outbound request. Task 2, cloud config tests.
- **Cloud prompt missing the `cloud: true` config block** → Gateway would not validate/correct streamed OpenUI Lang. Task 3, route test spies on `generateGenUISystemPrompt`.
- **Secret leakage** through `/api/provider`, client bundle, or published tarballs → no key field/value anywhere. Task 4 provider test; Task 5 tarball auditor.
- **Legacy `GENAI_MOCK` / `GENAI_LIVE` combined with explicit `GENAI_PROVIDER`** → explicit provider wins, legacy behavior unchanged when provider is absent. Task 2 precedence tests.

---

### Task 1: Land pending hardening fixes and establish a green baseline

**Files:**
- Modify: `packages/core/src/stream.ts`, `packages/core/test/stream.test.ts`
- Modify: `packages/server/src/tool-handler.ts`, `packages/server/test/tool-handler.test.ts`
- Commit if untracked: `architecture-review-followup-fixes.md`

**Interfaces:** Consumes the existing worktree state; produces a clean tree with only the approved design doc/plan uncommitted.

- [ ] **Step 1: Confirm the exact pending set**

Run: `git status --short --branch`
Expected: only the four source/test files above, the follow-up fixes document, and the new spec/plan docs. Stop if unrelated user work appears.

- [ ] **Step 2: Verify the baseline before committing**

Run (PowerShell): `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm build; pnpm typecheck; pnpm test`
Expected: all three exit 0; 263 tests across 43 files (core 44, server 26).

- [ ] **Step 3: Commit the follow-up fixes**

```powershell
git add packages/core/src/stream.ts packages/core/test/stream.test.ts packages/server/src/tool-handler.ts packages/server/test/tool-handler.test.ts architecture-review-followup-fixes.md
git commit -m "fix: account for UTF-8 arg bytes and standalone CR in streams"
```

- [ ] **Step 4: Confirm tree state**

Run: `git status --short`
Expected: only `docs/superpowers/specs/2026-11-22-openui-cloud-demo-design.md` and this plan remain untracked.

---

### Task 2: Playground provider resolver and planner

**Files:**
- Create: `apps/playground/server/utils/provider.ts`
- Create: `apps/playground/test/provider.test.ts`
- Create: `apps/playground/vitest.config.ts`
- Modify: `apps/playground/package.json` (install command below)

**Interfaces:**
- Consumes: `resolveGenUIMock(env)` / `resolveGenUILive(env)` from `apps/playground/server/utils/genai.ts` (unchanged); `GenUILiveOptions`, `StreamGenUIOptions`, `streamGenUI`, `streamGenUIText` from `@nuxt-ui-genui/ai-sdk`.
- Produces: `GenUIProviderName = 'mock' | 'openai-compatible' | 'openui-cloud'`; `OPENUI_CLOUD_BASE_URL = 'https://api.thesys.dev/v1/embed'`; `class GenUIProviderConfigError extends Error`; `interface GenUIProviderConfig { provider: GenUIProviderName; mock: boolean; cloud: boolean; live?: GenUILiveOptions }`; `resolveGenUIProvider(env?: Record<string, string | undefined>): GenUIProviderConfig`; `interface ChatPlan { stream: (options: StreamGenUIOptions) => Promise<Response>; options: StreamGenUIOptions }`; `planChatRequest(input: { config: GenUIProviderConfig; format: 'text' | 'ui-stream'; messages: never[]; systemPrompt: string; mockProgram: string }): ChatPlan`.

**Resolver rules (exact):**
1. Unknown `GENAI_PROVIDER` → throw `GenUIProviderConfigError('Unknown GENAI_PROVIDER "<value>". Expected one of: mock, openai-compatible, openui-cloud.')`.
2. `mock` → `{ provider:'mock', mock:true, cloud:false }`; keys ignored.
3. `openui-cloud` → require `THESYS_API_KEY`, else throw `GenUIProviderConfigError('GENAI_PROVIDER=openui-cloud requires THESYS_API_KEY on the server.')`; require `GENAI_MODEL`, else throw `GenUIProviderConfigError('GENAI_PROVIDER=openui-cloud requires GENAI_MODEL (for example openai/gpt-5).')`; return `{ provider:'openui-cloud', mock:false, cloud:true, live:{ apiKey, baseURL: OPENUI_CLOUD_BASE_URL, model } }`.
4. `openai-compatible` → call `resolveGenUILive({ ...env, GENAI_MOCK: undefined, GENAI_LIVE: undefined })` so an explicit provider beats legacy flags; return `{ provider:'openai-compatible', mock:false, cloud:false, live }`.
5. No `GENAI_PROVIDER` → current behavior exactly: `resolveGenUIMock(env)` decides `mock`; otherwise `live` from `resolveGenUILive(env)`.

**Planner rules (exact):** `format === 'ui-stream'` selects `streamGenUI`, else `streamGenUIText`. Mock config produces `options: { systemPrompt, messages, mockProgram }`. Live config with no `live` throws `GenUIProviderConfigError('Live model not configured. Set GENAI_API_KEY (plus optional GENAI_BASE_URL / GENAI_MODEL) in apps/playground/.env, or run with GENAI_MOCK=1 for the deterministic demo.')`. Live config produces `options: { systemPrompt, messages, live }`.

- [ ] **Step 1: Add Vitest to the playground**

Run: `pnpm --dir apps/playground add -D 'vitest@^3.0.0'` (updates lockfile with a real pinned version).
Then set `apps/playground/package.json` script `"test": "vitest run"`.

- [ ] **Step 2: Add the test alias config**

Create `apps/playground/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./app', import.meta.url)) } }
})
```

- [ ] **Step 3: Write failing resolver tests**

Create `apps/playground/test/provider.test.ts` with these cases (dummy values only: `test-key`, `openai/gpt-5`):
- no env → `{ provider:'openai-compatible', mock:false, cloud:false, live:undefined }`
- `{ GENAI_MOCK:'1' }` → provider `mock`, `mock:true`
- `{ GENAI_PROVIDER:'mock', GENAI_API_KEY:'test-key' }` → `mock:true`, key ignored
- `{ GENAI_PROVIDER:'openai-compatible', GENAI_LIVE:'0', GENAI_API_KEY:'test-key' }` → `live` defined (explicit provider wins over legacy)
- unknown provider → throws the exact unknown-provider message
- cloud without key → throws the exact key message
- cloud with key but no model → throws the exact model message
- valid cloud → `live` deep-equals `{ apiKey:'test-key', baseURL:'https://api.thesys.dev/v1/embed', model:'openai/gpt-5' }`, `cloud:true`, `mock:false`
- `planChatRequest` with `format:'text'` and cloud config → `stream === streamGenUIText`, `options.live` equals the cloud live object
- `planChatRequest` with `format:'ui-stream'` → `stream === streamGenUI`
- `planChatRequest` with mock config → `options.mockProgram` present, `options.live === undefined`
- `planChatRequest` with no config → throws the exact 503 message

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm --dir apps/playground test`
Expected: FAIL on missing `../server/utils/provider`.

- [ ] **Step 5: Implement `apps/playground/server/utils/provider.ts`**

Implement the exact signatures and rules above. Import `streamGenUI`/`streamGenUIText` at module scope; do not read `process.env` anywhere except the default argument of `resolveGenUIProvider`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --dir apps/playground test`
Expected: PASS (12 tests).

- [ ] **Step 7: Commit**

```powershell
git add apps/playground/server/utils/provider.ts apps/playground/test/provider.test.ts apps/playground/vitest.config.ts apps/playground/package.json pnpm-lock.yaml
git commit -m "feat(playground): resolve mock, generic and OpenUI Cloud providers"
```

---

### Task 3: Route chat through the provider plan with a cloud prompt

**Files:**
- Modify: `apps/playground/server/api/chat.post.ts`
- Create: `apps/playground/test/chat-route.test.ts`

**Interfaces:**
- Consumes: `resolveGenUIProvider`, `planChatRequest`, `GenUIProviderConfigError` (Task 2); `createPlaygroundLibrary`, `promptOptions` from `~/lib/library`; `pickProgram` from `~/lib/demo-program`; `generateGenUISystemPrompt` from `@nuxt-ui-genui/core`.
- Produces: the same HTTP response shapes as today — plain OpenUI Lang text by default, AI SDK UI-message stream for `?format=ui-stream` or `Accept: text/event-stream`.

- [ ] **Step 1: Write the failing route test**

Create `apps/playground/test/chat-route.test.ts`. Use `vi.stubGlobal` for `defineEventHandler` (returns its callback), `readBody` (returns `{ messages: [{ role:'user', parts:[{ text:'hello' }] }] }`), `getQuery` (returns `{}`), `getRequestHeader` (returns the test Accept header), `createError` (returns an object with `statusCode`/`statusMessage`), and a minimal `event.node.req.headers` object. Mock `~/lib/library`, `~/lib/demo-program`, `@nuxt-ui-genui/core` and `@nuxt-ui-genui/ai-sdk`; use `vi.resetModules()` between cases so module-level mocks apply.

Assert:
- cloud env (`GENAI_PROVIDER=openui-cloud`, `THESYS_API_KEY=test-key`, `GENAI_MODEL=openai/gpt-5`) + `Accept: text/event-stream` → `generateGenUISystemPrompt` called with an object containing `cloud: true`, `streamGenUI` called with `live.baseURL === 'https://api.thesys.dev/v1/embed'`.
- same env without the Accept header → `streamGenUIText` called instead.
- `GENAI_MOCK=1` → `streamGenUIText` called with `mockProgram`, no `live`.
- empty env → `createError` called with `statusCode: 503`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --dir apps/playground test`
Expected: FAIL because the route does not use the resolver yet.

- [ ] **Step 3: Rewrite the route**

Keep body validation, format negotiation, and library/prompt setup. Replace the mock/live branches with:

```ts
let config
try {
  config = resolveGenUIProvider(process.env)
} catch (error) {
  if (error instanceof GenUIProviderConfigError) {
    throw createError({ statusCode: 503, statusMessage: error.message })
  }
  throw error
}
const systemPrompt = generateGenUISystemPrompt(library, { ...promptOptions, cloud: config.cloud })
const plan = planChatRequest({
  config,
  format,
  messages,
  systemPrompt,
  mockProgram: pickProgram(userText)
})
return plan.stream(plan.options)
```

Compute `userText` exactly as the current route does. Do not add auth, rate limiting, or model selection from the request body.

- [ ] **Step 4: Run tests and typecheck**

Run: `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm --dir apps/playground test; pnpm --dir apps/playground typecheck`
Expected: both exit 0.

- [ ] **Step 5: Commit**

```powershell
git add apps/playground/server/api/chat.post.ts apps/playground/test/chat-route.test.ts
git commit -m "feat(playground): use a cloud system prompt and shared chat plan"
```

---

### Task 4: Provider badge, documentation, and manual smoke procedure

**Files:**
- Modify: `apps/playground/server/api/provider.get.ts`
- Modify: `apps/playground/app/pages/index.vue`
- Modify: `README.md` (env table, demo-only warning, doc link)
- Create: `docs/openui-cloud-smoke.md`
- Create: `apps/playground/test/provider-route.test.ts`

**Interfaces:**
- Consumes: `resolveGenUIProvider` (Task 2).
- Produces: `/api/provider` response `{ provider: GenUIProviderName; live: boolean; mock: boolean; model?: string }` plus a fallback `{ provider:'mock', live:false, mock:false }` when config is invalid; existing `live`/`mock`/`model` fields keep their meaning.

- [ ] **Step 1: Write the provider-route test**

Create `apps/playground/test/provider-route.test.ts` (stub `defineEventHandler` as in Task 3). With cloud env (`test-key`, `openai/gpt-5`) assert:
- response equals `{ provider:'openui-cloud', live:true, mock:false, model:'openai/gpt-5' }`
- `JSON.stringify(response)` does not contain `test-key` and has no `apiKey` property
With an unknown provider env, assert the fallback response and no thrown error.

- [ ] **Step 2: Run the tests to verify it fails**

Run: `pnpm --dir apps/playground test`
Expected: FAIL (no `provider` field yet).

- [ ] **Step 3: Update `/api/provider`**

Use `resolveGenUIProvider(process.env)` inside a `try/catch`; return `{ provider: config.provider, live: Boolean(config.live), mock: config.mock, model: config.live?.model }`. On `GenUIProviderConfigError`, return the fallback object. Never include the key.

- [ ] **Step 4: Update the UI badge**

In `apps/playground/app/pages/index.vue`, extend the provider ref/fetch type with `provider?: string` and change the badge label to `provider.provider === 'openui-cloud' ? \`openui cloud · ${provider.model ?? 'model'}\` : <existing labels>`. Keep existing color logic: cloud uses `success` when `live`.

- [ ] **Step 5: Update README and add the smoke guide**

README env table additions:
- `GENAI_PROVIDER` — unset by default; `mock`, `openai-compatible`, or `openui-cloud`.
- `THESYS_API_KEY` — server-only OpenUI Cloud key; never sent to the browser.
- For `openui-cloud`, `GENAI_MODEL` is required and uses `{provider}/{model}` ids; no default is assumed.

Document precedence in one sentence: an explicit `GENAI_PROVIDER` overrides legacy `GENAI_MOCK`/`GENAI_LIVE`; with no provider variable, legacy behavior is unchanged. Add a prominent note that the playground chat route is a demo, not a production template (no auth, authorization, rate limiting, or production middleware), and link `docs/openui-cloud-smoke.md`.

Create `docs/openui-cloud-smoke.md` with user-run steps only: user creates the key (`npx @openuidev/cli@latest generate-api-key` or console.thesys.dev/keys), sets `GENAI_PROVIDER=openui-cloud`, `THESYS_API_KEY`, and `GENAI_MODEL` in gitignored `apps/playground/.env`, runs `pnpm dev`, confirms the badge reads `openui cloud · <model>`, sends one prompt, and verifies a streamed OpenUI program renders. State that this is an optional manual check, not CI, and that no key value belongs in issues, transcripts, or tests. Link the official model catalog (`https://www.openui.com/cloud/gateway/models`).

- [ ] **Step 6: Verify and commit**

Run: `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm --dir apps/playground test; pnpm build; pnpm typecheck; pnpm test`
Expected: all green.
Commit with `git add apps/playground docs/openui-cloud-smoke.md README.md` and message `docs: expose provider state and document OpenUI Cloud smoke`.

---

### Task 5: Release validation scripts and CI

**Files:**
- Create: `scripts/verify-packages.mjs`
- Create: `scripts/verify-clean-consumer.mjs`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (three scripts)

**Interfaces:**
- Consumes: built `dist` output from `pnpm build`; `npm` CLI (Node 26 locally, Node 20.19+ in CI).
- Produces: `pnpm verify:packages`, `pnpm verify:consumer`, `pnpm verify:release`; a CI workflow that never sees a cloud credential.

- [ ] **Step 1: Implement the tarball auditor**

`scripts/verify-packages.mjs` must:
- enumerate `packages/*` with valid `name`/`version`;
- run `npm pack --dry-run --json` with `cwd` set to each package directory (not `--prefix`);
- assert every tarball has at least one `dist/` file, has `package.json`, and has no path starting `src/`, `test/`, `node_modules/`, and no `.env` or `THESYS_API_KEY` string in any file path or `package.json` content;
- assert each `exports` target listed in `package.json` exists in the tarball file list;
- print one line per package and exit 1 on the first failure.

Add root script `"verify:packages": "node scripts/verify-packages.mjs"`.

- [ ] **Step 2: Verify the auditor locally**

Run: `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm build; pnpm verify:packages`
Expected: seven packages pass; no tarball includes source, tests, or a key string.

- [ ] **Step 3: Implement the clean-consumer check**

`scripts/verify-clean-consumer.mjs` must:
- run `npm pack --json` in each package directory into an ignored `.release/tarballs/` directory;
- create `.release/consumer/package.json` with `file:` dependencies for all seven tarballs plus peers `nuxt@^4.1.0`, `@nuxt/ui@^4.12.0`, `vue@^3.5.0`, `@openuidev/vue-lang@^0.4.2`, `zod@^4.0.0`;
- run `npm install --no-audit --no-fund --ignore-scripts` in that consumer (network required; document this);
- write a temporary `.mjs` check in the consumer that resolves every declared entry with `import.meta.resolve` (`@nuxt-ui-genui/core`, `@nuxt-ui-genui/chat`, `@nuxt-ui-genui/server`, `@nuxt-ui-genui/ai-sdk`, `@nuxt-ui-genui/ai-sdk/chat`, `@nuxt-ui-genui/components`, `@nuxt-ui-genui/components/sfc`, `@nuxt-ui-genui/components/markdown`, `@nuxt-ui-genui/components/upload`, `@nuxt-ui-genui/components/form-context`, `@nuxt-ui-genui/chat-ui`, `@nuxt-ui-genui/nuxt`, `@nuxt-ui-genui/nuxt/vue-plugin`) and imports the server-safe packages to assert named exports: `createGenUILibrary`, `generateGenUISystemPrompt`, `createGenUIChat`, `streamGenUIText`. Do not import the `/sfc` or `/nuxt` entries at runtime.
- add `.release/` to `.gitignore`.

Add root scripts `"verify:consumer": "node scripts/verify-clean-consumer.mjs"` and `"verify:release": "pnpm build && pnpm verify:packages && pnpm verify:consumer"`.

- [ ] **Step 4: Add CI**

Create `.github/workflows/ci.yml`: triggers on push and pull_request; job `verify` with matrix `node-version: [20.19.0, 22.x]`; `actions/checkout@v4`, `actions/setup-node@v4`, `corepack enable`, `corepack prepare pnpm@9 --activate`, `pnpm install --frozen-lockfile`, then `OPENUI_TELEMETRY_DISABLED=1 pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm verify:packages`, `pnpm verify:consumer`. Set `OPENUI_TELEMETRY_DISABLED: '1'` at job level. Do not declare `THESYS_API_KEY` or any secret.

- [ ] **Step 5: Run and commit**

Run: `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm verify:release`
Expected: all steps exit 0. If the consumer install cannot reach the registry locally, report that explicitly and rely on CI; do not fabricate success.
Commit with message `chore: add package tarball and clean-consumer release checks`.

---

### Task 6: Compatibility metadata, license files, and release checklist

**Files:**
- Modify: `packages/components/package.json`, `packages/nuxt/package.json`, and all seven `packages/*/package.json` `files` arrays
- Create/copy: `packages/*/LICENSE` (seven files)
- Create: `docs/release.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 5 validation results.
- Produces: a documented alpha release gate; no publish action.

- [ ] **Step 1: Align metadata with tested versions**

Copy root `LICENSE` into each `packages/*/` and append `"LICENSE"` to each package's `files` array. Narrow only the ranges actually tested: `@nuxt/ui >=4.12.0` and `nuxt >=4.1.0` in `@nuxt-ui-genui/components`; `nuxt >=4.1.0` in `@nuxt-ui-genui/nuxt`. Keep Vue `>=3.5.0` everywhere it is already declared (chat uses Vue refs, so its peer is intentional).

- [ ] **Step 2: Refresh and verify**

Run: `pnpm install; $env:OPENUI_TELEMETRY_DISABLED='1'; pnpm build; pnpm typecheck; pnpm test; pnpm verify:packages`
Expected: all exit 0; tarballs now include `LICENSE`.

- [ ] **Step 3: Write `docs/release.md`**

Include: compatibility matrix (Node >=20.19, pnpm 9 / lockfile 9.0, Nuxt >=4.1, Nuxt UI >=4.12, Vue >=3.5, `@openuidev/lang-core` ^0.4.1, `@openuidev/vue-lang` ^0.4.2, Zod 4); explicit alpha/not-stable status; SSR limitation; provider verification status (generic local gateway verified, OpenUI Cloud manual smoke documented); release checklist (version bump all seven packages, update changelog, `pnpm build`, `pnpm verify:release`, mock-mode smoke, manual cloud smoke, tag as `alpha`, obtain explicit approval before publish); rollback notes; reminder that no push/publish happens without approval.

- [ ] **Step 4: Link from README**

Add a link to `docs/release.md` in the README alpha notice and repeat that the playground route is demo-only.

- [ ] **Step 5: Commit**

```powershell
git add packages docs/release.md README.md pnpm-lock.yaml
git commit -m "docs: document compatibility matrix and alpha release checklist"
```

---

### Task 7: Final release-readiness gate

**Files:** none; verification only.

**Interfaces:** Consumes all previous tasks.

- [ ] **Step 1: Run the full gate**

Run: `$env:OPENUI_TELEMETRY_DISABLED='1'; pnpm build; pnpm typecheck; pnpm test; pnpm verify:packages`
Expected: all exit 0; test count at least the previous 263 plus the new playground tests.

- [ ] **Step 2: Confirm no credential or unpublished state leaked**

Run: `git status --short --branch; git grep -n "THESYS_API_KEY" -- apps/playground/app packages ':!**/*.md'`
Expected: clean working tree; no matches in client or package source (only server utils/README/docs are allowed to mention the variable name, and docs never show a value).

- [ ] **Step 3: Hand off**

Report the exact commands run and results, list the remaining manual gates (clean-consumer install in CI, optional live cloud smoke with a user-created key), and ask the user before any push, merge, or publish. Do not run a live cloud request.
