# @nuxt-ui-genui (alpha, full-parity phases complete)

Generative UI framework for Nuxt 4 — OpenUI Lang in, allowlisted Nuxt UI 4 components out. Powered by `@openuidev/vue-lang` (0.4.x). Generated Nuxt field SFCs wrap their control in `UFormField` (with `eager-validation` so post-submit errors clear while typing); `Form.vue` renders Nuxt UI `UForm` with a custom Standard Schema in `form-schema.ts` wrapping lang-core structured validators (`:transform="false"`, empty `validate-on` before first submit, `validate-on-input-delay="0"`). See `docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md`.

**Alpha: not published.** This is an in-development framework; the packages under `@nuxt-ui-genui/*` are not released to npm and the API is unstable.

## Workspace layout (six projects)

- `apps/playground` — **AI Operations Center** reference app: host-owned console chrome, chat over Nuxt UI `UChatPalette`, live Gemini Lite (`gemini-3.5-flash-lite`) OpenUI Lang programs by default with an opt-in deterministic mock (`GENAI_MOCK=1`), server-authorized `submit_form` round trip into a JSONL audit log (`/api/operations`), custom `WeatherCard` example. See `docs/superpowers/specs/2026-11-11-nuxt-genui-full-parity-design.md`.
- `packages/core` (`@nuxt-ui-genui/core`) — server-safe adapter seam: library creation, Zod 4 schema validation, system-prompt generation, OpenUI Lang key-order contract
- `packages/components` (`@nuxt-ui-genui/components`) — built-in allowlisted component definitions, helpers, and Vue SFCs (`./sfc` barrel); Chart wraps `@nuxt/ui`'s `UChart` (TanStack Charts); DataTable uses positional matrix rows. Includes the expanded Phase A display/feedback and Phase B display-only chat wrappers — see `docs/nuxt-ui-expanded-components.md` for contracts and exclusions. The approved subset is not published and is not release-ready. Ships a real `dist` build (mkdist: TS + compiled `.vue` SFCs with `.vue.d.ts`), so the root entry stays Nuxt-free and a plain Vue host can build a library from it.
- `packages/nuxt` (`@nuxt-ui-genui/nuxt`) — Nuxt module: registers the `<NuxtGenUI>` auto-component (client-only Renderer wrapper). Module options under the `genui` key: `componentName` (rename the auto-imported component) and `registerComponent` (set `false` to import `<NuxtGenUI>` manually from `@nuxt-ui-genui/nuxt/runtime`). Also ships the **Vue plugin** (`@nuxt-ui-genui/nuxt/vue-plugin`): `createGenUI()` registers a global `<GenUIRenderer>` for plain Vue 3 hosts (Laravel + Inertia, Vue SPA) — the host supplies its own renderers, because the built-in ones import `@nuxt/ui` and need a Nuxt build.
- `packages/chat` (`@nuxt-ui-genui/chat`) — **framework-agnostic** chat client: `createGenUIChat` (own transport seam, no AI SDK), message/parts helpers, and the server-side stream helpers it builds on; ships a `dist` build.
- `packages/ai-sdk` (`@nuxt-ui-genui/ai-sdk`) — **optional** Vercel AI SDK adapter (`streamGenUI` / `streamGenUIText` with `live` fully injected (`apiKey`, `baseURL`, `model`) — the adapter reads no `process.env` — plus `createAIChat` for AI-SDK hosts); ships a `dist` build. The `GENAI_*` env resolvers are a playground convention in `apps/playground/server/utils/genai.ts`, not part of this adapter's contract.

