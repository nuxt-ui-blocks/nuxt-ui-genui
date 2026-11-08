# AGENTS.md

GenUI for Nuxt UI - experimental, OpenUI-powered generative UI for Nuxt. pnpm workspace; public repo `github.com/nuxt-ui-blocks/nuxt-ui-genui` (MIT). Not published to npm; not production-ready (see `README.md`).

## Commands (run from repo root)

- `pnpm install` - installs deps; `postinstall` runs `nuxt prepare` (playground only).
- `pnpm dev` / `pnpm build` / `pnpm typecheck` - filtered to `nuxt-ui-genui-playground`.
- `pnpm test` - `pnpm -r test` (core + playground vitest).
- Single test file: `pnpm --filter nuxt-ui-genui-playground exec vitest run tests/<file>.test.ts` (core: same with `nuxt-ui-genui-core`).
- No lint config; rely on `pnpm typecheck` + tests.
- CI (`.github/workflows/ci.yml`, push/PR to `main`, Node 24 + pnpm 9): `pnpm install --frozen-lockfile` -> `pnpm typecheck` -> `pnpm test` -> `pnpm build`.
- Node engines `^22.21.0 || >=24.11.0` (root/playground/core), aligned with Nuxt 4's supported range. Lockfile committed; dependency versions float on `^`.

## Repo location warning

This repo lives at `E:\projects\javascript\nuxt-ui-blocks\nuxt-ui-genui`. The separate stale pre-workspace scaffold at `E:\projects\javascript\nuxt-ui-genui` is NOT this repo - do not edit it, and never assume paths from session cwd.

## Workspace layout

- `apps/playground` (`nuxt-ui-genui-playground`) - Nuxt 4 + Nuxt UI 4 demo/chat app. Entrypoints: `app/app.vue`, `app/pages/index.vue`, `app/utils/streamChat.ts` (owned-SSE stream reader, Vue-free), `app/composables/useGenUIChat.ts` (UIMessage-shaped chat state via `ai` types; `status` lifecycle `submitted|streaming|ready|error`; `renderError` owned by the composable; POSTs `/api/genui/chat`; OpenUI continuation actions become normal turns), `app/components/genui/GenUIRenderer.vue` (wraps `Renderer` from `@openuidev/vue-lang`).
- `packages/core` (`nuxt-ui-genui-core`) - framework-independent: Zod schemas, TS types, `ComponentSpec[]` specs (`src/specs.ts`). **Consumed as TS source** (`exports: ./src/index.ts`) - no build step, zod-only. Don't add build tooling or Nuxt/Vue/UI imports to this package.
- `docs/superpowers/{specs,plans}` - spec-driven workflow; specs are source of truth (see below).

## Critical server/client boundary (enforced by tests)

- `packages/core/src/schemas.ts` - serializable, server+client safe (Zod via `zod/v4`). Server prompt/schema logic imports schemas only from here (as `nuxt-ui-genui-core`).
- `apps/playground/app/genui/library.ts` - **client-only**: Vue SFCs + `createLibrary`/`defineComponent` from `@openuidev/vue-lang`. Never import it (or Vue SFCs) from `server/` or `packages/core`.
- Server/shared code must not import Vue SFCs, `~/genui/library`, `#components`, `@nuxt/ui`, or `@openuidev/vue-lang` - enforced by `apps/playground/tests/import-boundary.test.ts`.
- OpenUI Lang positional args follow **Zod object property order** (SalesDashboard: `title, description, metrics, orders`); changing property order/shape breaks the wire format - enforced by `packages/core/tests/schemas.test.ts`.

## Model transport / env

- `POST /api/genui/chat` is the default (model-backed) and **streams OpenUI Lang over owned SSE** (h3 `createEventStream`). `chunk` frames carry raw Lang text; the terminal frame is `done` (`{"ok":true,"ui":<canonical fence-stripped ui>,"meta":{mode:'chat',model,validated:true}}`) or `error` (`{"ok":false,"issues":[...],"reason":"provider"|"boundary"|"config"}`). `/api/genui/demo` is unchanged - the offline deterministic fallback (non-streaming).
- Client system messages are rejected with 400 (role enum is `user`|`assistant`); the server system prompt is authoritative. `allowSystemInMessages` is forbidden.
- Nuxt reads `.env` **only from the playground rootDir** -> put env in **`apps/playground/.env`** (copy root `.env.example`; gitignored). A root `.env` is NOT read by the playground.
- No defaults for `OPENAI_API_KEY` / `OPENAI_MODEL`. For OpenAI-compatible gateways set `OPENAI_BASE_URL` (see README env table). A local OpenAI-compatible gateway (non-production, not in repo) has been used to exercise the streaming path; never commit gateway credentials.
- Chat adapter: `apps/playground/server/utils/genuiAdapter.ts` - Vercel AI SDK (`ai` v7) `streamText`; system prompt requires a literal `root =` prefix; the adapter's local `validateUi` (defined in the file) is authoritative at stream completion; pre-stream failures are plain `createError` responses - 400 (bad request) / 500 (config missing) / 502 (provider failure) - and never SSE; validation failure at stream end is the in-band `error` frame (`reason: "boundary"`). No repair or retry - invalid output ends the stream with an `error` frame. The client suppresses render-error banners while a turn is `submitted`/`streaming`.
- `@iconify-json/lucide` is a playground devDependency (needed for icon resolution).

## OpenUI constraints

- `@openuidev/vue-lang` is **0.4.x**; it does not match the React renderer's OpenUI Lang 1.0 feature set; do **not** install `@openuidev/lang-core` (React-only). Verify component schema syntax against the pinned 0.4.x API when changing schemas/library.
- Strict component allowlist; never evaluate model-generated JavaScript or Vue templates. UI actions are requests, not commands - privileged ops must be server-authorized/validated.
- OpenUI docs: repo-local skill at `.agents/skills/openui/SKILL.md` (with `references/`, tracked by `skills-lock.json`), plus context7 MCP (registered in `opencode.json`).

## Tests

- Playground: `@vitejs/plugin-vue` + `happy-dom`, `include: tests/**/*.test.ts` - `tests/genuiAdapter.test.ts`, `tests/import-boundary.test.ts`, `tests/SalesDashboard.test.ts`.
- Core: `tests/schemas.test.ts`.
- There is no separate e2e setup; verify model behavior manually against a dev server.

## Spec-driven workflow (superpowers)

- `docs/superpowers/specs/` is the source of truth for in-flight work. Follow the approved spec; don't improvise scope.
- Current status: Phase 1 (chat adapter) and Phase 2 (SSE streaming transport) are implemented. Both specs and plans are committed under `docs/superpowers/{specs,plans}/` (Phase 2: `2026-11-08-nuxt-ui-genui-phase-2-design.md` + `2026-11-08-nuxt-ui-genui-phase-2-plan.md`).

## Repo status

- Packages private (`nuxt-ui-genui-core` v0.0.0), publishing deferred; repo is public MIT.
- CI runs on push/PR to `main`. Phase 2 work is committed on local `main` (11 commits ahead of `origin/main`) and is unpushed — CI status there is unverified until it lands. Reference docs: `README.md` (env vars, structure, license), `docs/architecture.md` (decisions/boundaries).
