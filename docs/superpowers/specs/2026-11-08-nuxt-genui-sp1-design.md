# SP1 — Nuxt GenUI Library: Monorepo Skeleton + First Vertical Slice

**Date:** 2026-11-08
**Status:** Implemented (2026-11-09; Tasks 1–8 verified green on branch `sp1-implementation` — build, typecheck, tests 28/28; dev and prod smoke verified. Live path verified against a generic local OpenAI-compatible endpoint, not a provider integration)
**Context:** `docs/ChatGPT_Nuxt-Generative-UI-Architecture_20261108-1852.md` (transcript; lines ~885–2380 = "Master Engineering Prompt"), AGENTS.md, OpenUI upstream research (Appendix B).

## 1. What SP1 is

An open-source **generative UI library for Nuxt 4**: OpenUI Lang in, real allowlisted Nuxt UI 4 components out. The product is the library — not a demo app. SalesDashboard is only the demo fixture that proves the pipeline.

Explicitly NOT in SP1: a separate OpenUI implementation, chat product UI, forms, Playwright, public release.

## 2. Confirmed decisions (supersedes master prompt where they differ)

- Product scope: framework + chat components; **SP1 ships the framework slice only**.
- Positioning: `@nuxt-ui-genui/*` — an independent library in the "Nuxt UI Blocks" ecosystem (sibling of Nuxt Motion Block). No coupling to Motion Block.
- Skeleton-first: **full pnpm workspace up front**, all packages wired for build/exports on day one; implementations filled incrementally. (Master prompt says otherwise — Appendix A, point 1.)
- Registry: hybrid. Built-in Nuxt UI 4-backed components **plus** developer-defined custom components — both through the real OpenUI Vue path.
- AI integration: provider-agnostic core; optional Vercel AI SDK adapter (`@ai-sdk/vue` on the client, `ai` SDK on the server). Not mandatory for consumers of `core`.
- Compatibility: **Nuxt 4 + Nuxt UI 4 only.** No Nuxt 3, no multi-generation Nuxt UI.
- Chart backend: `@nuxt/ui` `UChart` (TanStack Charts). Forms: out of SP1 allowlist. (Superseded 2026-11-08: UChart is built on TanStack Charts, not unovis; see Appendix C.)
- OpenUI line: **`@openuidev/vue-lang@0.4.2` + `@openuidev/lang-core@^0.4.1`** (Lang 0.5 semantics). Vue renderer has no Lang 1.0. Isolate behind our public API; keep door open to 1.0.
- Start fresh. The 2026-11-01 scaffold zip is reference-only, not merged.

## 3. Repository layout & tooling

```
pnpm-workspace.yaml        # packages/* + apps/*
package.json               # private root; scripts only
apps/playground/           # Nuxt 4 app (ssr: false)
packages/core/             # @nuxt-ui-genui/core
packages/components/       # @nuxt-ui-genui/components
packages/nuxt/             # @nuxt-ui-genui/nuxt
packages/chat/             # @nuxt-ui-genui/chat (shell)
packages/ai-sdk/           # @nuxt-ui-genui/ai-sdk (shell)
```

Root tooling:

- `pnpm -r build` (topological; nuxt-module-builder for `packages/nuxt`, unbuild for `core`/`components`).
- `pnpm -r typecheck` under `strict: true` TypeScript.
- `pnpm -r test` (Vitest). No lint/format config in SP1 beyond what `nuxt module-builder` needs.
- ESM only; `zod/v4` imports everywhere; no committed `dist/`; `.gitignore` seeded (node_modules, dist, .nuxt, .output, .data).
- **Not a git repo.** Do not `git init` unless the user asks.
- Requirements floor documented in README: Node.js 20.19+, pnpm 9+ (workspace works on Node ≥ 20.19 || ≥ 22.12 like OpenUI).

Playground configures `nitro.externals.inline = ["@openuidev/lang-core", "@openuidev/vue-lang", "zod"]` and the matching `vite.ssr.noExternal` + `vite.optimizeDeps.include: ["@openuidev/vue-lang"]` (mandatory — see Appendix B). `ssr: false` until Renderer SSR is verified. `OPENUI_TELEMETRY_DISABLED=1` set in playground env.

