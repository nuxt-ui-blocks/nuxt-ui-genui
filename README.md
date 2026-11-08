# Nuxt UI GenUI

> **Status: experimental — not production-ready.** One registered component (`SalesDashboard`), no published packages, no stable API. Do not use in production.

An experimental Nuxt UI component library for OpenUI. A pnpm monorepo with `apps/playground` (Nuxt 4 demo app) and `packages/core` (`nuxt-ui-genui-core`, framework-independent contracts).

## Quickstart

```powershell
pnpm install
Copy-Item .env.example .env  # then set OPENAI_API_KEY and OPENAI_MODEL
pnpm --filter nuxt-ui-genui-playground dev
```

Open the local URL printed by Nuxt. The chat client defaults to `/api/genui/chat`, which calls OpenAI through the Vercel AI SDK and requires the env vars below.

**Offline fallback:** `/api/genui/demo` works without any keys — it returns a fixed `SalesDashboard` as OpenUI Lang. The client's default transport is `/api/genui/chat`, which does require the keys; without them you get HTTP 500.

## Environment variables

| Variable         | Required | Notes                          |
| ---------------- | -------- | ------------------------------ |
| `OPENAI_API_KEY` | yes      | No default; request fails without it |
| `OPENAI_MODEL`   | yes      | No default model is provided   |

Copy `.env.example` to `.env` and fill in both. `.env` is gitignored.

## Verification

```powershell
pnpm typecheck
pnpm test
pnpm build
```

## Repository structure

```text
apps/
  playground/                 Nuxt 4 playground app (private)
    app/                      SFCs, composables, pages
    server/api/genui/         /api/genui/chat (model-backed) · /api/genui/demo (offline)
    server/utils/genuiAdapter.ts  Vercel AI SDK + OpenAI adapter, boundary validation
    app/genui/library.ts    Client-only OpenUI library (genuiLibrary)
    tests/                    import-boundary, adapter, component tests
packages/
  core/                       nuxt-ui-genui-core — Zod schemas, types, component specs (zod-only)
docs/
  architecture.md             Architecture decisions and boundaries
.github/workflows/ci.yml      Frozen install + typecheck + test + build
```

See [docs/architecture.md](docs/architecture.md) for the architecture decisions and boundaries.

## License

MIT — see [LICENSE](LICENSE).