## Status (2026-11-15, coverage map)
- **vue-lang 0.4.2 / lang-core 0.4.1 surface now forwarded or consumed** (`<NuxtGenUI>` and the plain-Vue `<GenUIRenderer>`): `toolProvider`, `queryLoader`, `onStateUpdate`, `initialState`, `onParseResult`, `onUnresolved`/`onOrphaned` (split from upstream `meta.unresolved` / `meta.orphaned`). `Button` forwards evaluated `Action([@Set(...)])` plans (`{ steps: [...] }`) intact so in-program state actually updates. System prompt tool teaching via `promptOptions.tools/toolCalls/bindings`. Form rules are validated by a custom Standard Schema (`form-schema.ts`) wrapping lang-core's `parseStructuredRules` / `validate` (with a local `required` wrapper that preserves the unchecked-boolean error). `Form.vue` renders Nuxt UI `UForm` (`:transform="false"`, empty `:validate-on` before first submit, `:validate-on-input-delay="0"`) and generated field SFCs wrap their control in `UFormField eager-validation`, so post-submit visible errors clear while typing. `library.toJSONSchema()` is exposed by `createGenUILibrary` / `createNuxtUILibrary`. Still not used: `useIsQueryLoading` (hosts may compose their own), upstream `createFormValidation`/`provideFormValidation`/`useFormValidation`, and Lang 1.0 (server/client/cloud) is still React-only — upstream vue-lang has no 1.0 either.
- Full-parity phases C–F + wave 2 + date/file wave implemented and verified per `docs/superpowers/specs/2026-11-11-nuxt-genui-full-parity-design.md` and `docs/superpowers/plans/2026-11-11-nuxt-genui-full-parity.md`: **forms** (Form + fields), **stateful display**, **self-contained overlays**, the **AI Operations Center** reference app, `@nuxt-ui-genui/chat` (framework-agnostic chat client + transport seam), and `@nuxt-ui-genui/ai-sdk` (optional Vercel AI SDK adapter: `streamGenUI`/`streamGenUIText` with fully injected `live` options; the playground owns its `GENAI_*` env resolvers).
- **71 built-in defs.** Model-facing allowlist covers: display (Card family incl. **Stats** (responsive KPI grid: `Stats([...StatsCard])`, 2 columns narrow / 4 wide via container query) and StatsCard, TextContent, Alert, Badge, Progress, **ProgressGroup** (segmented progress bar, inline items, display-only), Accordion, Avatar(+Group), Banner, Chip, Collapsible, Empty, Kbd, Separator, Skeleton, User, Tooltip (Nuxt UI `UTooltip`, needs the host `UApp` provider), Marquee, Calendar (local display-only selection), Listbox (local selection list), **Carousel** (card-like slide children, arrows/dots navigation, display-only), **ScrollArea** (vertical/horizontal scroll viewport, Card-legal children, optional shadow, display-only), **Splitter** (horizontal/vertical resizable panels, one Card-legal child per panel, optional `autoSaveId`, display-only)), data (DataTable positional (+ opt-in `striped`), **Table** (UTable-backed, inline object rows keyed by `accessorKey`, striping via a component-level style rule), Chart, Pagination, Timeline, Stepper, Tabs, Breadcrumb, NavigationMenu, Tree), forms (Form + Input, Textarea, InputNumber, InputRating, Select, **SelectMenu** (single-select suggestions), **InputMenu** (free-text input with suggestion menu), Checkbox, **CheckboxGroup**, RadioGroup, Switch, Slider, PinInput, InputTags, ColorPicker, InputDate/InputTime (ISO), FileUpload (host-supplied uploader; values carry metadata refs only)), feedback (Alert/Banner/Skeleton/Empty), actions (Button, Buttons, Toast (click shows a host toast under UApp; display/notification only)), chat display-only (ChatPalette/Message/Messages/Reasoning/Shimmer/Tool, host-selected root only), and overlays (Modal, Slideover, Popover, Drawer, CommandPalette, DropdownMenu, ContextMenu).
- **Table vs DataTable (decided and implemented):** `Table` = Nuxt UI `UTable`/TanStack path for inline object rows (`{ accessorKey, header }` columns) - richer engine, object wire contract. `DataTable` = hand-rolled positional `(string|number)[][]` matrix with custom alignment - frozen existing contract. Both coexist; `striped` on both. **InputMenu** implemented (2026-11-15) as a free-text field with an inline suggestion menu (`mode="combobox"`); it was earlier deferred over type-surface uncertainty, resolved once `UInputMenu` was available and wrapped.
- **Host-owned, intentionally NOT model-facing:** App/Theme/Main/Container/Page*/Dashboard*/Sidebar/Header/Footer*, Pricing*/Blog*/Changelog*, Prose*/Content*/ColorMode*/LocaleSelect, Editor* (tiptap), AuthForm, Error, free-form Link/navigation, FieldGroup, Table/UTable (positional `DataTable` is the approved model-facing data grid - append props, never reshape), command-palette global search wiring, localStorage-persistent chrome, imperative `useOverlay` APIs.
- Files: the library never talks to a server on its own. A host that wants model-facing `FileUpload` fields calls `provideGenUIUploader({ upload })` (from `@nuxt-ui-genui/components/upload`) anywhere above the renderer; without it the file control renders disabled. The playground wires it to `/api/operations/upload` — multipart, `.data/uploads/<uuid>`, 2MB cap, ≤4 files, MIME allowlist (png/jpeg/webp/pdf/text), extension derived from validated MIME (never client filename), returns `{ id, name, size }` refs. Contents never reach the model and never ride `submit_form` — only refs in values.
- Honest limits: the Vue OpenUI renderer is **pre-1.0 (Lang 0.x)** - Lang 1.0 prompt/server/client and this library must upgrade together. **SSR verified NOT to work (2026-11-11 spike, `packages/nuxt/test/ssr.test.ts`):** `@openuidev/vue-lang`'s `<Renderer>` emits an empty wrapper under `renderToString` (no hydrated content; an SFC probe with zero Nuxt UI dependencies renders nothing either) - SSR is impossible upstream today, not just under our wrappers; `ssr: false` stays. **LIVE is the default (2026-11-12):** with `GENAI_API_KEY` (or `THESYS_API_KEY`) set in `apps/playground/.env` the route calls the model — default endpoint `GENAI_BASE_URL=http://127.0.0.1:8317/v1` (a generic local OpenAI-compatible gateway), default model `GENAI_MODEL=gemini-3.5-flash-lite`. The deterministic static programs are **opt-in only** (`GENAI_MOCK=1`, legacy `GENAI_LIVE=0`) and win over a configured key; with neither a key nor the mock the chat route answers **503** ("Live model not configured") instead of silently serving demo data. A Nitro startup plugin (`apps/playground/server/plugins/env.ts`) loads `apps/playground/.env` when the key is not already in the environment, so a production `node .output/server/index.mjs` start does not degrade to the mock. The UI badge shows `live · <model>`, `mock · deterministic` or `not configured`. The deterministic path is `MockLanguageModelV3` streaming keyword-picked Lang programs and is **not AI**. Nothing is published; hosted-provider verification requires your key and is not claimed.
- Form rules use a custom Standard Schema (`packages/components/src/form-schema.ts`) wrapping lang-core's `parseStructuredRules` / `validate`; only scalar `false` gets a local `requiredValidator` wrapper, preserving the documented unchecked-checkbox behavior and `Required` message. `Form.vue` renders Nuxt UI `UForm` with `:transform="false"`, `:validate-on="submittedOnce ? ['input','blur','change'] : []"` (no validation messages before first submit; `submittedOnce` flips on the first `@error`) and `:validate-on-input-delay="0"`; generated field SFCs render `UFormField eager-validation` (required, because Nuxt UI's `deferInputValidation` would otherwise prevent a surfaced error from clearing while typing). `createGenUILibrary` inherits and exposes upstream `library.toJSONSchema()`; external tooling can build an OpenUI parser from the same library spec.
- Defs split DONE: `packages/components/src/defs.ts` is the assembler (unions + `ALL_DEFS`); definitions live in `defs/{base,forms,stateful,overlays,display}.ts` re-exported to the same public surface. `ChatChildUnion` is defined in `defs/base.ts` (ChatPaletteDef `z.lazy` ref). Delete order kept frozen; the root suite is green - 235 tests in 43 files (core 30, ai-sdk 9, chat 28, server 16, components 61, chat-ui 3, nuxt 88).
- **Library hardening (2026-11-12, after a code review):** model-authored markdown is rendered by `renderMarkdown` (`@nuxt-ui-genui/components/markdown`) and now **fails closed** — without a DOM (SSR/Node) DOMPurify reports `isSupported === false` and returns its input unchanged, so the helper escapes the source instead of emitting raw HTML; in a browser it renders markdown and strips scripts/`onerror`. `actionSchema` no longer lets the catch-all branch swallow builtin actions (`{ type: 'open_url' }` without a `url` is rejected). `packages/chat` types its transport options properly (`credentials?: RequestCredentials`, `headers?: Record<string, string> | Headers`) instead of casting to `never`. `packages/ai-sdk` logs upstream stream errors server-side and streams a generic message instead of the raw provider error.- **Streaming render contract (fixed 2026-11-12):** the renderer reuses the same SFC instance and patches its props while a program streams. Every SFC therefore reads `props.props` through `computed(() => props.props ?? {})` (`p.value.x` in script, `p.x` in template). A setup-time snapshot (`const p = props.props`) froze the first, empty `children` array and produced the "Card header with an empty body until reload" bug. Do not reintroduce snapshots.
- **Form contract (2026-11-12):** `submit_form` actions carry `formName` (the form id) and a scoped `formState`; `required` rejects an unchecked boolean (a `false` checkbox is not "present"); a cleared `InputNumber` stays cleared instead of silently becoming `0`; a validation error disappears as soon as the value becomes valid (typing never raises a new error); a field rendered outside a `Form` is inert and says so instead of silently dropping its value; field props are read through a getter (`useGenUIField(() => p.value)`), so a field the renderer renames mid-stream is registered under the new name and the old name is never submitted.
- **Component parity pass (2026-11-12, after the SFC audit):** date bounds are passed as Nuxt UI's `minValue`/`maxValue` (`InputDate`, `Calendar`); `Table` striping uses a component-level `genui-striped-table` class that shades even rows via CSS (`UTable` has no `striped` prop); `Button` always forwards the whole action (`url`, `context`, `params`) to `triggerAction`, so the host sees every action and `<NuxtGenUI>` owns opening `https:` URLs; `Tooltip` uses Nuxt UI's `UTooltip` instead of a native `title`; `Avatar`/`Chip` read their props reactively; `Tabs`/`Modal`/`Slideover`/`Drawer` react to `defaultIndex`/`defaultOpen` changes; `Stats`/`Buttons` only render their documented child types; `StatsCard` renders a `flat` trend as neutral; `DataTable` columns use the def's `left|center|right` enum; `AvatarGroup` reports the real overflow count; and a `submit_form` action carries the live form values in `formState`.
- **Hardening pass (2026-11-15, after the second code review):** a form now submits **only the fields that are children of that form right now** — a field the renderer replaces, or a form the renderer re-points at another program, can no longer leak its value into the payload or into the `formState` of the action (the mirrored values are dropped from the renderer store when the field or the form goes away). The Vue plugin ships **compiled JS** (`dist/runtime/plugin.js` imports `GenUIRenderer.js`, never a raw `.vue`), so a plain Vite host works without `optimizeDeps.extensions`; `<NuxtGenUI>` and `<GenUIRenderer>` share one `open_url` bridge. Every package carries `license`, `description`, `keywords`, a `LICENSE` file and a README, and the optional peers (`nuxt`, `@nuxt/ui`) are marked optional so a plain-Vue host does not drag Nuxt in. Attachments travel as `data:` URLs (a provider cannot read a `blob:` URL) and the upload route rejects an oversized request before it reads the body. The transcript is written to localStorage debounced, not once per streamed chunk. The Nuxt test suite got a 30 s per-test budget and a `ResizeObserver` stub, so it no longer flakes when 17 files run in parallel. Every container that accepts a fixed set of children (`Stats`, `Buttons`, `ChatPalette`, `Form`) now drops a child that is not a component at all, so plain text cannot land in a card grid or a button row.
- **Packaging pass (2026-11-13):** every package publishes a real build instead of raw source. `packages/core` (unbuild) and `packages/nuxt` (`nuxt-module-build`) already did; `packages/components` now builds with mkdist (`dist/index.js` plus compiled `.vue` SFCs with `.vue.d.ts`), `packages/chat` and `packages/ai-sdk` with unbuild (`dist/index.js`). Every `exports` map points at `dist` and `files` is `["dist"]`, so `npm pack` ships only the build (components: 229 files, 29.9 kB packed; nuxt: 15 files including `dist/runtime/plugin.js`). **The playground consumes the built packages, not the sources** — so `pnpm dev` builds the packages first and the playground production build is what proves the packaging. A new export `@nuxt-ui-genui/nuxt/vue-plugin` (`createGenUI()`) registers a global `<GenUIRenderer>` for plain Vue 3 hosts; the built-in Nuxt UI renderers stay Nuxt-only (they import `@nuxt/ui`), so a plain Vue host passes its own renderers to `createNuxtUILibrary({ renderers })`.