## 4. Package responsibilities

### @nuxt-ui-genui/core (server-safe; NO Vue)

Framework-agnostic library machinery. This is the public adapter seam.

- `defineGenUIComponent({ name, props, description, component? })` — wraps `defineComponent`; throws on mount of a second definition with the same name; rejects Zod 3 schemas with a clear error.
- `createGenUILibrary({ components, root, componentGroups, promptOptions })` — creates library + rejects duplicate names and reserved builtin prefix collisions at construction time (build fails fast; no dead time in prod).
- `generateGenUISystemPrompt(spec, promptOptions)` — thin wrapper over lang-core's `generateSystemPrompt`. Splits `promptOptions` out of `toSpec()` output when `cloud: true` is requested (Cloud rejects promptOptions inside the library spec). `cloud: true` opt-in only; local assembly is the default and needs no network.
- Re-exports serializable `LibraryJSONSchema` / spec types. Never re-exports `Renderer`, composables, or Vue types.
- Ship `.d.ts`; no runtime dependencies beyond `@openuidev/lang-core`, `zod`.

### @nuxt-ui-genui/components (client)

Built-in registry. SFCs wrapping Nuxt UI 4; each file exports its OpenUI def + SFC. Design copied from OpenUI design-system examples (Appendix B):

- One file per component; `defineComponent({ name, props: z.object({...}), description })`.
- **LLM-targeted descriptions**: enum values inline, units ("value is 0-100"), gotchas, mapping tables (e.g. variant → UButton variant).
- Key order of every zod object = OpenUI Lang positional-argument order = wire format. **Never reorder keys after publish.**
- Chart/DataTable use inline object-literal slots (B1(a), 2026-11-08): `series: [{ name, data }]`, `columns: [{ key, label, align? }]`, rows as a positional string/number matrix. No virtual sub-components, no validator-pruned elements. See Appendix C.
- Shared `action.ts` / `rules.ts` / `helpers.ts` (`hasAllProps`, `asArray`) — port verbatim (Appendix B).
- Content unions (`unions.ts`) built from `.ref`; shallow nesting — no tabs/accordion inside content unions.
- SFCs receive a **single `props` object** prop (`defineProps<{ props: … }>()`), composable children wired via `useRenderNode()` + `renderNode(...)`, actions via `useTriggerAction()`.
- Streaming-safe: bail to `null` until required props resolve (`hasAllProps` guard); charts bail until `labels` and `series` land.
- TextContent v-html: `marked` + `DOMPurify` sanitized. Never raw v-html.

**Built-in alpha subset (SP1):**

| Component | Nuxt UI 4 | Notes |
|---|---|---|
| `Card` (root) | `UCard` | `children` union child slot; the only content container |
| `StatsCard` | `UCard`-like metric | Label + value + delta; sign drives up/down color |
| `TextContent` | plain div + markdown | sanitized |
| `Button`, `Buttons` | `UButton` | `action` prop = actionSchema shape |
| `Alert` | `UAlert` | info / warning / error / success |
| `Badge` | `UBadge` | variant mapping |
| `DataTable` | simple table (streaming-friendly) | columns `z.array(z.object({ key, label, align? }))` inline literals; rows a positional `(string|number)[][]` matrix |
| `Chart` | `@nuxt/ui` `UChart` wrapper (donut for `pie`) | series `z.array(z.object({ name, data: z.array(z.number()) }))` inline literals; SFC reshapes to UChart row objects |
| `Progress` | `UProgress` | 0–100 |

Forms (`UForm`/`UInput`/…) are **out** of SP1. `rules.ts` vocabulary still defined so `Input` etc. can be added without schema churn later.

### @nuxt-ui-genui/nuxt

Nuxt module.

