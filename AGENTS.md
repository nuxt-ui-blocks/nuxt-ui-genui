# AGENTS.md

Nuxt 4 + Nuxt UI 4 + `@openuidev/vue-lang` (0.4.x) generative-UI MVP scaffold. The demo transport (`/api/genui/demo`) is **deterministic, not an LLM**, and not production-ready (see `README.md`).

## Commands (pnpm)

- `pnpm install` — installs deps; `postinstall` runs `nuxt prepare`.
- `pnpm dev` — Nuxt dev server.
- `pnpm build` — production build.
- `pnpm typecheck` — `nuxt typecheck` (TypeScript `strict: true` via `nuxt.config.ts`).
- No lint/test scripts are configured yet.
- Requirements: Node.js 20.19+, pnpm 9+. No lockfile is committed; dependency versions float on `^` ranges.

## Architecture / entrypoints

- `app/pages/index.vue` — playground UI; `app/app.vue` wraps in `UApp`.
- `app/composables/useGenUIChat.ts` — chat state/transport; POSTs to `/api/genui/demo`, feeds the returned OpenUI Lang `ui` string to the renderer.
- `app/components/genui/GenUIRenderer.vue` — client renderer: `<Renderer :response :library="genuiLibrary" …>` from `@openuidev/vue-lang`; `genuiLibrary` comes from `#shared/genui/library`.
- `app/components/genui/*.vue` — Nuxt UI-backed renderers (allowlist), e.g. `SalesDashboard.vue`.
- `server/api/genui/demo.post.ts` — deterministic demo handler returning `{ ui, meta }`.

## Critical server/client boundary (do not break)

- `shared/genui/schemas.ts` — **serializable, safe on server + client** (Zod via `zod/v4`; no Vue imports). Server and prompt/schema logic must import schemas from here.
- `shared/genui/library.ts` — **client-only**: imports Vue SFCs (`~/components/genui/*`) and builds `genuiLibrary` with `createLibrary`/`defineComponent` from `@openuidev/vue-lang`. **Never import `library.ts` (or Vue SFCs) from `server/`** — the demo route imports only `schemas.ts`.
- Real provider integration (planned): generate the system prompt server-side from serializable component definitions (e.g. `@openuidev/lang-core`), then stream model output to the client.

## OpenUI / GenUI constraints

- OpenUI Lang positional args follow the **Zod object property order** (see `demo.post.ts` `SalesDashboard(...)` construction) — changing schema order/shape breaks the wire format.
- Keep OpenUI behind our own public APIs; do not expose renderer types as the framework's permanent contract. Strict component allowlist; **never evaluate model-generated JavaScript or Vue templates**. Treat UI actions as requests; privileged ops must be server-authorized/validated.
- `@openuidev/vue-lang` is **0.4.x**; its API/features do not fully match the React renderer's OpenUI Lang 1.0 feature set. Verify OpenUI component schema syntax against the pinned version when changing schemas/library.

## Repo status / planned direction (from `README.md`)

- Single app (not yet a pnpm workspace/monorepo). Planned extraction: `core`, `nuxt`, `components`, `chat`, `ai-sdk` packages once the first vertical slice is stable.
- Demo returns a single fixed dashboard (not true token streaming); no model provider/AI SDK is installed yet. `SalesDashboard` is the first vertical slice, not the final registry API.
