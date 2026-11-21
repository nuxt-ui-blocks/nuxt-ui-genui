# Nuxt GenUI — Expanded Nuxt UI Component Coverage (Phase A + B)

**Date:** 2026-11-09
**Status:** Implemented locally on `sp1-implementation` (expanded components phase, unpublished; build/typecheck/tests green as of 2026-11-09). Not merged, pushed, or released; no provider verification claimed.
**Context:** SP1 is complete locally on branch `sp1-implementation`. This design expands the built-in Nuxt UI 4.12.0 coverage beyond the SP1 alpha subset, keeping the OpenUI Lang contract stable.

## 1. Intent

Package the OpenUI/Vue/Nuxt UI stack as a more usable generative UI library, not merely prove that one deterministic SalesDashboard can render. The user requested “All Nuxt UI components,” then narrowed the immediate implementation to **Phase A + B**: display/feedback components first, the chat family next, navigation/tree afterward, overlays plus `CommandPalette` later.

This design does **not** attempt to expose every Nuxt UI component. App-shell, dashboard-shell, page/marketing, docs/blog, pricing, provider, layout, editor, and raw form/input primitives require different contracts and are excluded until separately scoped.

## 2. Goals and non-goals

### Goals

- Add a curated, OpenUI-safe batch of built-in Nuxt UI components.
- Keep every built-in definition serializable and server-safe; client renderers remain behind `./sfc` and SFC imports stay client-only.
- Preserve the Zod v4 positional-key wire format. Existing schema keys are never reordered or reshaped.
- Add Phase A display/feedback wrappers and Phase B chat-family wrappers.
- Preserve the current public component-registration pattern: `createNuxtUILibrary()`/`createGenUILibrary()` copy definitions before attaching renderers.
- Verify the new definitions through OpenUI Lang → vue-lang → Nuxt UI SFCs, not just unit rendering.
- Document which raw Nuxt UI components are deliberately excluded and why.

### Non-goals

- Forms, checkbox/radio/input/select flows, validation submission semantics, and quiz UX are not included without a separate approved design.
- No OpenUI Lang 1.0 APIs, React-parity work, or Vue renderer rewrite.
- No `CommandPalette`, modal, drawer, slideover, popover, context menu, or command actions in Phase A/B.
- No generic arbitrary classes, HTML, URLs, or executable content. Lucide icon names are unrestricted for v1 wrappers (unknown names render nothing via the icon provider), per user approval.
- `UError` is intentionally excluded from Phase A: `Alert color="error"` covers diagnostics without error-page semantics.
- No public publish, merge, or push without explicit approval.

## 3. Approaches considered

### A. Expose every installed Nuxt UI component directly

Rejected. It would produce 120+ model-callable definitions, including provider-only internals, dashboard chrome, page sections, marketing blocks, editor primitives, and unsafe interactive controls. It would also inflate prompts and make the allowlist unreviewable.

### B. Keep only the SP1 alpha set

Rejected. The current ten components prove the architecture but are too thin to make the library genuinely useful. The user explicitly asked for more components.

### C. Batched, explicitly OpenUI-safe expansion

Selected. Each new component gets:

- a conservative serializable `defineGenUIComponent` definition;
- client SFC wrapper using Nuxt UI 4.12.0 idioms;
- explicit action/state semantics only where OpenUI 0.4.2 can express them safely;
- tests at the definition and rendered-component layers;
- exclusion reasons for components that cannot preserve those invariants.

## 4. Phase A — display and feedback components

These components should be model-callable OpenUI components unless source inspection during implementation exposes an unsupported API or unsafe required slot.

| Component | Nuxt UI 4.12.0 | OpenUI-safe contract | Notes |
|---|---|---|---|
| `Accordion` | `UAccordion` | `items: [{ label, content }]`, optional `type: "single" \| "multiple"` | No arbitrary slot injection; string content only. |
| `Avatar` | `UAvatar` | `src?`, `alt?`, `text?`, `size?`, `icon?` | `src` is a browser URL/data URL; never rendered as HTML. |
| `AvatarGroup` | `UAvatarGroup` | `avatars: [{ src?, alt?, text? }]`, optional `max?` | Wrapper renders first N UAvatar children; no arbitrary child components. |
| `Banner` | `UBanner` | `title`, optional `icon?` | Informational inline banner. Wrapper supplies fixed title markup and does not expose Nuxt UI's `id`/storage persistence behavior. |
| `Chip` | `UChip` | `text`, optional `color?`, `size?` | Simple compact status; `variant` is not exposed because installed `UChip` has none. |
| `Collapsible` | `UCollapsible` | `label`, `content` | Wrapper renders a button trigger and string-only content; no nested OpenUI content. |
| `Empty` | `UEmpty` | `title`, optional `description?`, `icon?` | Empty-state display only. |
| `Kbd` | `UKbd` | `keys: string[]` | Keyboard hints only; no behavior. |
| `Separator` | `USeparator` | optional `label?`, `orientation?` | Purely visual. |
| `Skeleton` | `USkeleton` | optional `width?`, `height?`, `lines?` | Wrapper clamps/validates dimensions and synthesizes its own styles; no arbitrary CSS/classes. |

