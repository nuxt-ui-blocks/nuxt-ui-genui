# Architecture decisions

## Product boundary

The project ships two experiences on one engine:

1. **Generative UI runtime** — component registry, schema/prompt contract, streamed OpenUI Lang parsing/rendering, action bridge and transport-neutral types.
2. **Chat UI** — optional conversational components and composables that host generated UI as one assistant message content type.

Neither layer owns the user's business logic or privileged operations.

## Dependency direction

```text
Application
  ├── Chat UI (optional)
  │     └── Core public API
  ├── Nuxt integration
  │     ├── Core public API
  │     └── OpenUI Vue adapter
  ├── Nuxt UI component registry
  │     ├── Core public API
  │     └── @nuxt/ui
  └── Provider adapter (optional)
        └── Core transport contract
```

The core must not depend on Nuxt, Nuxt UI, Vue SFCs, or a specific model vendor. The Nuxt integration may depend on Vue and the OpenUI Vue adapter. The Nuxt UI registry is an optional preset, not a hard requirement for custom registries.

## OpenUI boundary

Use `@openuidev/vue-lang` internally for the first implementation. Wrap its `createLibrary`, `defineComponent`, `Renderer`, `ActionEvent`, and error types behind project-owned interfaces. Do not expose the upstream library object as the long-term public API.

The current Vue integration is documented as 0.4.x. It supports schema-driven Vue components, prompt generation, streaming response rendering, action callbacks, state updates, query/tool providers and parse errors. It does not yet expose all OpenUI Lang 1.0 features documented for the React renderer. Avoid depending on unavailable features.

## Registry model

Each registered component has:

- stable public name;
- human-readable description for model prompting;
- Zod input schema;
- Vue renderer (client-side only);
- optional category and capability metadata;
- optional action declarations, subject to server authorization.

The first MVP uses a single `SalesDashboard` root component as a vertical slice. The generic registry API is deliberately deferred until the integration has a passing test.

## Server/client split

- Shared schemas and serializable component metadata may be imported by both server and client.
- Vue SFCs and the OpenUI Vue `Renderer` belong in the client bundle.
- Nitro routes must not import the Vue library or any `.vue` file.
- Server-side prompt generation should use the serializable schema definitions and `@openuidev/lang-core` when the real model adapter is introduced.

## Model transport

Define a project-owned adapter contract rather than coupling the core to Vercel AI SDK. The first adapter can use Vercel AI SDK, while direct provider integrations remain possible.

A transport should deliver:

- assistant text/OpenUI Lang chunks;
- completion and abort signals;
- normalized provider errors;
- optional usage and request metadata.

The renderer consumes accumulated OpenUI Lang text. The chat layer owns message lifecycle, cancellation and conversation history. The transport must not import Vue components.

## Interaction and security

Generated UI is presentation plus structured intent, not executable code.

- Never evaluate generated JavaScript, HTML templates or Vue source.
- Only components in the active registry can render.
- Validate all model-provided props against their schemas.
- Local presentation state may be handled in the client.
- Conversational actions become ordinary user turns.
- Application mutations go through server-side tools with authentication, authorization, validation, idempotency where appropriate, and explicit confirmation for destructive/high-impact actions.
- Tool credentials and privileged logic never enter the browser bundle.

## Compatibility

Initial support target: Nuxt 4, Nuxt UI 4, Vue 3.5+, Zod 4, OpenUI Vue Lang 0.4.x. Keep peer dependencies and adapters narrow so future upstream changes are isolated.

## MVP exit criteria

1. A Nuxt 4 app starts with Nuxt UI 4 and the OpenUI Vue renderer.
2. A schema-backed component is rendered from valid OpenUI Lang.
3. Invalid component names and invalid props produce visible, non-fatal errors.
4. The component registry is allowlisted and supports at least one user-defined component.
5. A continuation action is forwarded into the chat composable.
6. A server route can provide the prompt/schema without importing Vue SFCs.
7. At least one integration test covers the renderer and one test covers the server/client import boundary.
