# Nuxt UI Expanded Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement task-by-task, or superpowers:executing-plans for inline execution. This plan intentionally contains no commit step: commits/pushes/publish/merge require explicit user approval.

**Goal:** Add the approved Phase A display/feedback and Phase B chat wrapper components to `@nuxt-ui-genui/components`, exposed through the existing registered-component pipeline with no privileged actions or state ownership.

**Architecture:** Keep all component definitions server-safe in `src/defs.ts`; definitions are only attached to Vue SFCs through `./sfc` in the client registry path. Phase A children join `CardChildUnion` under the default `Card` root. Phase B is a separate `ChatChildUnion` legal only under the host-selected `ChatPalette` root. Existing ten definitions and wire-format key orders remain unchanged; new definitions are appended only.

**Tech Stack:** Nuxt 4, Nuxt UI 4.12.0, Vue 3 SFCs, TypeScript, `@openuidev/vue-lang@0.4.2`, `@openuidev/lang-core@^0.4.1`, `zod/v4`, pnpm 9+, Vitest, `@nuxt/test-utils`.

**Spec:** `docs/superpowers/specs/2026-11-09-nuxt-ui-expanded-components-design.md`

## Global Constraints

- Working copy is a local worktree checkout; branch `sp1-implementation`; original checkout left untouched.
- `docs/superpowers/plans/2026-11-08-nuxt-genui-sp1.md` and `task-1-review` are user-owned and untracked/modified; never edit, stage, commit, delete, or overwrite them without explicit approval.
- OpenUI stack remains `@openuidev/vue-lang@0.4.2` and `@openuidev/lang-core@^0.4.1`; do not introduce Lang 1.0 APIs, React parity, or `.extend()`.
- `@nuxt/ui` source/types are authoritative. SFCs are default imports from `@nuxt/ui/components/<Name>.vue`; never import components from the package root as runtime values.
- Server/Nitro/spec-generation code must not import SFCs or `./sfc`. `./sfc` is client-only.
- Zod object key order is OpenUI Lang positional wire format. Never reorder or reshape an existing schema. New schemas add keys only in the order written below.
- Unknown/unsupported model-generated args render safely without throwing; no eval, no raw HTML strings, no arbitrary URLs/classes/CSS, no unescaped slots.
- Lucide icon strings are unrestricted for v1; unknown names render null by the icon provider, never executable code.
- `UError` is excluded; `Alert color="error"` is the only diagnostics surface.
- Forms, quizzes, inputs/selects, submit workflow, CommandPalette, overlays, navigation shells, and privileged tool actions are excluded.
- ChatPrompt/ChatPromptSubmit remain host-owned and are not registered as model-callable components.
- Privileged actions/tools must remain server-authorized. No model-generated params may directly invoke them.
- Run meaningful commands with `OPENUI_TELEMETRY_DISABLED=1`.
- Do not commit, push, merge, publish, or mark a release without explicit user approval.

## Review Focus

1. A model tries to nest a Phase B/chat component under `Card`: the installed 0.4.x parser does not enforce union membership, so the Card wrapper filter and the Lang fixture must not render its marker/text. Test owned by Task 4.
2. A model tries to place a Phase A component under host-selected `ChatPalette`: the ChatPalette wrapper allowlist and the Lang fixture must not render its marker/text. Test owned by Task 4.
3. Chat data references disappear during streaming or supply incomplete messages: wrappers must render safe placeholder/partial state without crashing or leaking ids/provider metadata. Tests owned by Tasks 3 and 4.
4. Tool/card actions are emitted by generated model output: wrappers must expose display-only props and must not register `actions`, callbacks, URLs, or privileged tool invocations. Tests owned by Tasks 3 and 4.
5. Wire order drift expands an existing component or breaks system-prompt examples: existing `defs.ts` order and all new defs must be asserted exactly. Test owned by Task 1.

---

## File Map