### Not included in Phase A

- `Toast` / `Toaster`: toast state and host-side effects require an app-level trigger contract; do not expose model-fired notifications yet.
- `UError`: Phase A omits it per user decision. `Alert color="error"` is sufficient for model diagnostics and avoids `clearError`/error-page semantics.
- `Icon`: no standalone model-callable `Icon` component in this phase. Icon fields introduced by approved wrappers accept unrestricted lucide names in v1.
- `Tooltip`: hover-only value and awkward streaming semantics; add later through an interaction design.
- Existing `Alert`, `Badge`, `Card`, `Chart`, `DataTable`, `Progress`, `TextContent`, `Button`, and `Buttons`: keep current APIs; do not re-key/re-shape schemas.
- `App`, `Container`, `Main`, `Header`, `Footer`, `Page*`, `Dashboard*`, `Sidebar`: app-shell/layout concerns, not model-generated content components.
- Marketing/pricing/blog/changelog/page blocks: templates, not primitives.

## 5. Phase B — chat family

Phase B is intentionally narrower than “wrap every chat SFC.” The installed components are runtime-aware Vue components, not plain strings or containers. The design therefore separates safe rendering from stateful chat control.

### B1. Safe model-callable chat display components

| Component | OpenUI-safe contract | Notes |
|---|---|---|
| `ChatMessage` | `role: "user" \| "assistant" \| "system"`, `text: string` | SFC constructs valid AI SDK/UIMessage-compatible state internally (`{ id, role, parts: [{ type: "text", text }] }`). No model-supplied IDs, metadata, provider tool calls, or arbitrary parts are accepted. |
| `ChatMessages` | `messages: [{ role, text }]`, optional `status?` | SFC constructs valid UIMessage-compatible objects and delegates viewport/scrolling to Nuxt UI. `status` is limited to `"ready" \| "submitted" \| "streaming" \| "error"`. |
| `ChatReasoning` | `text`, optional `streaming?` | Controlled disclosure/shimmer rendering; no provider metadata or arbitrary parts. |
| `ChatShimmer` | `text` | Direct wrapper around the shimmer primitive; no state. |
| `ChatTool` | `name`, optional `text`, `suffix?`, `icon?`, `loading?` | Static tool-call summary. `name` maps to Nuxt UI's `text` field; the installed component has no `name` prop. No model-supplied tool execution, command/network effect, or arbitrary actions prop. |
| `ChatPalette` | Dedicated model-callable chat root for standard `Card` generation when host sets `root: "ChatPalette"`; props: `children: ChatChildUnion[]` | Thin structural wrapper. It renders children only; it does not own prompt/input state or replace `ai`/`@ai-sdk/vue`/`DefaultChatTransport`. It is not a child under `Card`. |

### B2. Deliberately not model-callable in Phase B

- `ChatPrompt` and `ChatPromptSubmit`: these are input/submit controls with v-model semantics and host callbacks. Model-rendered controls would either be decorative or require a stateful action/form bridge that OpenUI 0.4.2 does not safely provide. They remain consumer-owned chat-shell components; Phase B may export them for manual composition but does not register them as model-callable components.
- `ChatTool` does not execute tools. Nuxt UI can render tool status, but OpenUI 0.4.2 cannot authorize arbitrary host tool calls. Privileged actions remain explicit, server-authorized host tools.
- `ChatMessages` may scroll/stream but cannot create or persist conversations. Persistence and transport remain app responsibilities.

### B3. Manual chat-shell export surface

If implementation confirms them, `@nuxt-ui-genui/chat` may export manual composition helpers/docs for `ChatPrompt` and `ChatPromptSubmit`; it does not create a chat runtime or replace `@nuxt-ui-genui/ai-sdk`.

## 6. Shared contracts and architecture

- `packages/components/src/defs.ts` remains the source of truth for built-in OpenUI definitions. `packages/components/src/unions.ts` exports the explicit reachable unions (`ContentChildUnion`, `CardChildUnion`, and `ChatChildUnion`). Existing schema key order stays untouched.
- New shared object schemas are inline literals, not virtual sub-components. For example:
  - `Avatar`: `{ src, alt, text }`, keys in declared order.
  - `ChatMessage`: `{ role, text }`, keys in declared order.
