# Nuxt UI GenUI — MVP scaffold

An experimental Nuxt 4 + Nuxt UI 4 generative UI framework using OpenUI Lang's Vue renderer.

## Current scope

- OpenUI Lang Vue renderer integration (`@openuidev/vue-lang`).
- A small Nuxt UI-backed `SalesDashboard` component.
- Zod schemas kept in a serializable shared module.
- A chat composable with a transport boundary.
- A deterministic demo API route so the UI can be tested without an API key.

**Important:** the demo route is not an LLM. It returns a fixed dashboard as OpenUI Lang text. The provider adapter and true token-by-token streaming are the next implementation layer. Do not treat this scaffold as production-ready.

## Requirements

- Node.js 20.19+ (or a compatible current LTS)
- pnpm 9+

## Run

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Nuxt.

## Architecture

```text
app/
  components/genui/     Vue renderers backed by Nuxt UI
  composables/          Chat state and transport orchestration
  pages/                Playground application
shared/genui/
  schemas.ts            Zod schemas safe to import on server and client
  library.ts            OpenUI Vue library (client-only SFC dependency)
server/api/
  genui/demo.post.ts    Deterministic demo transport
```

The server route imports only `shared/genui/schemas.ts`; it must not import `library.ts` or Vue SFCs. In a real provider integration, generate the system prompt server-side from the same serializable component definitions using `@openuidev/lang-core`, then stream model output to the client.

## Key implementation constraints

1. Keep OpenUI behind our own public APIs; do not expose its renderer types as the framework's permanent contract.
2. Keep schemas serializable and shared. Keep Vue component imports in the client bundle.
3. Use a strict component allowlist. Never evaluate model-generated JavaScript or Vue templates.
4. Treat UI actions as requests. Privileged operations must be authorized and validated by server-side tools.
5. The OpenUI Vue renderer is currently 0.4.x. Its API/features do not fully match the React renderer's OpenUI Lang 1.0 feature set.

## Current MVP limitations

- The demo API returns a single fixed dashboard; prompt content only appears in the description.
- The example is not yet true token streaming.
- No model provider or AI SDK is installed yet.
- The `SalesDashboard` schema is the first vertical slice, not the final generic registry API.
- Automated tests and package extraction into the planned monorepo are not yet included.

## Planned next engineering milestones

1. Verify the OpenUI component schema syntax against the pinned Vue Lang version and add a renderer integration test.
2. Extract `core`, `nuxt`, `components`, `chat`, and `ai-sdk` packages into a pnpm workspace once the first vertical slice is stable.
3. Add a provider-neutral `GenUIModelAdapter` contract and a Vercel AI SDK adapter.
4. Implement true incremental OpenUI Lang streaming and parse/error states.
5. Add registry extension, component permissions, action confirmation, and examples.
