# Nuxt GenUI Full Parity — Forms, Stateful, Overlays, Operations Center Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax. Keep `OPENUI_TELEMETRY_DISABLED=1` set on every command. No commit/push/publish without explicit user approval.

**Goal:** Deliver full Nuxt UI 4.12 generative coverage phased C–G on top of the SP1/expanded base, and prove it with a real run of the AI Operations Center playground.

**Architecture:** Serializable Zod component definitions (`@nuxt-ui-genui/components`) rendered client-side via `@nuxt-ui-genui/components/sfc`; server-safe prompt/registry in `@nuxt-ui-genui/core`; `<NuxtGenUI>` in `@nuxt-ui-genui/nuxt`. Wire format = Zod object key order (append-only). Actions round-trip through the host; side effects are server-authorized.

**Tech Stack:** Nuxt 4, Nuxt UI 4.12.0, @openuidev/lang-core 0.4.1 / vue-lang 0.4.2, zod/v4, AI SDK 6 (`ai`, `@ai-sdk/vue`), Vitest, pnpm workspace.

**Spec:** `docs/superpowers/specs/2026-11-11-nuxt-genui-full-parity-design.md`

## Global Constraints

- Never reorder/reshape existing Zod def keys; new defs are append-only.
- Defs stay serializable (no SFC/renderer imports); nitro never imports `./sfc`.
- SFC imports: `@nuxt/ui/components/<Name>.vue` only; wrappers enforce cross-root membership via name filters (`CHAT_CHILD_NAMES` pattern) since vue-lang 0.4.2 does not.
- https-only URLs at wrapper and host action boundaries; no model-generated JS/CSS/HTML.
- Validation lives in wrappers (Zod safeParse); server re-validates; values never forwarded to the model.
- Playground stays `ssr: false` (`<ClientOnly>` in module); `OPENUI_TELEMETRY_DISABLED=1`.
- Root verification: `OPENUI_TELEMETRY_DISABLED=1 pnpm test` and root `pnpm typecheck` / `pnpm build` stay green after every task.
- User-owned protected files (`docs/superpowers/plans/2026-11-08-nuxt-genui-sp1.md`, `task-1-review`) untouched; expanded A/B files are uncommitted by design.
- No push/publish/merge; no commit without explicit user approval (ask at end; leave worktree dirty).

## Review Focus

- Model emits a form field with a missing `name` → wrapper must drop/disable it (test).
- Model emits `values` containing wrong types for a rule (e.g. `min`) → client-side validation fails; server re-validates with zod and returns 400 (test).
- `submit_form` action under streaming arrival (partial payload) → wrapper no-ops until valid payload (test via shared action call path; verify no crash).
- Model nests `Form` or a chat component inside Card expecting cross-root legality → Card filter drops illegal children including both lists (test).
- Audit log JSONL corrupted/unreadable → `operations.get.ts` returns `{ events: [] }` plus 200, not a 500 (test by pointing at missing file in tmp dir — implement tolerate-missing).

---

## Phase C — Forms

### Task C1: Form + field definitions (serializable)
**Files:** Modify `packages/components/src/defs.ts` (append), `packages/components/src/unions.ts`, `packages/components/test/forms-defs.test.ts` (create).

- [ ] **Step 1:** Failing test `forms-defs.test.ts`: expect `ALL_DEFS` to contain `Form`, `FormInput`… no — model-facing names are Nuxt UI names: defs named exactly `Form`, `Input`, `Textarea`, `InputNumber`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `InputRating`. Assert prop key ORDER for `Form` = `formId`, `title?`, `submitLabel?`, `children`; for each field, first key = `name`; assert `Form` in ALL_DEFS and `FormChildUnion` members all appear.
- [ ] **Step 2:** Run `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components test -- forms-defs` → FAIL (missing defs).
- [ ] **Step 3:** Append defs in defs.ts (key order fixed):
  ```ts
  export const FormDef = defineGenUIComponent({
    name: 'Form',
    props: z.object({
      formId: z.string().describe('Stable unique id for this form instance'),
      title: z.string().optional(),
      submitLabel: z.string().optional(),
      children: z.array(FormChildUnion) // z.lazy union: Input|Textarea|InputNumber|Select|Checkbox|RadioGroup|Switch|Slider|InputRating
    }),
    description: 'A form. children MUST be form field components only. Values are validated in the renderer and submitted to the host via a submit_form action — never interpreted as code.'
  })
  ```
  Field defs: `Input { name, label?, placeholder?, defaultValue?: string, rules?: rulesSchema }` (import `rulesSchema` from `./rules`), `Textarea` same with `rows?: number`, `InputNumber { name, label?, placeholder?, defaultValue?: number, min?, max?, step?, rules? }`, `Select { name, label?, options: string[], defaultValue?: string, rules? }` (native select; never fetch options), `Checkbox { name, label?, defaultValue?: boolean, rules? }`, `RadioGroup { name, label?, options: string[], defaultValue?: string, rules? }`, `Switch { name, label?, defaultValue?: boolean }`, `Slider { name, label?, min?: number, max?: number, step?: number, defaultValue?: number }`, `InputRating { name, label?, max?: number, defaultValue?: number }`. Each description states "name is required and must be unique in the form; validation rules are enforced by the renderer".
