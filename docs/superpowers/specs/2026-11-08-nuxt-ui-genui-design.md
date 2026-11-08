# nuxt-ui-genui — Design

**Status:** approved design, pre-implementation
**Date:** 2026-11-08
**Spec path:** `docs/superpowers/specs/2026-11-08-nuxt-ui-genui-design.md` (copied into the new repo during Phase 0)

## 1. Goal

Turn the existing MVP scaffold at `E:\projects\javascript\nuxt-ui-genui` into a standalone, properly structured repository: **nuxt-ui-genui**, the Nuxt UI component library for OpenUI (shadcn/Material-UI analogue for the Vue/Nuxt ecosystem). OpenUI remains the engine behind project-owned APIs; the library is never a thin wrapper over renderer internals.

This design covers **Phase 0 + Phase 1 only**:

- **Phase 0** — restructure: standalone repo, git, pnpm workspace, MIT, metadata, lockfile, CI.
- **Phase 1a** — relocate the deterministic vertical slice into `apps/playground`, extract framework-independent `packages/core`, add tests (incl. server/client import-boundary test).
- **Phase 1b** — real model output via Vercel AI SDK + OpenAI, behind a playground-only adapter, server-side boundary-checked, visible errors, no auto-repair, no streaming.

Phases 2+ (interactions hardening, chat layer, Motion Block integration, publishing, docs site) are explicitly out of scope and get their own specs.

## 2. Origin and source material

- Raw ChatGPT transcript `docs/ChatGPT_Nuxt-Generative-UI-Architecture_20261108-0551.md` in the old scaffold — move to `C:\Users\HP\Desktop` (unpublished, outside any repo), never committed.
- The scaffold itself is the output of that conversation; it is **not** production-ready. `SalesDashboard` is the first vertical slice, not the final registry API.
- Old scaffold `E:\projects\javascript\nuxt-ui-genui` stays **untouched** as backup/reference after the copy.

## 3. Locked decisions

### 3.1 Repository and release

| Decision | Value |
|---|---|
| New local path | `E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui` (parent `nuxt-ui-blocks` does not exist yet; created in Phase 0) |
| GitHub | `nuxt-ui-blocks/nuxt-ui-genui` |
| License | MIT (must be added; scaffold has none) |
| Default branch | `main` |
| Internal package names | `nuxt-ui-genui-core`, `nuxt-ui-genui-playground` (both private) |
| Root package | `nuxt-ui-genui` (private until a release decision; name reserved) |
| Publishing/release automation | Deferred; clean metadata now, no publish workflow |
| Package manager | pnpm only (9+) |
| Node | ≥22.18 (installed tree declares `^22.18.0 || >=24.11.0`; CI uses Node 24) — amended 2026-11-08 per user decision; original 20.19+ floor was contradicted by installed deps (Nuxt + AI SDK) |
| Lockfile | None in scaffold (deps never installed); Phase 0 generates and commits it; CI uses `--frozen-lockfile` |
| npm name availability (verified 2026-11-08) | `nuxt-genui`, `nuxt-ui-genui`, `vue-genui`, `genui-vue`, `open-genui` free; `genui` taken; `@nuxt-ui-blocks` scope ownership unproven — unscoped names used |
| Naming rationale | `nuxt-` prefix is **not** Nuxt-locked: Nuxt UI v4 ships as Nuxt module, Vue/Vite plugin, and Inertia (Laravel/AdonisJS) integration. Final: `nuxt-ui-genui` |
| nuxt-motion-block relationship | Independent repo/package in same org. Motion Block will consume GenUI later via an AI-components integration layer. GenUI ships first with a stable custom-registration API. No coupling in Phase 0/1 |
| Verification gap | Dependencies were never installed; all version claims rest on `package.json` ranges until Phase 0 install |

### 3.2 Architecture and boundaries

- pnpm workspace: **`apps/playground` + `packages/core` only.** No empty future packages (`nuxt`/`components`/`chat`/`ai-sdk`) until a stable slice proves the need.
- `packages/core` (`nuxt-ui-genui-core`): framework-independent contracts. Dependencies: `zod` only. **No** Nuxt/Vue SFC/Nuxt UI/`@openuidev/vue-lang`/app imports.
  - `schemas.ts` — serializable Zod v4 schemas, moved verbatim from the scaffold (property order is wire format — see 3.4).
  - `types.ts` — non-Vue contracts, incl. the project-owned adapter contract:

    ```ts
    export interface GenUIAdapterMessage { role: 'system' | 'user' | 'assistant'; content: string }
    export interface GenUIAdapterInput { messages: GenUIAdapterMessage[] }
    export interface GenUIAdapterResult { ui: string; meta?: Record<string, unknown> }
    export interface GenUIModelAdapter {
      generate(input: GenUIAdapterInput): Promise<GenUIAdapterResult>
    }
    ```

    (Shape only — no implementation in core. The playground adapter in Phase 1b implements this interface.)
  - `specs.ts` — (Phase 1b) framework-free component specs: plain `{ name, description, props }` objects shared by the server prompt builder and the client library, so prompt text and registry cannot drift.
  - `index.ts` — public exports.
