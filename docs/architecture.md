# Architecture decisions

## Product boundary

`nuxt-ui-genui` is an experimental Nuxt UI component library for OpenUI. The repository is a pnpm workspace with two packages: `apps/playground` (the Nuxt 4 playground app) and `packages/core` (`nuxt-ui-genui-core`, framework-independent contracts). Exactly one component is registered today — `SalesDashboard` — shipped as the first vertical slice.

This is not production-ready. There is no published package, no stable API surface, and no commitment to backwards compatibility yet.

## Dependency direction

```text
apps/playground (Nuxt 4 app)
  ├── server routes & server utils ──► nuxt-ui-genui-core
  ├── shared/genui/library.ts (client-only) ──► nuxt-ui-genui-core + Vue SFCs
  └── app/ SFCs & composables
        └── shared/genui/library.ts

packages/core (nuxt-ui-genui-core)
  └── zod only — no Nuxt, no Vue, no Nuxt UI, no @openuidev/vue-lang
```

`apps/playground` depends on `nuxt-ui-genui-core` (`workspace:*`). The core depends on `zod` only. Server and shared code may import core; they must never import the client library (`shared/genui/library.ts`), Vue SFCs, `#components`, `@nuxt/ui`, or `@openuidev/vue-lang`. The client library and all SFCs are client-only.

## OpenUI boundary

OpenUI stays behind project-owned APIs: the client-side `genuiLibrary` and the `/api/genui/chat` route. The upstream renderer (`@openuidev/vue-lang`) is wrapped, not exposed as a permanent public contract.

- Strict component allowlist; only registered components may render.
- Model-generated JavaScript, HTML templates, and Vue source are never evaluated.
- The wire format is OpenUI Lang positional arguments in **Zod property order** (`title, description, metrics, orders`). Changing schema order/shape breaks the wire format; the order is enforced by `packages/core/tests/schemas.test.ts`.
- `@openuidev/vue-lang` stays on 0.4.x. It does not provide OpenUI Lang 1.0 parity, and this project must not assume it.
- `@openuidev/lang-core` is not used in Phase 1.

## Registry model

`componentSpecs` in `packages/core/src/specs.ts` is the single source of prompt/registry metadata (name, description, Zod props schema).

- The client library (`apps/playground/shared/genui/library.ts`) spreads the specs and attaches the matching Vue SFCs via `createLibrary`/`defineComponent`.
- The server system prompt (`apps/playground/server/utils/genuiAdapter.ts`, `buildSystemPrompt`) is hand-built from the same specs and the `SalesDashboardSchema` shape.
- Because both sides derive from core, the prompt, the registry, and the renderer cannot drift apart.

## Server–client split

Enforced by `apps/playground/tests/import-boundary.test.ts`: neither the core package nor the playground server may import Vue SFCs, `shared/genui/library.ts`, `#components`, `@nuxt/ui`, or `@openuidev/vue-lang`.

- `packages/core/src/schemas.ts`, `specs.ts`, and `types.ts` are serializable and safe for server + client.
- Vue SFCs and the OpenUI `Renderer` belong in the client bundle.
- Nitro routes/utils import core only.

## Model transport

The core defines a provider-agnostic adapter boundary: `GenUIAdapterInput` / `GenUIAdapterMessage` / `GenUIModelAdapter` (see `packages/core/src/types.ts`). The first and only implementation lives **in the playground only** (`apps/playground/server/utils/genuiAdapter.ts`): Vercel AI SDK (`ai` + `@ai-sdk/openai`) with OpenAI.

- `OPENAI_API_KEY` and `OPENAI_MODEL` are required; there is no default model. Missing either throws `AdapterConfigError` → HTTP 500.
- Non-streaming `generateText` call.
- The system prompt is hand-built (`buildSystemPrompt`), constraining the model to a single registered component.
- Model output passes boundary validation (`validateUi`) before it reaches the client: it must be a single `root = SalesDashboard(...)` statement with exactly 4 positional JSON arguments that parse against `SalesDashboardSchema`.
- Error model: 400 (invalid request body), 500 (missing config / adapter config error), 502 (provider request failed), 422 (model output failed validation).
- There is no repair, retry, or streaming.

`/api/genui/demo` remains as a deterministic offline route that returns a fixed `SalesDashboard` without any model call; `/api/genui/chat` is the client's default transport.

## Interaction and security

Model output is untrusted until it passes the boundary (`validateUi` + Zod parse). Rendering happens only through the strict allowlist; props are schema-validated before render.

- UI actions are requests, not commands. Privileged operations require server-side authorization.
- The system prompt constrains output to a single registered component — prompt-injection resistance is a design goal, not a guarantee, and model output is still validated.
- Destructive operations will require explicit confirmation (future phases).
- Tool credentials and privileged logic never enter the browser bundle.

## Compatibility

Nuxt 4 · Nuxt UI 4 · Vue 3.5+ · Zod 4 (`zod/v4`) · `@openuidev/vue-lang` 0.4.x. Node.js 20.19+, pnpm 9+. Packages are `private`; nothing is published.

## Out of scope (Phases 2+)

- Streaming (token-by-token rendering)
- Agentic tools / tool calling
- npm publishing and release workflows
- Additional packages beyond `core` and the `playground` app
- Vue/Vite/Inertia entrypoints outside the Nuxt integration
- A docs site
- Motion integration (nuxt-motion-block consuming GenUI later)