### Create
- `packages/components/src/components/Accordion.vue` … `Skeleton.vue` — simple Phase A client wrappers.
- `packages/components/src/components/ChatMessage.vue`, `ChatMessages.vue`, `ChatReasoning.vue`, `ChatShimmer.vue`, `ChatTool.vue`, `ChatPalette.vue` — constrained Phase B client wrappers.
- `packages/components/test/expanded-defs.test.ts` — exact all-def/wire-union contract tests in Node.
- `packages/nuxt/test/expanded-components.test.ts` — real Lang→`<NuxtGenUI>` integration tests for both roots.
- `docs/nuxt-ui-expanded-components.md` — narrow usage/exclusion notes; do not turn it into publishing docs.

### Modify
- `packages/components/src/defs.ts` — append Phase A and Phase B definitions; expand `CardChildUnion`; add/export `ChatChildUnion`; final ALL_DEFS list.
- `packages/components/src/unions.ts` — export `ContentChildUnion`, `CardChildUnion`, `ChatChildUnion`.
- `packages/components/src/index.ts` — export the new defs/unions exactly like existing exports.
- `packages/components/src/components/index.ts` — named default exports for new SFCs only.
- `packages/nuxt/test/fixtures/basic/nuxt.config.ts` — only if `renderSuspended` does not resolve the new SFCs from workspace aliases; keep SSR disabled.
- `README.md` — concise status note: components are source-available, not published; supported expanded subset only.

## Exact Wire-Format Contract

Append new definitions after the existing ten, in this exact order:

```txt
AccordionDef, AvatarDef, AvatarGroupDef, BannerDef, ChipDef, CollapsibleDef, EmptyDef,
KbdDef, SeparatorDef, SkeletonDef,
ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef
```

The final `ALL_DEFS` order must be existing ten in their current order followed by the definitions above.

- Existing `ContentChildUnion` members remain exactly `[TextContentDef.ref, BadgeDef.ref, ProgressDef.ref, AlertDef.ref]`.
- `CardChildUnion` final options remain `ContentChildUnion.options` plus SP1 refs (`StatsCardDef.ref`, `ChartDef.ref`, `DataTableDef.ref`, `ButtonDef.ref`) followed by the ten Phase A refs.
- New `ChatChildUnion = z.union([ChatMessageDef.ref, ChatMessagesDef.ref, ChatPaletteDef.ref, ChatReasoningDef.ref, ChatShimmerDef.ref, ChatToolDef.ref])`.
- `ChatPaletteDef.children = z.array(z.lazy(() => ChatChildUnion))`. The lazy reference is mandatory; direct `z.array(ChatChildUnion)` in this definition creates an initializer cycle before export. The exported `ChatChildUnion` remains a normal union with the exact six refs below.
- `ChatPalette` is legal only as a host-selected root; no existing Card/child union may include it.
- Existing schemas retain the exact key order listed in current `defs.ts`; do not re-order existing enum members.

## Exact Component Schemas (key order is wire format)

Phase A:
- `AccordionDef`: `{ items: [{ label: string, content: string }], type: 'single' | 'multiple' | optional }`; default `single` behavior is handled in the SFC when prop omitted.
- `AvatarDef`: `{ src?: string, alt?: string, text?: string, size?: string, icon?: string }`.
- `AvatarGroupDef`: `{ avatars: [{ src?: string, alt?: string, text?: string }], max?: number }`.
- `BannerDef`: `{ title: string, icon?: string }`.
- `ChipDef`: `{ text: string, color?: string, size?: string }`.
- `CollapsibleDef`: `{ label: string, content: string }`.
- `EmptyDef`: `{ title: string, description?: string, icon?: string }`.
- `KbdDef`: `{ keys: string[] }`.
- `SeparatorDef`: `{ label?: string, orientation?: 'horizontal' | 'vertical' }`.
- `SkeletonDef`: `{ width?: number, height?: number, lines?: number }`.

