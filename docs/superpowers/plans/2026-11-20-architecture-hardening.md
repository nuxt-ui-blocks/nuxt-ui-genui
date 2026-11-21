# Architecture hardening plan (2026-11-20)

Source: architecture review of `sp1-implementation` at `7ef4cae` against
`thesysdev/openui` `packages/*` and its examples catalog. Findings are numbered
as in the review. This plan turns them into ordered, independently shippable
work; every phase lands green (build + typecheck + tests) on its own.

Baseline: 185 tests / 34 files (core 21, ai-sdk 13, chat 15, components 53,
nuxt 83). Alpha, unpublished, no remote. No commit, push or publish happens
without explicit approval.

## Step 0 - settle the working tree

The review fixes and follow-ups are uncommitted:

- `AGENTS.md`, `README.md`
- `apps/playground/app/components/chat/Prompt.vue`
- `apps/playground/app/lib/library.ts`
- `packages/components/src/components/ChatMessage.vue`
- `packages/core/src/define-component.ts`
- `packages/core/src/prompt.ts`

Recommendation: one `chore:` commit before Phase 1 (`chore: sync prompt
options, ids, docs and counts`), because Phase 1 and Phase 5 touch
`prompt.ts`, `library.ts` and `README.md` again. Alternative: fold them into
the Phase 1 commit; do not leave them mixed with unrelated changes.

---

## Phase 1 - container legality + extensible factory (findings 1, 8, 9, 13)

One change, four problems: unions are not enforced at runtime, custom
components cannot be Card children, the factory cannot be configured, and
`Buttons` is unreachable.

### 1.1 One source of truth for child lists

`packages/components/src/defs.ts`

- Introduce explicit def arrays and derive both the union and the name list:

  ```ts
  const CARD_CHILD_DEFS = [TextContentDef, BadgeDef, ProgressDef, AlertDef, StatsCardDef, ...] as const
  export const CardChildUnion = z.union(CARD_CHILD_DEFS.map((d) => d.ref) as unknown as [z.ZodType, ...z.ZodType[]])
  export const CARD_CHILD_NAMES = CARD_CHILD_DEFS.map((d) => d.name)
  ```

- Same treatment for `ContentChildUnion`, `FormChildUnion`, `ChatChildUnion`
  (`defs/base.ts`). Keep `ChatChildUnion`'s existing order: it is asserted in
  tests today and is part of the ChatPalette contract.
- Delete the "keep in sync with ChatChildUnion" comment in
  `packages/components/src/unions.ts`; the list is now derived.
- Add `CARD_CHILD_NAMES` / `FORM_FIELD_NAMES` re-exports in `unions.ts` and
  `index.ts`.