- Also append `FormChildUnion` (define BEFORE the field defs using `z.lazy`-free union of the field props schemas — union of `*Def.props` is not right; define the union as `z.union([InputDef.props, …])` after defs, like existing unions) and extend `CardChildUnion` by adding `FormDef`? NO — keep Card-legal set unchanged for chat; Form is Card-legal (forms render under Card). Append `FormDef` to `CardChildUnion` members (keep order: CardChildUnion members appended after existing, not reordered). Add `FORM_FIELD_NAMES = ['Input','Textarea','InputNumber','Select','Checkbox','RadioGroup','Switch','Slider','InputRating'] as const` and `FormChildUnion` export; `unions.ts` re-exports both.
- [ ] **Step 4:** Run components tests → PASS.
- [ ] **Step 5:** Root typecheck (`OPENUI_TELEMETRY_DISABLED=1 pnpm typecheck`) → PASS.

### Task C2: Form SFC wrapper + genui-form provide/inject context
**Files:** Create `packages/components/src/components/Form.vue`, `packages/components/src/form-context.ts`; modify `packages/components/src/components/index.ts` (barrel), `packages/components/src/components/Card.vue` (extend filter to drop `Form`? NO — Card must KEEP Form; instead drop FORM_FIELD_NAMES and chat names — fields are only legal inside Form children, but wrapper-level: Form.vue filters its own children via FORM_FIELD_NAMES; Card.vue filter must now drop fields only (fields illegal directly under Card). Keep CHAT_CHILD_NAMES + add filter dropping FORM_FIELD_NAMES at Card level.

- [ ] **Step 1:** Test style from nuxt package: extend `packages/nuxt/test/render.test.ts` (or new `form-render.test.ts`): render `<NuxtGenUI :response="'root = Card(\'t\', [Form(\'f1\', \'T\', \'Send\', [Input(\'email\', \'Email\')])])'">` NO — Lang program syntax: mirror an existing render test case. Assert host `onAction` receives `{ type: 'submit_form', params: { formId, values } }` after the field's value is set via the input and the submit button clicked. If event simulation is brittle, instead test Form.vue in isolation with a mount: provide context, set value, click submit, assert `triggerAction('submit_form'…)` path through a mocked `useTriggerAction` (vi.mock). Prefer the mount approach for determinism.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement `Form.vue`: `provide('genui-form:<formId>', ctx)` where ctx = `{ values: reactive(record), setField(name, value), errors: reactive(record), validate(): boolean, submitLabel, title }`. Renders `<UForm :state="ctx.values">`-less — NO UForm (model-facing, keep thin): custom `<form @submit.prevent="onSubmit">` with optional `<h3>` title, default-slot-render of children, `<UButton type="submit" :label="submitLabel ?? 'Submit'" />`. `onSubmit`: validate every field collected via ctx (each field registers itself on mount with its rules); rules from `rulesSchema`: required/email/url/numeric/min/max/minLength/maxLength/pattern; on failure set ctx.errors[name]; on success call `useTriggerAction()` with `{ type: 'submit_form', params: { formId, values } }` (mirror Button.vue). Enforce children filter: only nodes whose typeName ∈ FORM_FIELD_NAMES render.
  - **Superseded 2026-11-15 (Option 2):** the "NO UForm / keep thin" decision above was reversed. `Form.vue` now renders Nuxt UI `UForm` (schema = `createGenUIStandardSchema` wrapping lang-core structured validators, `transform: false`); every generated field SFC renders `UFormField eager-validation` around its control. `eager-validation` is required because Nuxt UI inputs defer input validation (`deferInputValidation`) and otherwise a visible error does not clear while typing once submit has surfaced it. Eager validation before the first submit is suppressed via `:validate-on="submittedOnce ? ['input','blur','change'] : []"` and `validate-on-input-delay="0"`; `submittedOnce` flips on the `@error` (first invalid submit). Form rules are validated by lang-core `parseStructuredRules` + `validate` through a custom Standard Schema (`form-schema.ts`), NOT by Zod and NOT by a runtime-built object schema; the scalar-`false` required-checkbox wrapper is preserved inside it. Only current field children get validated/submitted; the pre-submit UX (no errors until first submit) and post-submit "error clears as soon as value becomes valid" behavior are enforced and test-covered (`packages/nuxt/test/form-render.test.ts`). `submit_form` payload shape is unchanged.
- Field SFCs (one file each, thin): `Input.vue`, `Textarea.vue`, `InputNumber.vue`, `Select.vue`, `Checkbox.vue`, `RadioGroup.vue`, `Switch.vue`, `Slider.vue`, `InputRating.vue` under `components/`. Each: props from def; on setup/mount injects `genui-form:*` — problem: formId unknown to field; instead Form provides a SINGLE `genui-form` key (only one form per Card typical) — keep simple: provide with key `genui-form` (single active form). Field registers `{ name, rules, getValue, setValue }`; renders UInput/UTextarea/etc. with `:model-value` + `@update:model-value` wiring to ctx. show inline error text when ctx.errors[name]. Use `hasAllProps(p, 'name')` guard. Each field SFC imports U* SFC directly.
- Update barrel `components/index.ts` to export all new SFCs. Update `Card.vue` filter: drop nodes whose typeName ∈ FORM_FIELD_NAMES (fields are illegal directly under Card); keep Form legal.
- [ ] **Step 4:** Run nuxt tests (`OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/nuxt test`) → PASS.

### Task C3: Server audit endpoint (operations)
**Files:** Create `apps/playground/server/api/operations.post.ts`, `apps/playground/server/api/operations.get.ts`; modify `apps/playground/app/pages/index.vue` later in Phase F (C3 only adds routes).

- [ ] **Step 1:** Test via route unit (vitest in playground? playground has no test harness for nitro routes — use `@nuxt/test-utils`? Not configured. Instead: implement validation helper `apps/playground/server/utils/audit.ts` exporting `recordOperation(input)` and `listOperations(limit)` with zod schema `z.object({ formId: z.string(), values: z.record(z.string(), z.unknown()) })`; write a node-only smoke test `apps/playground/test/audit.test.ts` run via vitest? Playground lacks vitest dep. ALTERNATIVE: verify via curl in Task F4 (end-to-end). For C3, acceptance = manual curl against dev server showing 400 on malformed body and 200 + JSONL append on valid body (evidence in log). Keep helper dependency-free (node:fs/promises, zod).
- [ ] **Step 2:** Implement `operations.post.ts`: read body, zod-validate; on fail → 400 `{ ok:false, error }`; else fs-append one line `JSON.stringify({ ts: Date.now(), formId, values })` to `.data/audit.jsonl` under app root (mkdir -p), return `{ ok: true }`. `operations.get.ts`: if file missing → `{ ok:true, events: [] }`; else read last N (default 50) parsed lines (tolerate bad lines) → `{ ok:true, events }`.
- [ ] **Step 3:** Start dev server, curl both routes (malformed + valid), show outputs.
- [ ] **Step 4:** `OPENUI_TELEMETRY_DISABLED=1 pnpm typecheck` → PASS.

### Task C4: Playground library wiring (Forms group + prompt metadata)
**Files:** Modify `apps/playground/app/lib/library.ts`, `apps/playground/app/lib/demo-program.ts` (only if needed), `packages/components/test/expanded-defs.test.ts` if it enumerates names (it likely snapshots ALL_DEFS count — update expected list).

- [ ] **Step 1:** Add `componentGroups` entry: `{ name: 'Forms', components: ['Form','Input','Textarea','InputNumber','Select','Checkbox','RadioGroup','Switch','Slider','InputRating'], notes: ['Use Form as a single child of Card. Form children are fields only. Every field needs a unique name. Values submit to the host via submit_form; the host validates and records them. Never emit raw HTML or inline JS in values.'] }`; include new SFCs in `createPlaygroundLibrary(renderers)` mapping; add `additionalRules` line: "Forms: emit one Form with FormChildUnion children; always include name on every field."
- [ ] **Step 2:** Update any test asserting def count (search `ALL_DEFS` count in tests; bump from 26 to 36). Run `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components test` → PASS.
- [ ] **Step 3:** Manual: dev server + temporary prompt tweak — defer to Phase F for real proof.

## Phase D — Stateful display

### Task D1: Tabs / Stepper / Timeline / Breadcrumb defs + SFCs
**Files:** Defs appended in defs.ts; new SFCs `Tabs.vue`, `Stepper.vue`, `Timeline.vue`, `Breadcrumb.vue`; barrel; nuxt render test.

- [ ] defs (append): `Tabs { items: z.array(z.object({ label: z.string(), content: z.string() })), defaultIndex?: number }` — content is plain text/markdown (TextContent rules; never raw HTML); `Stepper { items: z.array(z.object({ title: z.string(), description: z.string().optional() })), current?: number }`; `Timeline { items: z.array(z.object({ title: z.string(), description: z.string().optional(), date: z.string().optional() })) }`; `Breadcrumb { items: z.array(z.object({ label: z.string(), url: z.string().url().optional() })) }` (https-only enforced in SFC: non-https urls render as text). Add to CardChildUnion (append). `Tabs.vue` uses UContent? NO — local `ref(current)` state + UButton/USeparator-based list? Use `@nuxt/ui/components/Tabs.vue` with v-model; content string rendered via existing marked+DOMPurify pipeline? Simpler: render content with same `TextContent`-style markdown component — reuse `TextContent.vue` internals by importing it? TextContent is model-bound SFC; instead replicate minimal markdown→safe HTML via `render-markdown` helper (extract from TextContent.vue into `src/markdown.ts` used by both). Test: mount Tabs.vue with two items, click second tab, assert visible content switch.
- [ ] Stepper/Timeline: stateless except local `current` for Stepper (`v-model` internal, default 0, clamped); Timeline pure display (UTimeline). Breadcrumb: UBreadcrumb with items mapped (https-only guard).
- [ ] nuxt test: render program containing Tabs; assert no crash and tab labels appear.
- [ ] Verify: components test + typecheck + nuxt test green.

## Phase E — Self-contained overlays

### Task E1: Modal / Slideover / CommandPalette defs + SFCs
**Files:** defs append; SFCs; barrel; nuxt test.

- [ ] defs (append): `Modal { title?: string, triggerLabel: string, content: string, defaultOpen?: boolean }`; `Slideover` same shape; `CommandPalette { items: z.array(z.object({ label: z.string(), icon: z.string().optional(), url: z.string().optional(), message: z.string().optional() })) }`. Add to CardChildUnion (append). SFCs: local `ref(open)` — NO model v-model; UButton trigger; content markdown via shared markdown helper; Modal/Slideover render `@nuxt/ui/components/Modal.vue` / `Slideover.vue` with `v-model:open`. CommandPalette: UButton trigger "⌘K"+input? Keep v1 honest: UCommandPalette is triggerless; wrap: UButton + `<LazyUCommandPalette v-model:open="open" :items="mapped" @update:open>` selecting item: url https-only → window.open; else emit continue_conversation via triggerAction(label, undefined, { type: 'continue_conversation', params: { context: message } })? For simplicity: dispatch `{ type:'continue_conversation', params:{ context: message } }` only when message set (mirrors free-text flow); url items open new tab.
- [ ] nuxt test: mount CommandPalette.vue, click item with message, assert onAction receives continue_conversation. Components test for defs present.
- [ ] Verify all three suites green.

## Phase F — AI Operations Center playground

### Task F1: Mock program library (keyword-routed)
**Files:** Rewrite `apps/playground/app/lib/demo-program.ts` → export `DEMO_PROGRAMS: Record<string, string>` with keys `launch`, `incident`, `vendor`, `kpi`, `deploy`, `approval`, `default`; each a full valid Lang Card program exercising Phase C/D/E components (e.g. launch → StatsCards + Progress + Form(approval) + Timeline). Export `pickProgram(prompt: string): string` matching keywords case-insensitively, fallback `default`.

### Task F2: Chat endpoint provider switch
**Files:** Modify `apps/playground/server/api/chat.post.ts`: `const live = process.env.GENAI_LIVE === '1' || (process.env.GENAI_API_KEY && process.env.GENAI_BASE_URL)`; if live → same createOpenAI path (never claim Thesys/hosted verification; label in UI); else mock streamText with system prompt + `onFinish` picking program by user text → but MockLanguageModelV3 streams FIXED text; for keyword routing use `MockLanguageModelV3` with `doStream` returning dynamic streamText of picked program — mirror existing DEMO_PROGRAM usage: pass `text: pickProgram(lastUserText)` via the mock's stream (inspect existing chat.post.ts mock construction and adapt — keep stepCountIs(1)).

### Task F3: Operations Center page (host-owned chrome)
**Files:** Rewrite `apps/playground/app/pages/index.vue`, `apps/playground/app/app.vue` (keep), `apps/playground/nuxt.config.ts` (unchanged core keys).

- [ ] Host-owned header (title "Nuxt GenUI — Operations Center", provider badge "mock"|"live (local gateway)"), left sidebar listing operations (static links scrolling to doc anchors or prompt buttons emitting preset prompts), main chat column with existing UChatPalette/UChatMessages/UChatPrompt/UChatPromptSubmit pattern, right panel "Operations audit log" (fetches `/api/operations` every 5s or on mount; renders time + formId + pretty-printed values; empty state).
- [ ] Messages persistence: `localStorage` save/restore (best-effort; try/catch).
- [ ] Provider switcher: `<select>` in header bound to `useLocalStorage` or ref+query — v1 honest: display only "mock (deterministic)" badge; live mode requires env, set before launch; do NOT fake a toggle that does nothing.
- [ ] `handleAction`: extend for `submit_form` → POST to `/api/operations` with `{ formId, values }` (no model round trip); on ok, show toast via UToast? use console + inline status text ("Recorded approval #n") — avoid UApp dependency if absent; else keep simple status div.
- [ ] Template uses `<NuxtGenUI :key="status" :library :response :is-streaming="status==='streaming'" :on-action="handleAction" />` inside assistant message slot (pattern already in index.vue — preserve).

### Task F4: End-to-end proof
- [ ] Start dev server in background; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` → 200 evidence.
- [ ] Scripted POST to `/api/chat` with launch prompt (body `{ messages:[{role:'user',parts:[{type:'text',text:'launch readiness review'}]}] }`): capture response stream, assert it contains `Card(` and `Form(`.
- [ ] POST `/api/operations` valid payload → 200; invalid → 400. GET `/api/operations` → shows the recorded event (print JSON).
- [ ] Root build/typecheck/test green; paste tails.

## Phase G — Packaging + docs honesty

### Task G1: defs.ts split
**Files:** `packages/components/src/defs/{base,forms,stateful,overlays}.ts` + re-exporting `defs.ts` (`export * from './defs/base'` etc., preserving ALL_DEFS array order) — move Chart..ChatTool → base, new Forms/Stateful/Overlays into their files; `ALL_DEFS` assembled in `defs.ts` in current order. Update imports of unions/types everywhere (they stay importing from `./defs`).

- [ ] Verify `pnpm --filter @nuxt-ui-genui/components test && pnpm typecheck && pnpm build`.

### Task G2: README/AGENTS honest notes
**Files:** `README.md` (add: Vue runtime pre-1.0/Lang 0.x, SSR unverified (`ssr:false`), telemetry opt-out, publish gates, honest provider status), `AGENTS.md` (update component count + phases C–G, spec/plan paths). NO release claims.

## Done When

- [ ] Root `pnpm build`, `pnpm typecheck`, `pnpm test` green.
- [ ] Operations Center runs; mock chat renders generated UI incl. Form; `submit_form` round-trips to `.data/audit.jsonl` (evidence shown); provider switch honestly labeled; WeatherCard still works.
- [ ] No commits/pushes/publishes without user approval; report what is verified vs not (hosted providers, SSR, publish).

## Status snapshot (2026-11-11, end of implementation session)
Tasks C1-C4, D1, E1, F1-F4, G1 (defs split done: defs.ts assembler -> defs/{base,forms,stateful,overlays,display}.ts) and G2 are implemented and verified; Goal evidence: root build/typecheck green; root test green (components 41, nuxt 55, chat 6, ai-sdk 5, core 8); prod-run verified (PORT 3001): GET / 200, /api/operations upload allowlist enforced (415 on bad MIME), uuid refs returned, audit log round-trip verified in a real browser session.
Expanded coverage since plan was written: wave 2 (SelectMenu, PinInput, InputTags, ColorPicker, User, Pagination, NavigationMenu, Tree, Popover, DropdownMenu, ContextMenu, Drawer), date/file wave (InputDate, InputTime, FileUpload), Toast/Tooltip/Calendar, Table (UTable-backed inline object rows), Listbox, Marquee, CheckboxGroup. 65 allowlisted defs. DataTable kept alongside Table; positional matrix contract frozen; striped added to both. InputMenu explicitly deferred (single-field autocomplete not safely validatable in installed types). FieldGroup rejected (slot-grouping cannot be encoded safely).
packages/chat and @nuxt-ui-genui/ai-sdk are real adapters (6/6 and 5/5 tests). Playground uses them.
Honest limits: SSR verified impossible upstream (vue-lang <Renderer> emits empty wrapper under renderToString; packages/nuxt/test/ssr.test.ts documents; ssr:false stays). Live path blocked on user credentials (GENAI_LIVE=1 + baseURL/model/key). Nothing is committed/pushed/merged/published without explicit user approval.