Phase B:
- `ChatMessageDef`: `{ role: 'user' | 'assistant' | 'system', text: string }`.
- `ChatMessagesDef`: `{ messages: [{ role: 'user' | 'assistant' | 'system', text: string }], status?: 'ready' | 'submitted' | 'streaming' | 'error' }`.
- `ChatPaletteDef`: `{ children: ChatChildUnion[], title?: string, icon?: string }`.
- `ChatReasoningDef`: `{ text: string, streaming?: boolean }`.
- `ChatShimmerDef`: `{ text: string }`.
- `ChatToolDef`: `{ name: string, text?: string, suffix?: string, icon?: string, loading?: boolean }`.

Strings are not bounded by arbitrary regex semantics; instead renderers and descriptions discourage empty text, excessive length, arbitrary URLs, and untrusted HTML. No `z.string().url()` is added unless the spec approves URL rendering. `ChatMessage` and `ChatMessages` synthesize UIMessage-compatible values with stable index ids (`message-${index}`), role, and a single text part only.

## Task 1: Pin definition and union contracts

**Files:**
- Modify: `packages/components/src/defs.ts`
- Modify: `packages/components/src/unions.ts`
- Modify: `packages/components/src/index.ts`
- Create: `packages/components/test/expanded-defs.test.ts`

**Interfaces:**
- Consumes: existing `defineGenUIComponent`, existing ALL_DEFS order, `zod/v4`.
- Produces definitions with the exact names/schemas above; `CardChildUnion`, `ChatChildUnion`; final `ALL_DEFS`; package exports. No SFCs are wired yet.

- [ ] Step 1: Write failing contract test for all new names and union membership. Import defs from `../src/index`; assert exactly the new ref names and that `ALL_DEFS` starts with current ten names and appends new names in the order specified above.
- [ ] Step 2: Write failing tests for exact `Object.keys(def.props.shape)` of every new def, including nested `items`, `avatars`, `messages` objects.
- [ ] Step 3: Write failing tests that `ChatChildUnion.options` contains exactly `ChatMessageDef.ref`, `ChatMessagesDef.ref`, `ChatPaletteDef.ref`, `ChatReasoningDef.ref`, `ChatShimmerDef.ref`, `ChatToolDef.ref`; Phase A refs occur in `CardChildUnion.options` only via Phase A appended refs; Chat refs/Content refs do not occur in wrong unions.
- [ ] Step 4: Implement minimal defs/unions/exports in the three source files. Retain current import style and JSDoc/description tone. Every new description must state its exact contract and exclusions in one sentence. Keep the definitions modular enough to avoid the lazy-union initialization cycle; export `ChatChildUnion` as the six-ref union and use a lazy wrapper only inside `ChatPaletteDef.children`.
- [ ] Step 5: Run the targeted test. Expected: new contract tests pass and existing `pnpm --filter @nuxt-ui-genui/components test` passes.

**Verification:** `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components test`

## Task 2: Implement the Phase A client wrappers and exports

**Files:**
- Create: `packages/components/src/components/{Accordion,Avatar,AvatarGroup,Banner,Chip,Collapsible,Empty,Kbd,Separator,Skeleton}.vue`
- Modify: `packages/components/src/components/index.ts`

**Interfaces:**
- Consumes: Nuxt UI 4.12.0 SFCs with the exact installed names from the prior audit; existing wrapper convention in `Alert.vue` (`defineProps<{ props: ... }>()`).
- Produces: named default exports for all ten SFCs through `./sfc`.

- [ ] Step 1: Proceed directly to the SFC implementations in Step 2. No Node-level `.vue` import test belongs in this task; Task 4 owns the `renderSuspended` render assertions after these SFCs are wired.
- [ ] Step 2: Implement Accordion, Avatar, AvatarGroup, Banner, Chip, Collapsible, Empty, Kbd, Separator, and Skeleton as small client SFCs with `:props` object prop, named/default import from `@nuxt/ui/components/<Name>.vue`, defensive rendering for partial/streamed/missing props, no `class` prop pass-through, no slot HTML pass-through, no `v-html`, and no DOM APIs used on the server path.
- [ ] Step 3: Wire default exports in `src/components/index.ts` in the same new-def order.
- [ ] Step 4: Run `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components typecheck`, rerun `pnpm --filter @nuxt-ui-genui/components test`, and confirm the exports resolve before moving to integration coverage in Task 4.