- `apps/playground` (`nuxt-ui-genui-playground`): Nuxt 4 app owning demo route(s), pages/components, client-only `genuiLibrary` wiring (`library.ts` stays here), the deterministic SalesDashboard slice, and the Phase 1b OpenAI adapter.
- Playground depends on core via `workspace:*`.
- **Server/shared code must never import `library.ts`, Vue SFCs, or `#components`.** Enforced by an automated import-boundary test.
- Layering budget: app → `nuxt-ui-genui` (later Nuxt package) → Nuxt UI 4 → Nuxt 4 / Vue 3.5. Core never sees Nuxt UI.
- OpenUI is the engine behind project-owned APIs, never the permanent public contract. Renderer types are not re-exported as framework API.
- **Strict component allowlist. Never evaluate model-generated JavaScript or Vue templates. UI actions are requests; privileged/destructive ops require server-side authorization and confirmation.** (Enforceable now: allowlist + no-eval; confirmation flows land with the chat layer.)

### 3.3 Versions

Nuxt 4 · Nuxt UI 4 · Vue 3.5+ · Zod 4 · `@openuidev/vue-lang` ^0.4.1 (0.4.2 latest) · `@openuidev/lang-core` **^0.4** when introduced (1.x is React-only Lang 1.0 — must not be installed) · TypeScript strict (via `nuxt.config.ts`).

`@openuidev/vue-lang` 0.4.x has no Lang 1.0 feature parity (single-step actions, custom functions, actions). Verify OpenUI schema syntax against the installed 0.4.x when changing schemas/library.

### 3.4 Wire format

OpenUI Lang positional arguments follow the **Zod object property order** of the component props schema (see `demo.post.ts` `SalesDashboard(...)` construction). Reordering/renaming schema properties breaks the wire format. The core extraction must move schemas verbatim, and a key-order assertion test guards this.

## 4. Phase 0 — restructure

1. Create `E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui`; copy **only**: `package.json`, `nuxt.config.ts`, `app/`, `server/`, `shared/`, `.env.example`, `.gitignore`, `README.md`, `AGENTS.md`, `docs/architecture.md`, this spec (`docs/superpowers/specs/`).
2. `git init -b main`; **baseline commit** of the verbatim copy *before* any changes. All subsequent edits are reviewable commits on top.
3. Root: `pnpm-workspace.yaml` (`apps/*`, `packages/*`), private root package `nuxt-ui-genui`, MIT `LICENSE`, `.github/workflows/ci.yml` (frozen install + typecheck on push/PR; no publish/docs deploy). The `test` CI step is added in Phase 1a when the suite exists.
4. `.env.example` gains `OPENAI_API_KEY` / `OPENAI_MODEL` (with “required, no default” comments).
5. Transcript moved to Desktop; old scaffold untouched.
6. **Gates:** local `pnpm install` (generates + commits lockfile), `pnpm typecheck`, `pnpm test` all pass before Phase 1a.

CI caveat (documented): workflow green will be assumed from config, not observed, until first push to GitHub. Local frozen-install/typecheck/test are the verified gates.

## 5. Phase 1a — relocation, core extraction, tests

1. `git mv` `app/`, `server/`, `shared/`, `nuxt.config.ts` → `apps/playground/`. Playground becomes private `nuxt-ui-genui-playground`; its deps stay its own (nuxt, @nuxt/ui, @openuidev/vue-lang, zod).
2. Extract `packages/core` as in §3.2 (schemas verbatim; types with `GenUIModelAdapter`; `index.ts`). `library.ts` remains client-only in playground and imports schemas from core.
3. Playground imports core via `workspace:*`; `server/api/genui/demo.post.ts` and `library.ts` both import `nuxt-ui-genui-core`. Remove/replace `#shared/genui/schemas` references.
4. **Tests (Vitest):**
   - Schema tests: round-trip parse, plus **key-order assertion** on the Zod object shape (wire-format guard).
   - **Server/client import-boundary test**: Node test scanning `packages/core/src/**` and `apps/playground/server/**`; fails on imports of `.vue` files, `library.ts`, `#components`, `@nuxt/ui`, or `@openuidev/vue-lang`.
   - Component smoke test with Vue Test Utils (Nuxt UI stubs; `shallowMount` fallback) mounting `SalesDashboard.vue`.
   - Per-package Vitest configs; root `pnpm test`.
