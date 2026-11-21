# Nuxt GenUI Full-Parity Design (2026-11-11)

Binding design for completing `@nuxt-ui-genui/*` as a public Nuxt 4 + Nuxt UI 4 generative-UI framework and the **Nuxt GenUI Operations Center** reference app.

## Goals (user-directed)

1. Framework foundation: serializable allowlisted component registry → system prompt → OpenUI Lang stream → client-only renderer; server/Nitro never imports SFCs or renderer internals.
2. Nuxt UI 4.12 coverage: every in-scope component addressed under explicit architecture — nothing silently missing, nothing unsafe.
3. Excellent AI Operations Center reference app with a real run (deterministic mock by default; opt-in generic OpenAI-compatible endpoint via env; never claim hosted-provider verification without a run).

## Non-goals / model-facing exclusions

These stay **host-owned**, documented in README/library notes; they are NOT in the model-facing allowlist:

- App-shell/page chrome: `App`, `Theme`, `Main`, `Container`, `Page*`, `Dashboard*`, `Sidebar`, `Header`, `Footer*`
- Marketing/content: `Pricing*`, `Blog*`, `Changelog*`
- Content/MDX renderers: all `Prose*`, `Content*` (conditional modules; user does not render model markdown at full trust)
- `ColorMode*`, `LocaleSelect` (global side effects), `Editor*` (tiptap stack), `AuthForm`, `Error`, `Link` as free-form navigation

Included but restricted: `open_url` links are https-only and host-enforced. Breadcrumb/Navigation display components may link https-only.

## Architecture

- `@nuxt-ui-genui/core` — server-safe: `defineGenUIComponent`, `createGenUILibrary`, `generateGenUISystemPrompt`. zod/v4 only. No Vue.
- `@nuxt-ui-genui/components` — serializable defs (`src/defs.ts`, split into `defs/{base,forms,stateful,overlays}.ts` re-exported as `ALL_DEFS`); SFC renderers in `src/components/*.vue` behind `./sfc`. SFCs import `@nuxt/ui/components/<Name>.vue` directly (requires Nuxt module context so `#build/ui/*` resolves).
- `@nuxt-ui-genui/nuxt` — module registers `<NuxtGenUI>` only; runtime wraps `@openuidev/vue-lang` Renderer in `<ClientOnly>`; https-only `open_url` bridge; `onAction` forwarding.
- `apps/playground` — reference app + proof harness (`ssr: false` until Renderer SSR is verified; honestly documented).
- Wire format = zod object key order; new defs append-only; never reorder/reshape existing defs.

## Security model

- Allowlist is the boundary; unknown names are dropped. No eval, no model JS/CSS/classes/templates.
- Model output is untrusted props: wrappers clamp/validate locally.
- Side effects (mutations, navigation, uploads, overlays) flow through `onAction` to the host; the host authorizes and executes server-side (generic `submit_form` handler validates zod again and appends to an audit log; no privileged call is model-authored).
- Validation lives in wrappers (zod `safeParse`); never in generated code.
- https-only URLs enforced at wrapper + host boundaries.
- `OPENUI_TELEMETRY_DISABLED=1` in all repo automation/docs.

## Action model (extends SP1)

Existing: `open_url` (https-only), `continue_conversation`, custom `{ type, params }` forwarded to host `onAction` (`useTriggerAction`).

Phase C adds: `submit_form { formId, values }` — dispatched by Form wrapper; values validated client-side first; server re-validates and logs. Host never forwards raw values to the model.

## Phases