**Specific behavior to implement:**
- Accordion: map `items` to Nuxt UI accordion items; omit `type` if absent; no interactive state ownership beyond Nuxt UI's normal uncontrolled behavior.
- Avatar/AvatarGroup: cap `max` at 8; render only declared avatars; icon/name fallbacks are text/icon, not raw markup.
- Collapsible/Empty/Kbd/Skeleton: show only safe label/icon/skeleton approximations; `lines` capped at 6; numeric dimensions clamped to 8–480px.
- Separator: absent label renders decorative divider; explicit orientation is passed through.

## Task 3: Implement Phase B client wrappers and own no runtime state

**Files:**
- Create: `packages/components/src/components/{ChatMessage,ChatMessages,ChatReasoning,ChatShimmer,ChatTool,ChatPalette}.vue`
- Modify: `packages/components/src/components/index.ts`

**Interfaces:**
- Consumes: Nuxt UI chat components and the schemas from Task 1; `useRenderNode()` from `@openuidev/vue-lang` only if ChatPalette needs to render children.
- Produces: named default exports for Chat SFCs through `./sfc`; no package-wide runtime `ai` dependency.

- [ ] Step 1: Ensure `packages/nuxt/test/expanded-components.test.ts` exists (create it here, or let Task 4 create it) with failing Phase A render assertions: Accordion marker, Empty marker, and Separator marker.
- [ ] Step 2: Write failing Phase B render assertions in that file: a synthesized `ChatMessages` program renders two deterministic `undefined`-free markers, and a `ChatTool` program renders its display text but no button/action element.
- [ ] Step 3: Implement `ChatMessage.vue`: synthesize a UIMessage-compatible object from index/props; render only the constrained role/text; preserve raw text interpolation/escaping done by Nuxt UI.
- [ ] Step 4: Implement `ChatMessages.vue`: build deterministic messages with ids `message-${index}`; pass sanitized status enum; missing/partial arrays render no uncaught error; cap rendered messages at 100.
- [ ] Step 5: Implement `ChatReasoning.vue`, `ChatShimmer.vue`, and `ChatTool.vue`: display-only wrappers; no events/callbacks/actions; ChatTool maps model `name` to the installed ChatTool `text` prop, with `suffix`/`icon`/`loading` only; do not attach `actions` slot or listeners.
- [ ] Step 6: Implement `ChatPalette.vue`: host-selected root shell only; renders `title` as a static label if present, `icon` through normal Nuxt UI icon handling, and calls render-node/children according to the project's existing wrapper convention; no input, send, retry, stop, history, command execution, or transport code.
- [ ] Step 7: Add explicit cross-root negative assertions in `expanded-components.test.ts`: a program putting `ChatTool(...)` under Card renders without its unique text/marker; a program putting `Accordion(...)` under ChatPalette renders without its unique marker.
- [ ] Step 8: Add default exports for the six Chat SFCs in `src/components/index.ts`, then rerun `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components typecheck` plus `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/nuxt test`.

## Task 4: Prove cross-root contracts and Nuxt integration

**Files:**
- Create: `packages/nuxt/test/expanded-components.test.ts`
- Modify: `packages/nuxt/test/fixtures/basic/nuxt.config.ts` only if alias resolution is required

**Interfaces:**
- Consumes: Task 1 definitions/exports, Task 2/3 SFCs, existing `@vitest-environment nuxt`, `renderSuspended`.
- Produces: integration evidence Card rejects chat-only widgets and ChatPalette rejects Phase A widgets.