Acceptance: a test asserts `new Set(CARD_CHILD_NAMES)` equals the names read
from `CardChildUnion.options` (via each ref's `shape.typeName` literal). If
that introspection is not stable on 0.4.1, assert the literal list instead and
keep the derivation in `defs.ts` as the single edit point.

### 1.2 Enforce the allowlist at render time

`packages/components/src/components/Card.vue`

- Filter element children against the container's allowed names, not against
  the chat/form denylist. Plain text children stay legal (Card is the generic
  container).
- Keep the current "drop, do not throw" behavior and the stable `Children`
  wrapper (`defineComponent` around `renderNode`) so focus is preserved.

`packages/components/src/container-context.ts` (new)

- `provideGenUIContainerChildren(map: Record<string, readonly string[]>)` and
  `useGenUIContainerChildren(name: string, fallback: readonly string[])`.
- Card (and later Carousel/ScrollArea/Splitter) read their list from this
  context, defaulting to the static names.
- Why: custom components must be legal without editing the library source.

Replace the hardcoded denylist import in `Card.vue`; `Buttons.vue` keeps its
own `typeName === 'Button'` filter.

### 1.3 Open the factory

`packages/components/src/index.ts`

```ts
export interface CreateLibraryOptions {
  root?: string
  /** Subset of built-in components to expose. Defaults to every def. */
  components?: readonly GenUIComponentName[]
  /** Extra host-defined components. */
  extraComponents?: readonly GenUIComponentDefinition[]
  /** Extra components that are legal children of Card. */
  extraCardChildren?: readonly GenUIComponentDefinition[]
  componentGroups?: Array<{ name: string; components: string[]; notes?: string[] }>
  promptOptions?: GenUIPromptOptions
  renderers?: Partial<Record<string, Component>>
}
```

- `components` filters `ALL_DEFS` by name; unknown names throw
  `GenUILibraryError('UNKNOWN_COMPONENT', ...)` (reuse the core error type).
- `extraComponents` are appended; names must not collide with built-ins or
  each other (same validation as `createGenUILibrary`).
- `extraCardChildren` rebuild the Card def with an extended children union:
  build `createCardDef(extraRefs)` in `defs.ts` from a literal object so the
  `title`/`children` key order (wire format) is unchanged. Everything else
  keeps using the static `CardChildUnion`; Carousel/ScrollArea/Splitter keep
  `z.lazy(() => CardChildUnion)` and therefore do not accept extras -
  document that.
- Return value stays a plain library (no shape change) so existing callers
  keep working.
- Type the seams: `GenUIComponentName = (typeof ALL_DEFS)[number]['name']`;
  `renderers?: Partial<Record<GenUIComponentName | (string & {}), Component>>`.

### 1.4 Renderer plumbing

`packages/nuxt/src/runtime/GenUIRenderer.ts` and `NuxtGenUI.vue`

- Add a `cardChildren?: readonly string[]` prop (default `CARD_CHILD_NAMES`)
  and call `provideGenUIContainerChildren({ Card: cardChildren })` in setup.
- Generated `dist` stays the source for tests: rebuild components first.

### 1.5 `Buttons` decision (finding 9)

Add `ButtonsDef.ref` to `CARD_CHILD_DEFS`. It is advertised in the README and
is the only way to group actions; being absent from the union while present in
`ALL_DEFS` makes it dead under the default root. After 1.2 it would be dropped
at runtime, so this must land in the same phase.

### 1.6 Playground

`apps/playground/app/lib/library.ts`

- Replace the raw `createGenUILibrary({ components: [...ALL_DEFS, weather] })`
  with `createNuxtUILibrary({ extraComponents: [weatherCardDef],
  extraCardChildren: [weatherCardDef], promptOptions, componentGroups,
  renderers })`.
- Pass `cardChildren` (static names + `WeatherCard`) to `<NuxtGenUI>`.
- Keep the example program that places `WeatherCard` inside `Card`: it is the
  regression proof.

### Tests

- `packages/components/test/defs.test.ts`: child lists derive from defs;
  `Buttons` present in `CARD_CHILD_NAMES`.
- `packages/components/test/container-*.test.ts` (new): Card drops a chat
  component, keeps text, keeps a provided extra name, drops an unknown name.
- `packages/components/test/create-library-options.test.ts` (new): subset,
  extra components, unknown name, duplicate name, Card children extended.
- `packages/nuxt/test/*`: renderer provides the container map; existing
  Card render tests still pass.

**Risk:** medium. Public surface grows; runtime filtering changes what renders
for malformed programs (intended). Step 1.1 must not perturb Zod key order -
run `key-order.test.ts` after every schema edit.

---

## Phase 2 - server-side tool execution (finding 2)

New package `packages/server` (`@nuxt-ui-genui/server`), no Vue, no Nuxt
dependency.

```ts
export interface GenUIServerOptions {
  /** Server-safe library (createNuxtUILibrary without renderers). */
  library: GenUILibrary
  /** AI SDK tool set; each tool executes on the server. */
  tools: ToolSet
  /** Model factory - injected, never resolved from env here. */
  model: LanguageModel
  systemPrompt?: string
  maxSteps?: number // default 5
  onToolCall?: (name: string, args: unknown) => void
}

export function createGenUIChatHandler(options: GenUIServerOptions): (request: Request) => Promise<Response>
export function createToolProxyProvider(options: { endpoint: string; headers?: ...; fetch?: typeof fetch }): ToolProvider
```

- Handler: read `{ messages }` from the request body, build the system prompt
  with `generateGenUISystemPrompt(library)` (merge in a tool list built from
  `Object.entries(tools)` - `{ name, description }`; lang-core 0.4.1 has no
  `runChatToolLoop`, the AI SDK loop is `streamText({ tools, stopWhen:
  stepCountIs(maxSteps) })`), return `toTextStreamResponse()`.
- Tool docs: extend `GenUIPromptOptions.tools` to accept the real `ToolSpec`
  shape (`{ name, description?, inputSchema: Record<string, unknown> }`), not
  `unknown[]` (finding 13). `inputSchema` is JSON Schema, so convert AI SDK
  Zod schemas with `z.toJSONSchema` at the call site.
- Proxy provider: a `Proxy` whose `get` returns `async (args) => post({
  name, args })`; non-2xx throws with status + short body. Document that the
  endpoint owns authorization and that the raw `toolProvider` prop is for
  non-privileged reads only.
- No server route in `packages/nuxt`; expose the Web-standard handler and a
  documented Nitro snippet, so the package stays framework-agnostic.
- Playground: add one example tool route only if it can be done without
  changing the existing `/api/chat` contract; otherwise leave the playground
  alone and cover the handler with tests.

Tests (mocked model, no network): body parsing, system prompt contains tool
names, unknown tool returns a 400, proxy provider posts `{ name, args }` and
throws on failure, abort signal forwarded.

**Risk:** large. This is the first package that owns credentials and tool
execution; it must never read `process.env` (Phase 5 rule) and must not import
`@nuxt-ui-genui/components/sfc`.

---

## Phase 3 - host chat surface + storage (finding 3)

### 3.1 Storage seam (small, lands first)

`packages/chat/src/storage.ts`

```ts
export interface GenUIChatStorage {
  load(): GenUIMessage[] | Promise<GenUIMessage[]>
  save(messages: GenUIMessage[]): void | Promise<void>
  clear(): void | Promise<void>
}
export function createLocalStorageAdapter(key: string): GenUIChatStorage
```

- `createGenUIChat({ storage })` hydrates asynchronously after creation and
  saves on every message append, assistant completion, `clear` and `stop`
  (debounced by a microtask, not a timer, so tests stay deterministic).
- No storage configured = current behavior, exactly.

### 3.2 Chat shell

New package `packages/chat-ui` (`@nuxt-ui-genui/chat-ui`), peer `@nuxt/ui`,
depends on `@nuxt-ui-genui/chat`.

- `<GenUIChat>` props: `chat: GenUIChat`, `placeholder?`, `empty?`,
  `uploader?` (the host-supplied upload function), `disabled?`; slots for
  prompt actions and header.
- Renders `UChatMessages` + `UChatPrompt` + submit/stop, nothing else. No
  transport, no model, no endpoint assumptions.
- Playground replaces its local `Prompt.vue`/message plumbing with this
  component; the Ops Console layout, upload wiring and persistence stay in the
  app.
- Build: same mkdist setup as `packages/components` (compiled SFCs, no raw
  `.vue` in `dist`).

**Risk:** large (new package, build wiring). If a new package is not wanted
now, land 3.1 only and defer 3.2; do not put a Nuxt-only shell in
`packages/components`.

---

## Phase 4 - snapshot vs delta (finding 4)

`packages/core/src/stream.ts`

- Add `export interface GenUIStreamChunk { text: string; mode: 'delta' | 'snapshot' }`
  and `extractChunk(payload): GenUIStreamChunk`.
- `extractDelta` stays (returns `.text`) for compatibility.
- Add `responseChunks(response): AsyncGenerator<GenUIStreamChunk>`; keep
  `responseTextChunks` yielding strings.
- `parseSSEChunks`/`parseNDJSONChunks`: add detailed variants or a `mode`
  parameter; the plain functions keep yielding text.

`packages/chat`

- `GenUITransport` yields `string | GenUIStreamChunk` (additive).
- `run()`: `chunk.mode === 'snapshot' ? part.text = chunk.text : part.text += chunk.text`.
- `createFetchTransport` uses the detailed reader and adapts SSE snapshots
  (`messages[]`) to `mode: 'snapshot'`.

Test: two successive `messages` snapshots (`"a"`, `"ab"`) produce `"ab"`, not
`"aab"`; interleaved delta + snapshot behaves as replace-then-append.

**Risk:** small, but it changes the transport type. Note it in the changelog.

---

## Phase 5 - take playground env out of `ai-sdk` (finding 5)

- Move `GenUIEnv`, `resolveGenUIMock`, `resolveGenUILive` to
  `apps/playground/server/utils/genai.ts`; update `chat.post.ts` and
  `provider.get.ts`.
- `packages/ai-sdk`: delete the resolvers and the `GENAI_*` defaults. `live`
  stays fully injected (`apiKey`, `baseURL`, `model`); no `process.env` read.
- Move the resolver tests into the playground (or drop them if they only
  tested env mapping).
- README/AGENTS: state that `GENAI_*` is a playground convention, not part of
  the adapter contract.

**Risk:** small, breaking export removal (alpha, acceptable). Grep for
`resolveGenUI` across the repo before deleting.

---

## Phase 6 - renderer dedupe (finding 6)

`packages/nuxt/src/runtime/renderer-bridge.ts` (new)

- `cleanDiagnosticNames(names)` (moved, single copy).
- `useRendererBridge(props)`: returns `{ handleError, handleParseResult,
  handleAction, rendererProps }`, where `rendererProps` includes the bridged
  `onAction` and the diagnostic forwarding.
- `GenUIRenderer.ts` uses `rendererProps` directly; `NuxtGenUI.vue` uses the
  handlers and adds its own dev refs, `import.meta.dev` and overlay.
- Add a test that both entries forward `onUnresolved`/`onOrphaned` and filter
  `undefined`/`null` identically.

**Risk:** small. No behavior change intended.

---

## Phase 7 - SFC prop types from Zod (finding 7)

Start with the data-heavy components, where drift is most likely:

- `Table.vue`, `DataTable.vue`, `Chart.vue`, `Stats.vue`, `StatsCard.vue`,
  `Timeline.vue`, `Tabs.vue`, `Stepper.vue`, `ProgressGroup.vue`, `Calendar.vue`.

Pattern:

```ts
import type { TableDef } from '../defs'
type Props = z.infer<typeof TableDef.props> // import type { z } from 'zod/v4'
const props = defineProps<{ props: Props }>()
```

- Type-only imports are erased; no Zod code reaches the client bundle.
- Break the type on purpose once (rename a field in a scratch branch) to prove
  `vue-tsc` fails; then revert.
- Leave the 61 remaining SFCs for a later mechanical pass; do not mix it into
  Phase 1.

**Risk:** small, but `z.infer` output may be wider than the hand-written type
(e.g. optional fields). Compile check each SFC before moving on.

---

## Phase 8 - low-severity cleanup (findings 10-14)

10. `packages/core/src/index.ts`: stop re-exporting `LibraryDefinition`,
    `LibraryJSONSchema`, `ComponentGroup`. Add `GenUILibrary` /
    `GenUILibrarySpec` aliases in `packages/core/src/types.ts` and use those in
    public signatures. Grep first; `components` and the playground may import
    the upstream names directly.
11. `promptOptions`: keep replace semantics (explicit wins), document it in the
    JSDoc of `generateGenUISystemPrompt` and in the README, and add a test that
    an explicit `examples` replaces the stored array. Do not change behavior.
12. `packages/components/test/expanded-defs.test.ts`: assert membership
    (set equality) for unions instead of exact order/length; keep exact key
    order assertions on `props.shape` only.
13. Type the seams: `GenUIComponentName`, `renderers` as `Partial<Record<...,
    Component>>`, `tools?: (string | GenUIToolSpec)[]` with `GenUIToolSpec`
    matching lang-core `ToolSpec`. `defineGenUIComponent.component` stays
    `unknown` in core (core must not import Vue), documented as
    "client-only, typed in `@nuxt-ui-genui/components`".
14. README line 28: replace "striping via the `ui` map" with the actual
    component-level style rule (line 19 is already correct).

**Risk:** low.

---

## Verification per phase

1. Targeted package tests (`pnpm --filter @nuxt-ui-genui/<pkg> test`).
2. `pnpm --filter @nuxt-ui-genui/components build` before any nuxt test or
   playground serve.
3. `pnpm --filter @nuxt-ui-genui/components typecheck`.
4. Root `pnpm build`, `pnpm typecheck`, `pnpm test` (never concurrent).
5. Playground production build + one live smoke on `:3002` when UI or the
   prompt/library changed: deploy-approval card, striped table, FileUpload
   label, WeatherCard-inside-Card.
6. Update `README.md` and `AGENTS.md` test counts and coverage map in the same
   commit as the behavior change.

## Commit plan (one per phase, no push)

1. `chore: sync prompt options, ids, docs and counts` (Step 0)
2. `feat(components): enforce container allowlists and open the library factory`
3. `feat(server): add server-side GenUI chat handler and tool proxy`
4. `feat(chat): add storage seam` + `feat(chat-ui): extract host chat surface`
5. `fix(core): distinguish delta and snapshot stream chunks`
6. `refactor(ai-sdk): move env resolution to the playground`
7. `refactor(nuxt): share renderer bridge between entries`
8. `refactor(components): derive SFC prop types from Zod schemas`
9. `chore: clean up public types, tests and docs`

## Explicitly deferred

- Devtools/Inspect surface (`@openuidev/devtools` equivalent).
- MCP client seam beyond `McpClientLike` passthrough.
- Agent-framework adapters (ADK, LangGraph, Mastra, AG-UI) as packages.
- Standalone artifact/email/dashboard surfaces and Autofix.
- Playwright smoke suite for the Ops Console.
- Publish path: remote, CI, changesets, npm scope, `pnpm pack` dry runs.
