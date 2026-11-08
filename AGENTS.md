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
