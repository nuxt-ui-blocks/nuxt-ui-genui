# Nuxt UI GenUI — Phase 2: Streaming and Hardening — Design

**Status:** approved 2026-11-08 — user approved the spec and the four review decisions below (recommended options). Implementation may proceed per the rollout (§12).
**Date:** 2026-11-08 (amended same-day: demo UI adopts Nuxt UI AI chat components; see §5; Q1–Q4 resolved and §9 duplicate criterion removed at approval)
**Spec path:** `docs/superpowers/specs/2026-11-08-nuxt-ui-genui-phase-2-design.md`
**Phase 1 spec (baseline, do not edit):** `docs/superpowers/specs/2026-11-08-nuxt-ui-genui-design.md`
**Phase 1 plan (baseline, do not edit):** `docs/superpowers/plans/2026-11-08-nuxt-ui-genui-plan.md`

## 1. Context

Phase 0/1 are implemented, live-tested, pushed to `github.com/nuxt-ui-blocks/nuxt-ui-genui` (branch `main`, 26 commits), and CI-green (run #42469268827). What exists today in `apps/playground`:

- `POST /api/genui/demo` — deterministic, offline, non-streaming (kept).
- `POST /api/genui/chat` — model-backed, **non-streaming** (`generateText`), boundary-validated (`validateUi`), error model 400/500/502/422. Required env: `OPENAI_API_KEY` + `OPENAI_MODEL` in `apps/playground/.env` (Nitro reads `.env` only from the playground rootDir). Verified live with `gemini-3.5-flash-lite` via a local gateway.
- `useGenUIChat` — `$fetch` of `{ ui, meta }`; `isStreaming` is a spinner state only; the OpenUI Lang arrives complete.
- `GenUIRenderer.vue` — `Renderer` with `isStreaming` prop already wired (`:is-streaming`); client emits `onError(errors)`; `index.vue` joins `errors.map(e => e.message)` into `renderError`, banner renders `renderError ?? error`.
- `useGenUIChat` — `$fetch` of `{ ui, meta }`; `isStreaming` is a spinner state only; the OpenUI Lang arrives complete. The demo UI is hand-rolled (plain textarea + button); Nuxt UI ships dedicated AI chat components (`UChatMessages`, `UChatPrompt`, `UChatPromptSubmit`, `UChatPalette` — `category: 'chat'`) and an official **Chat template** (`nuxt-ui-templates/chat`, preview chat-template.nuxt.dev) — both currently unused here.
- `packages/core` — zod-only; `ChatRequestSchema` lives in `server/utils/genuiAdapter.ts` (**not** core); wire format = positional args in Zod property order; client/server boundary test + key-order test enforced.
- `@openuidev/lang-core@0.4.1` exposes `createStreamingParser` (verified present in installed dist). `ai@7.0.165` `streamText` exposes `textStream` (verified). vue-lang `Renderer` handles partial Lang when `isStreaming` is true.

Deferred from Phase 1 review: F7 (`renderError` not cleared on action-triggered turns), client-forwarded `system` messages reaching the provider, missing `@iconify-json/lucide` (Nuxt icon warning).

## 2. Goals

1. **True end-to-end streaming**: model tokens flow `streamText` → owned SSE protocol → client reader → `assistant.ui` ref appended incrementally → OpenUI Vue `Renderer` with `isStreaming=true` renders progressively.
2. **Boundary stays authoritative**: the stream emits raw chunks freely (untrusted, allowlisted at render time), but nothing is treated as valid until the terminal verdict. On invalid output the client replaces the UI with the existing error banner + Zod issues. No repair, no retry — ever.
3. **Demo UI on Nuxt UI AI components**: replace the hand-rolled chat UI in `app/pages/index.vue` with `UChatMessages` + `UChatPrompt` + `UChatPromptSubmit` (+ `UChatMessage` styling via the `user`/`assistant` props), laid out per the official **Nuxt UI Chat template** (`nuxt-ui-templates/chat`, preview at chat-template.nuxt.dev) — but without cloning it (no auth, no persistence, no Comark markdown; see §3/§11). Transport stays owned (Q4).
4. **Hardening**: server rejects client-supplied `system` messages with 400; drop `allowSystemInMessages`; suppress transient render-error banner flicker during streaming; fix F7; add the icon set.
5. Docs reflect reality (README / architecture / AGENTS).

## 3. Non-goals (explicit)

- No automatic repair/retry of model output. Ever.
- No agentic tool loop, tool confirmation flows, privileged actions.
- No publishing/release automation, module extraction, motion/AI-components integration.
- No new packages, no `lang-core` app imports (transitive only via vue-lang, as today).
- Demo route stays non-streaming.
- No `streaming` claim in UI copy beyond what is real.
- **No adoption of `@ai-sdk/vue` `useChat` / AI SDK `UIMessage` stream protocol** (Q4 Option B); the owned SSE transport stays. UChatMessages is fed UIMessage-*shaped* objects built by our composable.
- **No cloning of the Chat template**: no GitHub auth, no Postgres persistence, no `@comark/vue`/markdown rendering (assistant text renders as plain text; markdown is a later phase), no sidebar/history/settings surfaces.

## 4. Transport design — owned SSE (decision recorded, open question Q1)

`/api/genui/chat` switches from `generateText` to `streamText` and responds with `text/event-stream` via h3 `createEventStream(event)`. Wire protocol (owned, versioned implicitly by the single client):

```text
event: chunk
data: {"text": "root = Sales"}

event: chunk
data: {"text": "Dashboard(\"…\""}

event: done
data: {"ok": true, "ui": "<canonical, fence-stripped OpenUI Lang>", "meta": {"mode": "chat", "model": "<OPENAI_MODEL>", "validated": true}}

```
or the failure terminal:

```text
event: error
data: {"ok": false, "issues": ["…"], "reason": "boundary" | "provider" | "config"}

```

Rules:

- **Before streaming begins** (body invalid → 400; missing env → 500; `streamText` creation throws synchronously): plain `createError` response as today. Client handles both shapes (statusCode != 200 → banner).
- **After streaming begins**, failures are terminal `error` frames, never thrown errors. Cases: provider/network failure mid-stream (`reason: "provider"`); boundary failure — server accumulates the full text while streaming, runs existing `validateUi`, and if `ok: false` emits `error` with `reason: "boundary"` and the Zod issues (`ok: true` emits `done`).
- `chunk` frames carry **raw OpenUI Lang text** — no `ui` wrapper, no markdown, exactly what the model emitted (fence handling stays inside `validateUi`).
- The client does not inspect chunk content for control-flow; only `done`/`error` terminate.
- The `done` frame carries the **canonical, fence-stripped `ui` string** (what `validateUi` returned), so the renderer's final input is exactly the validated output, never the raw accumulated chunk text. Raw chunks are for progressive display only; at `done` the client replaces the assistant's `data-genui` part with the canonical `ui`.
- Heartbeat/timeout: none in Phase 2 (local gateway is in-process-adjacent). Noted as known limitation; revisit with hosted deploy.

Why owned over AI SDK `toUIMessageStreamResponse()`: consistent with "OpenUI/provider APIs stay behind project-owned interfaces"; keeps the wire format stable regardless of AI SDK version churn; client parsing is ~40 lines of `fetch` + `ReadableStream` reader. (See Q1.)

Server-side implementation: `server/utils/genuiAdapter.ts` gains `streamUi(input, model?)` alongside `generateUi`; `GenUiModel` gains a stream variant (`(input) => Promise<AsyncIterable<string>>`) so tests never hit the network. `chat.post.ts` selects streaming; `demo.post.ts` untouched. `buildSystemPrompt` unchanged. `ChatRequestSchema` roles → `['user', 'assistant']` (+ `.min(1)`); `allowSystemInMessages` removed.

## 5. Client design

New `app/utils/streamChat.ts` (testable pure-ish helper, no Vue SFCs):

```ts
export type ChatStreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done'; ui: string; meta: { mode: 'chat'; model: string; validated: true } }
  | { type: 'error'; issues: string[]; reason: 'boundary' | 'provider' | 'config' }

export async function streamChat(
  body: { messages: ChatMessage[] },
  onEvent: (event: ChatStreamEvent) => void,
): Promise<void>
```

- Uses `fetch` (not `$fetch`) with `response.body.getReader()`, `TextDecoder`, buffer split on `\n\n`, `event:`/`data:` parse. Throws on non-200 (maps `statusMessage`/`data` like today).

`useGenUIChat` changes:

- State becomes **UIMessage-shaped** (types from `ai`, no `@ai-sdk/vue` import): `{ id, role: 'user' | 'assistant', parts }`. User text → `parts: [{ type: 'text', text }]`. Assistant turns → parts array starting with a text part ("I generated a dashboard interface from the request.") plus, once the stream produces Lang, a **custom data part** `{ type: 'data-genui', data: { ui } }` whose `data.ui` grows per `chunk`.
- Exposes `status: Ref<'submitted' | 'streaming' | 'ready' | 'error'>` derived from the stream lifecycle (`submitted` on send, `streaming` on first chunk, `ready` on `done`, `error` on `error` frame or failure), plus existing `isStreaming`/`error`/`renderError` mapped onto it for compatibility. F7 fix unchanged.
- `sendMessage` appends the user turn + assistant placeholder, calls `streamChat`; `chunk` → append to the assistant's `data-genui` part; `done` → replace the assistant's `data-genui` part with the canonical `ui` from the frame (§4), then `status='ready'`; `error` → `status='error'`, assistant text replaced with the failure copy, `renderError = issues.join('\n')` (or provider/config message).

`app/pages/index.vue` rebuilt on Nuxt UI AI components, modeled on the Chat template's composition (`UChatMessages` + sticky prompt footer), without its auth/DB/markdown:

```vue
<UChatMessages :messages="messages" :status="status" :user="{ ... }" :assistant="{ icon: 'i-lucide-bot' }">
  <template #part="{ part, message, streaming }">
    <div v-if="part.type === 'data-genui'">
      <GenUIRenderer :response="part.data.ui" :is-streaming="streaming" @error="onRendererError" @action="handleAction" />
    </div>
    <!-- text parts fall back to default output (or render plain <p>{{ part.text }}</p>) -->
  </template>
</UChatMessages>
<UChatPrompt v-model="input" :status="status" :error="bannerError" placeholder="Ask me to create a dashboard…" @submit="onSubmit">
  <template #footer>
    <UChatPromptSubmit :status="status" />
  </template>
</UChatPrompt>
```

- **Banner suppression during stream** (unchanged rule, new location): renderer `onError` events arriving while `streaming` are not surfaced; after the terminal verdict, only a non-empty final error set (or `error` frame) shows. Kept in the page-level error handler + composable status, not in `GenUIRenderer.vue`.
- The existing issues banner (`renderError ?? error`) is retained below/above the prompt; it is rendered as a plain alert region (not markdown) when set.
- `UChatPrompt` gets `:error` for inline affordance; `UChatPromptSubmit` renders by `status` (no stop wiring in Phase 2; abort stays out of scope — see §10).

`GenUIRenderer.vue`: unchanged props (already `:is-streaming`). It stays dumb; the suppression logic lives in `index.vue`'s error handler (single source).

Env-missing / 500 / 502 before stream: surfaced through the same catch-all as today (banner shows `statusMessage`).

## 6. Hardening

- `ChatRequestSchema` rejects `role: 'system'` (400). Prompt injection posture: server system prompt is authoritative; client messages are data; OpenUI allowlist + `validateUi` are the render/output gates; no tools exist in Phase 2.
- `allowSystemInMessages: true` deleted.
- `@iconify-json/lucide` added to playground devDependencies (silences Nuxt icon warning).
- `.env` handling unchanged (never committed; `apps/playground/.env` gitignored; `.env.example` stays at repo root with existing comments).

## 7. Testing

- **Unit (no network):** adapter stream tests with an injected mock chunked model — (a) valid stream → chunks + `done`; (b) invalid accumulated output → `error reason: boundary` with issues; (c) model throws mid-stream → `error reason: provider`; (d) env missing → `AdapterConfigError`; (e) `ChatRequestSchema` rejects `role: 'system'` (400 at handler boundary).
- `streamChat` parser test with a mocked `ReadableStream` (chunked SSE bytes, split frames) — valid parse + malformed frame surfaces as error.
- Keep existing 15/15 green (boundary, key-order, smoke tests). Root `pnpm test` stays the gate. CI unchanged (frozen install → typecheck → test → build, Node 24 / pnpm 9).
- Live e2e is manual (local gateway + `gemini-3.5-flash-lite`); not part of CI.

## 8. Docs

- `README.md`: run instructions unchanged; add "chat endpoint streams (OpenUI Lang SSE)" + error model + offline-demo note. Remove "not true token streaming" limitation.
- `docs/architecture.md`: Model transport section — progressive streaming + verdict frame; boundary authoritative at completion; suppression rule during stream.
- `AGENTS.md`: streaming line (owned SSE, terminal verdict), reject-client-system-messages rule, `useGenUIChat`/`streamChat` pointers, icon devDep note.
- This spec travels with the implementation plan.

## 9. Acceptance criteria

1. `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm build` all green; CI green on push.
2. Demo route byte-for-byte unchanged behavior.
3. Live: prompt → dashboard renders **progressively** (title → metrics → orders) via gateway; UI appears before stream completes.
4. Live failure: gateway stopped/key removed → visible banner (provider/config), not silent failure, not rendered garbage.
5. Live failure: model returns garbage (force via prompt injection phrase) → stream completes → banner with Zod issues; nothing privileged executes.
6. `role: 'system'` from client → 400 with clear message.
7. Demo chat UI renders through `UChatMessages`/`UChatPrompt` (no hand-rolled textarea/button); streams progressively; the GenUI dashboard appears as a `data-genui` part in the assistant message.
8. Mid-stream and final `onError` do not flicker the banner while streaming.

## 10. Known gaps / limitations (documented, not hidden)

- No heartbeat/timeout on the SSE connection.
- `createStreamingParser`-based progressive rendering is relied on implicitly through the Vue `Renderer`; not unit-tested against upstream internals.
- Non-`SalesDashboard` components impossible (allowlist unchanged).
- Single-user local demo posture; no rate limiting.
- Assistant text renders as plain text — no markdown/`UChatShimmer`/reasoning parts (template uses Comark markdown; deferred).
- No abort/stop button wiring (`UChatPromptSubmit` renders by status only); disconnecting the tab just stops the reader.
- Chat template (nuxt-ui-templates/chat) was used as layout reference only: no auth, no persistence, no Postgres, no model picker.

## 11. Open questions for spec review — RESOLVED 2026-11-08

User approved this spec ("ok") and accepted the recommended options:

- **Q1 → Owned SSE** (via h3 `createEventStream`), not `toUIMessageStreamResponse()`.
- **Q2 → Reject** client `system` messages with 400 (`ChatRequestSchema` roles = `['user', 'assistant']`), not silently strip.
- **Q3 → Demo route stays non-streaming** (`demo.post.ts` untouched).
- **Q4 → Option A**: owned SSE; `UChatMessages` fed UIMessage-shaped objects (text + custom `data-genui` part); no `@ai-sdk/vue`, no wire-format change. Option B (migrate to `useChat` + AI SDK UI stream) rejected.

## 12. Rollout (for the plan, not this doc)

Adapter stream + mock-model tests → `streamChat` helper + parser test → composable rework (UIMessage-shaped state, `status` lifecycle, F7) → `index.vue` rebuilt on `UChatMessages`/`UChatPrompt`/`UChatPromptSubmit` + `data-genui` part rendering → 400 hardening + icon dep → docs → verify locally + live e2e → commit/push per user instruction.