### Phase C — Forms (new, first)
Defs: `Form` `{ formId, title?, submitLabel?, children: FormChildUnion[] }`; fields with required `name` (first key), optional `label?`, `placeholder?`, `defaultValue?`, `min?`, `max?`, `minLength?`, `maxLength?`, `pattern?`, `required?` (flattened scalars, positional args stay simple), `rules?` (`rulesSchema`):
`FormInput`(text), `FormTextarea`, `FormNumber`, `FormSelect` (native select, options from `options: string[]`), `FormCheckbox`, `FormRadioGroup` (options), `FormSwitch`, `FormSlider` (min/max/step), `FormRating`. (Prefix `Form*` avoids name clashes with host layout components and keeps the wire names grep-able.) Hmm — keep short names per repo convention? Defs use Nuxt UI names (`Input` etc.). Decision: use Nuxt UI base names (`Input`, `Textarea`, `InputNumber`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Slider`, `InputRating`) with `FORM_FIELD_NAMES` used only inside Form context; Form wrapper filters children to field names. This matches existing naming (Button, Card) and the future public API.
Form wrapper provides/injects `genui-form:<id>` context (value store, rules, submit); cross-root children filtered via `FORM_FIELD_NAMES`.
Prompt metadata: `componentGroups` `Forms` group + additionalRules ("Form children are field components only; submit via host tools; validation is local; no HTML").
Server route in playground: `server/api/operations.post.ts` — zod-validates `{ formId, values }`, appends to `.data/audit.jsonl`; `operations.get.ts` lists events.

### Phase D — Stateful display (client-local state, no v-model from model)
`Tabs` `{ items: [{ label, content }], ... }` (content = markdown string, sanitized via TextContent path? No — plain text render to avoid duplicate v-html surface: render raw text). `Stepper` `{ items: [{ title, description? }] }` local step state. `Timeline` `{ items: [{ title, description?, date? }] }`. `Breadcrumb` `{ items: [{ label, url? }] }` https-only urls.

### Phase E — Self-contained overlays (local open state, https-only actions)
`Modal` `{ title?, triggerLabel, content, defaultOpen? }`, `Slideover` same shape, `CommandPalette` `{ items: [{ label, icon?, url?, message? }] }` with embedded UButton trigger; `url` https-only; `message` → `continue_conversation`. Host-orchestrated overlays (`useOverlay`) are documented host API only.

### Phase F — AI Operations Center playground
Host-owned chrome (header/sidebar); chat via `UChatPalette` family + `@ai-sdk/vue` `new Chat({})`; `<NuxtGenUI>` generated canvas; provider switch (mock | `GENAI_LIVE=1` + `GENAI_API_KEY`/`GENAI_BASE_URL`, generic OpenAI-compatible); persisted messages; audit-log panel fed by `operations.get`; keyword-routed deterministic mock programs (launch readiness, incident response, vendor comparison, KPI review, deployment plan, approval → multi-step form → operations.post). WeatherCard custom-component proof retained.

### Phase G — Packaging & docs
`defs.ts` split (no reorder of existing props; ALL_DEFS order preserved); README + AGENTS.md updated honestly (Vue runtime pre-1.0; SSR unverified; no live provider claimed; telemetry opt-out); playground build/test/run evidence; **no publish/push/merge/commit without explicit user approval** (commits included).

## Verification gates (each phase)

- `OPENUI_TELEMETRY_DISABLED=1 pnpm --filter @nuxt-ui-genui/components test`
- root `pnpm typecheck`, `pnpm build`, `pnpm test`
- final: dev or preview server, HTTP 200, and scripted evidence of mock chat → rendered program → form submit → audit log entry (curl against dev server).

## Status snapshot (2026-11-11, end of implementation session)
Executed and verified: Phases C, D, E, F, G plus repeated follow-on waves (wave 2: SelectMenu/PinInput/InputTags/ColorPicker/User/Pagination/NavigationMenu/Tree/Popover/DropdownMenu/ContextMenu/Drawer; date/file wave: InputDate/InputTime/FileUpload; toast/tooltip/calendar wave; Table/Listbox/Marquee wave; CheckboxGroup).
Defs split DONE (defs.ts assembler -> defs/{base,forms,stateful,overlays,display}.ts). 65 allowlisted defs. DataTable positional kept alongside new UTable-backed Table (striped on both; DataTable wire contract frozen). FileUpload = model-facing field with immediate host-authorized upload to /api/operations/upload (multipart allowlist, .data/uploads/<uuid>.txt, metadata refs only).
@nuxt-ui-genui/chat and @nuxt-ui-genui/ai-sdk are real adapters used by the playground (createGenUIChat / collectAssistantText; streamGenUI / resolveGenUILive).
Honest limits stand: vue-lang 0.4.x <Renderer> emits an empty SSR wrapper (verified via renderToString; see packages/nuxt/test/ssr.test.ts); ssr:false remains. Live provider path requires GENAI_LIVE=1 + a generic OpenAI-compatible endpoint and is NOT verified against any hosted provider (deterministic MockLanguageModelV3 path is the default). FieldGroup/all app-shell/marketing/prose/color-mode/Editor/AuthForm/Table-vs-select etc remain documented host-owned exclusions; InputMenu explicitly deferred with rationale documented in README. Nothing is committed/pushed/published; that requires explicit user approval.
Verification: root build/typecheck green; root test green (components 41, nuxt 55, chat 6, ai-sdk 5, core 8); prod build (PORT 3001) GET / 200, upload route verified incl. 415, audit log round-trip verified in a real browser session; SSR spike tests green.