## Using the library

**Nuxt 4 host** — install the module and use the auto-imported `<NuxtGenUI>`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({ modules: ['@nuxt-ui-genui/nuxt', '@nuxt/ui'] })
```

```vue
<script setup lang="ts">
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import * as sfc from '@nuxt-ui-genui/components/sfc'

const library = createNuxtUILibrary({ ...sfc })
</script>

<template>
  <NuxtGenUI :library="library" :response="program" :is-streaming="streaming" @action="onAction" />
</template>
```

**Plain Vue 3 host** (Laravel + Inertia, a Vue SPA) — use the Vue plugin and pass your own renderers:

```ts
import { createApp } from 'vue'
import { createGenUI } from '@nuxt-ui-genui/nuxt/vue-plugin'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import MyCard from './MyCard.vue'

const library = createNuxtUILibrary({ renderers: { Card: MyCard } })

createApp(App).use(createGenUI()).mount('#app')
```

```vue
<!-- <GenUIRenderer> is registered globally by the plugin -->
<GenUIRenderer :library="library" :response="program" @action="onAction" />
```

The built-in Nuxt UI renderers (`@nuxt-ui-genui/components/sfc`) import `@nuxt/ui` components, so they only work inside a Nuxt build; a plain Vue host supplies its own renderers. The OpenUI Vue renderer is client-only upstream (SSR renders an empty wrapper) — render it on the client.

### Live data, state and parse hints

Both renderers expose the upstream `v0.4.2` API:

- `toolProvider` — a record of `ToolName: (args) => Promise<unknown>` (or an `McpClientLike`) that lets a program call live tools from `Query("tool_name", args, defaults)` / `Mutation(...)`. Without it, a program calling `Query()` renders the defaults only.
- `queryLoader` — optional host component shown while any query resolves; upstream ships a built-in spinner (top-right), and the content wrapper dims to 70% opacity.
- `initialState` — seed dashboard/counter `$state` (`{ $count: 42 }`); a program may declare `$count = 0` and `TextContent("Count: " + $count)` — the host seed wins.
- `onStateUpdate(state)` — fires when any `$state` changes; wire it to a host store. Note it does **not** fire on mount.
- `onParseResult(result)` — full parse payload; `result.meta { incomplete, statementCount, errors, unresolved, orphaned }`.
- `onUnresolved(names)` / `onOrphaned(names)` — convenience callbacks for `meta.unresolved` (references used but not yet defined, dropped as null) and `meta.orphaned` (dead statements defined but never reachable from root; excludes `$state`, `Query`, `Mutation`). The dev overlay in `<NuxtGenUI>` surfaces all three lists.
- Action plans in props (e.g. `Action([@Set($count, $count + 1)])`) arrive at components as `{ steps: [...] }` and are forwarded intact by `Button`; passing plain `{ type, params }` actions still behave as before.

For parser tooling, both library factories expose the upstream `library.toJSONSchema()` (a `LibraryJSONSchema` keyed by component name in `$defs`), so a host can build its own `createParser(library.toJSONSchema(), library.root)` without reimplementing Zod-to-schema.

```vue
<NuxtGenUI
  :library="library"
  :response="program"
  :is-streaming="streaming"
  :tool-provider="toolProvider"
  :on-state-update="onStateUpdate"
  @action="onAction"