- Registers component `<NuxtGenUI>` (auto-import name from module).
- Wrapper around vue-lang `<Renderer>`: SSR-safe default (ClientOnly semantics until Renderer SSR is verified), `:is-streaming`, `:on-action` prop (not emit).
- Props: `response: string | null`, `library`, `isStreaming?`, `onAction?`, plus dev-only `:on-error` / `:on-parse-result` surfaced as props (dev overlay lists errors with catalog codes; prod: optional callback, never blocks render).
- Action bridge built in: `ContinueConversation` → consumer-provided callback (or chat adapter in `ai-sdk`), `OpenUrl` → `window.open` after scheme allowlist check (`https:` only).
- `nuxt.config`: registers module; no other side effects. Auto-imports none in SP1 (explicit imports from `@nuxt-ui-genui/nuxt`).

### @nuxt-ui-genui/chat and @nuxt-ui-genui/ai-sdk

Wired-but-minimal shells: package entry, one type export each, one smoke test, `README.md` stating scope ("chat UI primitives land after core renderer ships"). `ai-sdk` shell will hold the `@ai-sdk/vue` transport glue later; today only a placeholder export.

### Custom developer components (the SP1 bar beyond built-ins)

Consumer writes:

```ts
const WeatherCard = defineGenUIComponent({ /* name, props, description */ })
const library = createGenUILibrary({ components: [...builtins, WeatherCard], root: 'Stack', componentGroups, promptOptions })
```

Playground proves `WeatherCard` renders from a deterministic OpenUI Lang program through the real path.

## 5. Data flow