- New SFC prop objects receive the existing single `props` object. SFCs must bail to `null` while required props are absent.

Reachability is explicit and rooted in the built artifacts:
  - Phase A definitions are appended to `CardChildUnion`, making them valid only where `Card` allows children. `ContentChildUnion` keeps its SP1 members unchanged; this phase expands `CardChildUnion` rather than silently reclassifying feedback primitives as text content.
  - Phase B definitions form `ChatChildUnion = [ChatMessageDef, ChatMessagesDef, ChatPaletteDef, ChatReasoningDef, ChatShimmerDef, ChatToolDef]` and are valid only under `ChatPalette` as the dedicated chat root.
  - Chat widgets are not legal under `Card`, and Phase A widgets are not legal under `ChatPalette`.
  - Existing defs remain appended first; new entries follow them. `ALL_DEFS` remains the complete registry.
- `ChatPalette` is the host-selected chat root, not a Card descendant. A host using it initializes its own chat UI with `createGenUILibrary({ root: "ChatPalette" })`; normal generated-card generation continues to use the default `Card` root. `ChatPalette` itself does not own or update message/input state and does not replace the AI SDK chat transport/runtime.
- Client-only SFCs are exported via `./sfc`; server/Nitro never imports them.
- New chat components depend on Nuxt UI 4.12.0 and OpenUI/Vue idioms in client code. They do not add a runtime `ai` dependency to `@nuxt-ui-genui/components`; generated UIMessages use a local structural type or a type-only `ai` devDependency. They do not import OpenUI renderer internals.
- Generated `ChatMessage`/`ChatMessages` state gets deterministic UIMessage IDs derived from message index (sufficient for stable lists in this wrapper); no provider metadata or arbitrary parts are accepted.
- Phase A and Phase B receive separate prompt metadata groups (`Display & feedback`, `Chat`) rather than overloading the existing layout group.
- Descriptions are LLM-targeted and must describe exact behavior, allowed role vocabulary, units, and limits.

## 7. Error handling and safety

- Unknown component names still render `null` in the dev overlay, never throw.
- Invalid/missing required args are dropped by vue-lang; SFC guards handle partial streamed objects.
- URLs are not evaluated. `Avatar.src` and remote images are normal browser attributes; `TextContent` remains marked+DOMPurify.
- `ChatMessage` roles are constrained with `z.enum`; arbitrary role strings are rejected.
- `ChatTool` is display-only: no model-triggered tool execution.
- No `v-html` is added for new components.
- No `javascript:` URLs, executable scripts, or arbitrary classes from model output.

## 8. Testing and verification

Implementation increments phase A before phase B. For each batch:

1. Definition tests verify unique names, key order/wire format, and that refs/unions remain valid.
2. SFC smoke tests render required props and tolerate missing/partial props.
3. OpenUI Lang → `<NuxtGenUI>` fixture renders the new components through the real vue-lang path.
4. Chat wrappers test role/text mapping, enum rejection, streamed missing props, and display-only behavior.
5. Root verification: `pnpm test`, `pnpm typecheck`, `pnpm build` with `OPENUI_TELEMETRY_DISABLED=1`.

No claim of release-readiness, provider verification, or Lang 1.0 parity accompanies this work.

## 9. Incremental rollout

### Step 1 — Phase A definitions, SFCs, exports, tests

Definitions and wrappers for Accordion, Avatar, AvatarGroup, Banner, Chip, Collapsible, Empty, Kbd, Separator, and Skeleton.

### Step 2 — Phase A verification and prompt metadata

Update component groups/examples/additionalRules minimally, using the separate `Display & feedback` and `Chat` groups; run root build/typecheck/tests.

### Step 3 — Phase B display/chat definitions, SFCs, exports, tests

`ChatMessage`, `ChatMessages`, `ChatPalette`, `ChatReasoning`, `ChatShimmer`, `ChatTool`.

### Step 4 — Phase B chat-shell documentation only

Document the explicit host-selected `ChatPalette` root, the `ChatChildUnion` boundary, and the manual `ChatPrompt`/`ChatPromptSubmit` composition boundary; do not register them as model-callable. Generated message IDs are index-derived; components package must not add a runtime `ai` dependency.

### Step 5 — Navigation and overlays remain later work

Navigation/tree components start with their own task batch after Phase A+B is green. Overlays and `CommandPalette` require an interaction design first.

## 10. Review checklist

- Does every new def use `zod/v4` and preserve positional key order?
- Are all new components usable without model-supplied code?
- Are chat controls interactive only through host-owned state?
- Are exclusions documented in package README/spec?
- Did root build/typecheck/tests run, with output reported honestly?
- Does the final diff leave user-owned command/plan files untouched?