/>
```

### Prompt options

`createNuxtUILibrary({ promptOptions })` (and `createGenUILibrary({ promptOptions })`) store options on the library; `generateGenUISystemPrompt(library, options)` merges them shallowly with an explicit argument. Explicit values win, and array fields such as `examples` are **replaced, not concatenated** — passing `examples: ['one']` discards any stored examples. Non-overridden stored fields survive. The `cloud` flag is stripped from the options on the local path and removed from the library spec on the cloud path.

## Integrations (no AI SDK required)

OpenUI is an open standard with many backends, so **the framework does not depend on the Vercel AI SDK**. `@nuxt-ui-genui/core`, `/components`, `/nuxt` and `/chat` import no AI SDK code at runtime; the AI SDK lives only in the optional adapter `@nuxt-ui-genui/ai-sdk`.

**The client speaks plain OpenUI Lang text.** `createGenUIChat` posts the conversation to an endpoint and reads the response as text — `text/plain`, `text/event-stream` (SSE) or `application/x-ndjson` are all read as text chunks, so any agent backend can answer:

```ts
import { createGenUIChat } from '@nuxt-ui-genui/chat'

const chat = createGenUIChat({ api: '/api/chat' })
chat.sendMessage({ text: 'show me the Q4 KPIs' })
```

**The backend is your choice.** Point the client at a route that streams the OpenUI Lang program. If you already run an agent framework, hand the client a transport instead of an endpoint:

```ts
import { createGenUIChat, type GenUITransport } from '@nuxt-ui-genui/chat'