5. **AGENTS.md** rewritten for the monorepo (commands, layout, boundaries, wire-format rule, lang-core ^0.4 pin, no lint yet).
6. **Exit criteria:** fresh install/typecheck/test green; history = baseline → restructure → core extraction → tests.
7. Not in 1a: OpenAI, lang-core in runtime, prompt generation, streaming, extra packages, publishing.

## 6. Phase 1b — OpenAI behind a playground-only adapter

1. Playground-only deps: `ai` (Vercel AI SDK), `@ai-sdk/openai`. Core unchanged (`zod` only). (`@openuidev/lang-core` deferred out of Phase 1b — see 6.3.)
2. Framework-free specs land in `packages/core/src/specs.ts` (§3.2). Client `genuiLibrary` spreads specs + attaches SFCs; server prompt builder consumes the same specs.
3. Server prompt generation: a hand-built system-prompt builder over the core specs (plain string from `name`/`description`/Zod `.describe()` metadata; instructs the model to emit `root = SalesDashboard(...)` positional args in Zod property order). No `@openuidev/lang-core` dependency in Phase 1b — avoids depending on an unverified 0.4 API surface. lang-core integration is deferred to the streaming/prompt milestone.
4. **New route `POST /api/genui/chat`**; thin handler, logic in `server/utils/genuiAdapter.ts` with an injectable model function (tests never hit the network):
   - Input validated with Zod (`{ messages: [...] }`, last = user prompt); malformed → `400`.
   - `generateText({ model: openai(process.env.OPENAI_MODEL!), system, messages })` — non-streaming.
   - **Missing/empty `OPENAI_API_KEY` or `OPENAI_MODEL` → `500` with clear instructions.** No invented model default.
   - Output passes the owned boundary: strip one surrounding code fence if present; extract top-level positional arguments (bracket/string-aware split); `JSON.parse` each; assemble `{ title, description, metrics, orders }` in Zod property order; `SalesDashboardSchema.safeParse`. Unparseable/invalid → **`422 { error, issues }`**, no repair/retry. AI SDK failure → `502`.
   - `/api/genui/demo` unchanged and documented as offline mode.
5. **Client `useGenUIChat`**: default endpoint → `/api/genui/chat`; response shape mirrors demo (`{ ui, meta }`); render/parse errors surface as a visible banner. No added controls or debug panel.
6. **Boundary test extended** to the chat route + adapter.
7. **Unit tests (no network):** mocked adapter — valid Lang passes; garbage → 422 shape; missing env → config error; bad input → 400. Live check = manual smoke only.
8. **Exit criteria:** install/typecheck/test green; with key — manual prompt renders dashboard; without — clear visible error.

## 7. Docs (reflect reality)

- `docs/architecture.md` — keep durable decisions; reframe layout to monorepo; document the actual Phase 1 surface: `/api/genui/chat`, prompt source = core specs, error model (400/500/502/422), offline demo, no streaming. Remove future-phase claims.
- `README.md` — monorepo quickstart (`pnpm install`, `pnpm --filter nuxt-ui-genui-playground dev`), env vars, offline demo, test/typecheck, honest status banner.
- `AGENTS.md` — monorepo rewrite per §5.5.
- This spec travels with the implementation plan (`docs/superpowers/plans/`).

## 8. Rollout order

Each commit leaves the repo runnable: Phase 0 baseline import → workspace/LICENSE/CI/metadata/.env.example → 1a move → core extraction → tests → AGENTS.md → 1b adapter → docs reframe.

## 9. Known gaps (documented, not hidden)

- Installed versions unverified until Phase 0 install; all claims are ranges.
- No true token streaming (design constraint for now).
- Exactly one registered component (SalesDashboard).
- No automatic repair of model output.
- Live model verification is manual.
- CI green unobserved until first push.

## 10. Out of scope (Phase 0/1)

Publishing/release automation · `nuxt`/`components`/`chat`/`ai-sdk` packages · Vue/Vite or Inertia/Laravel entrypoints (core stays portable; nothing built) · streaming · agentic tool loops + confirmation flows · docs site · prompt-injection hardening beyond strict allowlist/no-eval.

## 11. Open questions / deferred decisions

- None blocking. Decisions taken at planning time (recorded here): Phase 1b prompt is hand-built from core specs (no `lang-core`); owned positional-args boundary (fence strip → bracket/string-aware split → JSON.parse → Zod safeParse); SalesDashboard smoke-test approach (Nuxt UI stubs vs shallowMount) decided at implementation time.
- Post-Phase-1: Motion Block AI-components integration, chat layer spec, release spec.