- [ ] Step 1: Write failing Phase A Lang fixture: `root = Card("Expanded", [accordion, empty, separator])`, where at least Accordion/Empty render their visible markers.
- [ ] Step 2: Write failing Phase B Lang fixture with `createNuxtUILibrary({ root: 'ChatPalette', renderers: {...} })`: `root = ChatPalette([message, reasoning, shimmer, tool])`; assert markers and that no marker from the "Compose safely" Accordion fixture appears.
- [ ] Step 3: Write failing negative fixture: a Lang program that puts `ChatTool(...)` under Card renders without a tool marker; a Lang program that puts `Accordion(...)` under ChatPalette renders without an Accordion marker. This pins the wrapper-side cross-root boundary because the installed 0.4.x parser does not enforce union membership.
- [ ] Step 4: Write partial-stream test: unfinished `ChatMessages([])` / missing required `ChatMessage` text does not throw; initial placeholder behavior is visible or null according to the wrapper contract, but never crashes renderSuspended.
- [ ] Step 5: Run integration tests; rerun basic fixture to ensure original DEMO/WeatherCard registration remains valid.

**Verification:** `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/nuxt test`

## Task 5: Add usage/exclusion notes and prompt examples

**Files:**
- Create: `docs/nuxt-ui-expanded-components.md`
- Modify: `README.md` — only the status/component-scope wording; retain active planning/commands and ownership notes.

**Interfaces:**
- Consumes: final tested component set from Tasks 2–4.
- Produces: honest docs that say this is the approved subset, not public publication.

- [ ] Step 1: Document the supported Phase A display/feedback contracts and Phase B display-only chat wrappers. Include one Lang Card example and one Lang ChatPalette example. State that `ChatPalette` must be host-selected through `root: 'ChatPalette'` and is not a member of Card.
- [ ] Step 2: Document all exclusions (forms/quiz, overlays/CommandPalette, UError, arbitrary classes/HTML/URLs, privileged actions/tool execution) and the v1 lucide-icon policy.
- [ ] Step 3: Update README only if it does not contradict current commands or the protected planning-doc status. Do not call the package published or release-ready.

## Task 6: Final verification and handback

**Files:**
- No product files changed solely to satisfy this task; any failures return to their owning task.

- [ ] Step 1: Run `OPENUI_TELEMETRY_DISABLED=1 pnpm test`. Expected: all current suites plus new expanded tests pass; playground may still report no tests if unchanged.
- [ ] Step 2: Run `OPENUI_TELEMETRY_DISABLED=1 pnpm typecheck`. Expected: all projects exit 0.
- [ ] Step 3: Run `OPENUI_TELEMETRY_DISABLED=1 pnpm build`. Expected: all packages/playground finish; benign Rollup chunk-size warnings are reported as warnings, not hidden.
- [ ] Step 4: Run a scoped working-tree audit with `git status --short -- packages docs README.md`. Confirm no protected modified/untracked files under the plan doc/`task-1-review` paths are changed by this work.
- [ ] Step 5: Report: files changed, tests/commands run, exact results, remaining manual verification (live provider endpoint unverified), and that no commit/push/release happened without explicit approval.

## Spec Coverage Checklist

- Phase A display/feedback scope: Tasks 1, 2, 4.
- Phase B safe chat wrappers and host-selected ChatPalette: Tasks 1, 3, 4.
- Strict schemas/key order and copy-on-render: Tasks 1, 4, 6.
- `./sfc` client boundary: Tasks 2, 3, 6.
- No UError/forms/quiz/overlays/privileged actions: Global Constraints, Tasks 2–5.
- Verification through OpenUI Lang/vue-lang: Task 4.
- No release claims: Global Constraints, Tasks 5–6.

## Execution Handoff

Plan complete at `docs/superpowers/plans/2026-11-09-nuxt-ui-expanded-components.md`. Implementation remains unapproved until the user requests it. Recommended execution mode is subagent-driven because the Phase A/Phase B units have separate Reviewer gates and cross-root integration defects could silently leak scope across tasks.