const langGraphTransport: GenUITransport = async ({ messages, signal }) => {
  const run = await myAgent.stream(messages, { signal })   // LangGraph, Google ADK, Mastra, AG-UI, …
  for await (const chunk of run) yield chunk                  // OpenUI Lang text
}

const chat = createGenUIChat({ transport: langGraphTransport })
```

Server side, `@nuxt-ui-genui/core` ships the wire helpers the adapters share: `responseTextChunks(response)` (plain / SSE / NDJSON), `toTextStreamResponse(chunks)` (serve plain-text OpenUI Lang) and `extractDelta(payload)`.

**Vercel AI SDK hosts** use the optional adapter — it is never required:

```ts
// server: the AI SDK speaks the UI-message-stream protocol…
import { streamGenUI, streamGenUIText } from '@nuxt-ui-genui/ai-sdk'
return streamGenUIText({ systemPrompt, messages, live })   // plain text
return streamGenUI({ systemPrompt, messages, live })       // AI SDK UI-message-stream
```

```ts
// client: the AI SDK's own Chat class, if that is what the host uses
import { createAIChat } from '@nuxt-ui-genui/ai-sdk/chat'
```

**One Nuxt UI caveat:** Nuxt UI's chat components (`UChatMessages`, `UChatPrompt`, …) are typed against the AI SDK's `UIMessage`. `GenUIMessage` mirrors that shape exactly (`id`, `role`, `parts[]` with `text`/`reasoning`/`file` parts and `state: 'streaming' | 'done'`), so the transcript can be handed to them unchanged; only the type identity differs, so a host crosses that boundary with one cast. The playground does exactly that — and imports nothing from `ai` in its app code.

## Demo

- Dev server: `pnpm --filter playground dev` → http://localhost:3000
- **Live by default:** the chat route calls the configured model (`GENAI_API_KEY` / `THESYS_API_KEY`, endpoint `GENAI_BASE_URL`, default `http://127.0.0.1:8317/v1`; model `GENAI_MODEL`, default `gemini-3.5-flash-lite`). `THESYS_API_KEY` is only ever used as the fallback value of the API key variable — it is never sent to Thesys unless you also set `GENAI_BASE_URL` to a Thesys endpoint yourself.
- **Deterministic demo (opt-in):** run with `GENAI_MOCK=1` (legacy `GENAI_LIVE=0`) to serve fixed OpenUI Lang programs streamed through the same `streamText` path (via `MockLanguageModelV3`). It makes **no network calls**, is **not AI**, and the output is identical on every run.
- **No key and no mock:** the chat route answers **503** with a message telling you to set `GENAI_API_KEY`/`GENAI_BASE_URL`/`GENAI_MODEL` or run with `GENAI_MOCK=1`. The playground never silently falls back to static data.
- **Chat protocol:** `POST /api/chat` answers with **plain OpenUI Lang text** by default (what `@nuxt-ui-genui/chat` reads). Add `?format=ui-stream` to get the Vercel AI SDK's UI-message-stream protocol instead — the same server route, the same provider, the other wire format.
- The live provider path is **unverified** against any hosted provider (Thesys included); only a generic local OpenAI-compatible gateway has been exercised.

## Requirements
- Node.js 20.19+ (or >=22.12), pnpm 9+ (verified with Node v26.12.1 / pnpm 10.25.0)
- `OPENUI_TELEMETRY_DISABLED=1` recommended (silences lang-core install telemetry). All repo commands should be run with it set, e.g. `OPENUI_TELEMETRY_DISABLED=1 pnpm install`.

## Commands
- `pnpm install`
- `pnpm build` — topological build of all packages (`pnpm -r`), playground included
- `pnpm build:packages` — build only `packages/*` (skip the playground)
- `pnpm typecheck`
- `pnpm test` — builds the packages first, then runs every package's tests (the nuxt tests import the **built** components)
- `pnpm dev` — builds the packages, then starts the playground at http://localhost:3000