1. **Server, module scope** (Nitro): `const specLibrary = createNuxtUILibrary(/* zero args */)` — placeholders; never imports SFCs or Nuxt UI. `const systemPrompt = generateGenUISystemPrompt(specLibrary, { examples, additionalRules, preamble? })` (local assembly default; `cloud: true` opt-in).
2. **HTTP**: `apps/playground/server/api/chat.post.ts` — `streamText({ model: openai.chat(...), system: systemPrompt, messages: await convertToModelMessages(messages), tools?, stopWhen: stepCountIs(5) })` → `result.toUIMessageStreamResponse({ onError })`. Model endpoint: OpenAI-compatible (`https://api.thesys.dev/v1/embed` or user's own) via `THESYS_API_KEY` env; server-side only.
3. **Client**: `new Chat({ api: '/api/chat' })` from `@ai-sdk/vue` (matches official example). `<NuxtGenUI>` receives concatenated assistant `text` parts (computed), `:is-streaming` from `chat.status`, `:on-action` maps `ContinueConversation` → `chat.sendMessage({ text })`, `OpenUrl` → allowlisted `window.open`.
4. **Library define-time**: built-ins from `@nuxt-ui-genui/components`; consumer passes composed library to `<NuxtGenUI>`; allowlist enforced at `createGenUILibrary` time; unknown component at render → `null` + dev overlay entry (not a crash).
5. **Deterministic demo**: playground ships a demo mode returning a **fixed OpenUI Lang program** (SalesDashboard + WeatherCard) via the same code path, clearly labeled "Demo data — no AI provider configured". When `THESYS_API_KEY` is set, chat becomes live.
6. **PromptSpec inputs**: `componentGroups` (with group `notes`, e.g. "Card is the only content container; NEVER nest forms"), worked `examples` (6–12 OpenUI Lang programs), `additionalRules` (root rule, variant vocabulary, streaming expectations). Descriptions carry per-component limits. This trio — groups, examples, additionalRules — is required for reliable model output (Appendix B); SP1 ships a minimal but functional promptOptions set (≥ 5 examples including SalesDashboard).

## 6. Error handling & reliability

- vue-lang parses **permissively**: invalid nodes dropped, `meta.errors` populated (`unknown-component`, `excess-args`, `missing-required`, `no-root`, …). Partial render is the normal failure mode — document in README/AGENTS.md, never throw client-side.
- `<NuxtGenUI>` exposes `:on-error` (dev overlay + console; prod: optional callback) and `:on-parse-result` (dev). Errors surface only at stream completion (vue-lang semantics — keep).
- Taxonomy:
  - Duplicate/reserved-name/component-collision → **throw at construction** (`createGenUILibrary`), fail fast at build.
  - Unknown component / excess args / missing required → render-time, non-fatal; dev overlay only.
  - Model returns garbage / null root → **no repair/retry loop in SP1**; demo shows explicit raw error state; honest over clever.
- Untrusted output: never eval; never v-html raw model text; markdown via marked+DOMPurify; `open_url` scheme allowlist; all business actions must be server-authorized tools — client-side actions never authorize anything.
- Telemetry: playground sets `OPENUI_TELEMETRY_DISABLED=1`; runtime telemetry stays default-off. Documented in README.
- SSR: playground `ssr: false`; wrapper defaults to ClientOnly; hydration edge documented as known limitation.

## 7. Testing

- **core** (plain Vitest): rejects Zod 3 schemas; throws on duplicate name; throws on reserved builtin prefix; preserves key order (golden assertion via signature snapshot — wire format); `generateGenUISystemPrompt` wrapper (incl. `cloud: true` promptOptions split); adapter→public-error mapping.
- **components** (`@nuxt/test-utils`, props-object contract): StatsCard value/delta rendering; DataTable cols/rows; Chart returns null until labels/series land; TextContent strips `<script>` from markdown.
- **nuxt** (nuxt-module-builder + fixture app + `@nuxt/test-utils`): `renderSuspended` asserts SalesDashboard OpenUI Lang string renders Card/StatsCard; `onAction` → bridge fires; custom WeatherCard renders via public API.
- **chat / ai-sdk**: build + import smoke only.
- **root**: `pnpm -r build`, `pnpm -r typecheck`, `pnpm -r test` all green.
- No Playwright in SP1.
- Tests are **executed, never asserted without execution**.

**Definition of done (SP1):**

1. Fresh `pnpm install` clean on Node 20.19+ / pnpm 9+ (documented).
2. `pnpm -r build` + `pnpm -r typecheck` green.
3. `pnpm -r test` green.
4. `pnpm --filter playground dev` renders the deterministic SalesDashboard **and** a custom WeatherCard through the real OpenUI Vue path; actions flow to chat; zero console errors.
5. AGENTS.md updated with the real working commands; this spec marked implemented.

## 8. Out of scope (SP1)

Real provider streaming in CI (model-dependent), chat UI, forms in allowlist, examples/ directory, docs site, Tailwind preset/config (Nuxt UI 4 brings Tailwind 4), E2E/Playwright, public publish, motion integration, Lang 1.0/`defineFunction`/`defineAction`.

## Appendix A — Master Engineering Prompt vs this spec

The transcript's master prompt was generated **before the later conversation decisions were finalized** (user-confirmed 2026-11-08: it is an early draft, not a binding spec; where it differs, the later decisions win). It is a strong match on principles (~80–85%) but not on structure. Settings/principles that stay: provider-agnostic core; Nuxt 4 + Nuxt UI 4 only; allowlist + runtime schema validation; no eval; Nitro keys server-side only; honest deterministic-demo requirement (§13); typed OpenUI adapters (§10); testing §17; incremental milestones and honest milestone reporting §19; keep current executable as source of truth over stale docs (§16 Phase 0).

1. **"Prioritize the smallest real end-to-end implementation over creating the entire monorepo immediately"** (§4/§20) → contradicts user's confirmed **full skeleton upfront** decision. User decision wins (2026-11-08). The skeleton milestone itself is thin — small package implementations, one built-in alpha set, one demo — so the risk the master prompt warns about (empty architecture) stays contained. The vertical end-to-end slice is built **next, in SP1's implementation**, before chat/motion.
2. **§16 Phase 0** — "if this repository contains an existing MVP scaffold, inspect and improve rather than starting over" — scaffold is **not in this repo**; start fresh; scaffold treated as reference only.
3. **Renderer name**: master prompt proposes `<UGenerativeUI>`; this spec uses `<NuxtGenUI>` (module-registered auto-component). Both are "proposed" names; the Nuxt auto-name wins; master prompt's props (`response`, `streaming`) are kept.
4. **Chat section §11 / `<UAIChat>`** — deferred; shells only in SP1.
5. **Naming candidates** (Nuxtive, Vueron, …) — superseded by `@nuxt-ui-genui/*` under the Nuxt UI Blocks umbrella.
6. **Support all target Nuxt UI components §6** — SP1 alpha proves ~9 components across Display/Data/Charts; rest land incrementally.
7. **Forms + typed application actions §9, §13 interactive booking form** — forms out of SP1 allowlist; actions in SP1 are limited to vue-lang 0.4.x vocabulary: `continue_conversation`, `open_url`, custom `{type, params}` passthrough. No Lang 1.0 `defineAction`/`defineFunction`, no `@ToAssistant`/`@Run` typed statements. Documented limitation.
8. **§14 developer inspection panel** — deferred post-SP1 (playground ships prompt + output + streaming status + raw response; full tree/validation-errors panel later).
9. **§15 docs site** — SP1 ships README + this spec; docs site premature before renderer ships.
10. **§4 Nitro externals + `ssr: false`** — consistent; adopted verbatim from official Vue example.
11. **Examples directory §5 / basic-chat etc.** — playground only in SP1; `examples/` later.

## Appendix B — OpenUI research summary (verified 2026-11-08)

**Version reality.** `@openuidev/vue-lang@0.4.2` (2026-10-15; ~4.7k dl/wk) depends on `@openuidev/lang-core@^0.4.1`. React line is on 1.1.0 (Lang 1.0, ~733k dl/wk). The Vue line intentionally stays on Lang 0.5: no `defineFunction`/`defineAction`, no `.extend()`, no message protocol, no ActionExpression slot typing. README: "OpenUI Lang 1.0 features need the React renderer, for now." Decision: **stay on 0.4.x**, thin adapter, keep internal surface narrow for a possible Lang 1.0 jump.

**Zod.** Peers say `^3.25||^4` but all schema code imports `zod/v4` / `zod/v4/core`; `assertV4Schema` throws on Zod 3. Key order = positional argument order = wire format, enforced in `signature.ts`, in vue-lang's `RenderNode.vue` prop zip, and in `z.toJSONSchema` property order. → Import `zod/v4` everywhere; treat key order as API; golden key-order test in core.

**lang-core** (framework-agnostic, Nitro-safe; sole runtime dep `ci-info`): `generateSystemPrompt({ cloud: true, library: spec, promptOptions })` or local `{ library: spec }` assembly; **promptOptions must be split out of the spec for cloud mode**; `library.toSpec()` is fully serializable. `createStreamingParser(schema, rootName)` is permissive. Built-ins: `@Count`/`@Each`/`@Sum` etc.; action steps `@Run`/`@ToAssistant`/`@OpenUrl`/`@Set`/`@Reset` (0.4.1 runtime supports `ActionPlan` steps; prompts teach them weakly — prefer legacy `{type, params}` action props as in official example). **Postinstall telemetry is ON by default** (`OPENUI_TELEMETRY_DISABLED=1` / `DO_NOT_TRACK=1`); runtime telemetry opt-in.

**vue-lang 0.4.2 public surface**: `createLibrary`, `defineComponent`, `Renderer` (default export; props incl. `response: string|null` — accumulated text, `library`, `isStreaming?`, `onAction?` (prop, not emit), `onParseResult?`, `onError?`, `onStateUpdate?`, `initialState?`, `toolProvider?`), composables (`useRenderNode`, `useTriggerAction`, `useIsStreaming`, form validation trio), `BuiltinActionType`, parsers. Unknown components render `null`; an `onErrorCaptured` boundary keeps last valid VNode and auto-resets; errors collected in `ParseResult.meta.errors`; `onError` fires only at stream completion, deduplicated.

**Workspace pattern (mandatory).** Official Nuxt 3/Vue example `examples/app-frameworks/vue`: shared schema-only `define-library.ts` factory, callable with **zero args server-side** (placeholder components — only needed for `.toSpec()`), with SFCs client-side. One shared module; drift impossible. Nitro config: `ssr: false`, `nitro.externals.inline` + `vite.ssr.noExternal` = `["@openuidev/lang-core", "@openuidev/vue-lang", "zod"]`, `vite.optimizeDeps.include: ["@openuidev/vue-lang"]`. Client: `new Chat({ api })` from `@ai-sdk/vue`; `<Renderer :response="textParts" :is-streaming :on-action>`; `tool()` + `zod inputSchema` server side; `stepCountIs(5)`; `toUIMessageStreamResponse({ onError })`.

**Design-system examples** (shadcn ~59 comps/14 groups; material-ui ~31/7; the model for our alpha set): one-file-per-component, LLM-targeted descriptions with enums/units/gotchas, virtual sub-components in `.ref` unions, shallow-nested content unions, `action.ts`/`rules.ts`/`helpers.ts` copied verbatim, `ComponentGroup[]` with `notes`, 6–12 worked OpenUI Lang examples, `additionalRules`, assistant-ui not applicable to Nuxt (present/prompt tools pattern noted, not adopted).

**Do not design around**: `statementId`, `publishObservability`, `WithPreviewRenderer`, `useRendererQuery`, `.extend()` — not available in 0.4.2. **Treat** `@openuidev/vue-lang` as ~4.7k dl/wk vs react-lang 733k/wk — thin, forkable if Lang 1.0 lands. **Tables**: implement as simple table + `Col` (streaming-friendly), `UTable` only if it stays clean. **Spec artifact**: in-memory `toSpec()`; no committed generated `spec.json`.

**Key version matrix (2026-11-08):** vue-lang 0.4.2 (2026-10-15) ↔ lang-core ^0.4.1 (zod 4.4.3 in lockfile) · react-lang 1.1.0 ↔ lang-core 1.1.0 · zod `^3.25||^4` peers, v4 API in practice · Vue ≥ 3.5 · Node ^20.19 || >=22.12.

## Appendix C — SP1 plan-review decisions (2026-11-08, user-approved)

Applied to the implementation plan (`docs/superpowers/plans/2026-11-08-nuxt-genui-sp1.md`) after deep spec/plan review:

- **B1(a)**: Series/Col virtual sub-components dropped. `Chart.series` and `DataTable.columns` take inline object-literal slots - plain-data array elements are never pruned by the validator (OpenUI Lang 0.5 / spec §8.4). DEMO_PROGRAM, prompt options and library examples use the same inline literals.
- **DataTable rows**: positional `(string | number)[][]` matrix only (no object-literal rows on the wire).
- **Chart = UChart** (supersedes the earlier hand-rolled inline-SVG entry in this appendix, 2026-11-08, user-approved): `packages/components` Chart.vue wraps `UChart` (`:type`, `:data`, `:index`, `:categories`, `:height`), `pie` maps to `donut`; `@tanstack/charts ^1.5.0` added as a playground dependency. Unovis is not used anywhere; UChart is built on TanStack Charts.
- **Nuxt UI 4.12 / Nuxt ≥ 4.1**: `nuxt.config.ts` must register `css: ['~/assets/css/main.css']` and `app/assets/css/main.css` must contain BOTH `@import "tailwindcss";` and `@import "@nuxt/ui";`; `tailwindcss ^4` is a required peer; `@iconify-json/lucide` preinstalled for offline icons.
- **AI SDK v6 pins**: `ai@^6.0.325`, `@ai-sdk/vue@^3.0.325`, `@ai-sdk/openai@^3.0.139` — not v7. `MockLanguageModelV3` (from `ai/test`) for the no-`THESYS_API_KEY` deterministic demo path; docs site shows v7 APIs, trust node_modules.
- **Mn4**: `createGenUILibrary` throws `INVALID_ROOT` when `root` names no registered component.
- **Mn1/Mn5**: `prose` variant classes removed from TextContent; `CardChildUnion` composes `ContentChildUnion` options (no hand-relisted unions).
- **Task 4a folded**: matrix-rows patch merged inline into Tasks 3/4; the standalone patch section in the plan was removed.
- **Telemetry**: `OPENUI_TELEMETRY_DISABLED=1` stays mandatory for all install/run commands.
