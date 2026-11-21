# Expanded Nuxt UI Component Coverage (Phase A + B)

**Status:** Documentation of the approved subset as implemented on the `sp1-implementation` working tree. This project is **unpublished alpha** — the `@nuxt-ui-genui/*` packages are not on npm, the API is unstable, and no release or provider-verification claim is made or implied. The live model path remains unverified against any hosted provider; only the deterministic demo path is tested.

**Source of truth:** installed `@nuxt/ui@4.12.0`, `@openuidev/vue-lang@0.4.2` / `@openuidev/lang-core@0.4.1`, and this repo's `packages/components/src/defs.ts`. Where prose disagrees with the installed stack or the code, the code wins.

Design context: `docs/superpowers/specs/2026-11-09-nuxt-ui-expanded-components-design.md`. SP1 baseline: see the root [README](../README.md).

## Scope and wire-format ground rules

- OpenUI Lang positional arguments follow **Zod object property order**. Reordering or reshaping a schema breaks the wire format. Existing definitions are append-only and never re-keyed.
- Built-in component definitions are serializable (`zod/v4`) and server-safe. Vue SFCs live behind `./sfc` and are **client-only**; Nitro/server code must never import them.
- `createNuxtUILibrary({ root, renderers })` defaults `root: 'Card'`. The host selects the root; the model never does.
- No model-generated JavaScript or Vue templates are ever evaluated. Privileged actions go through explicit, server-authorized host tools.
- `ALL_DEFS` is the complete built-in registry. `ContentChildUnion` is unchanged from SP1; Phase A extended `CardChildUnion`; Phase B forms `ChatChildUnion`.

## Phase A — display and feedback components (Card children)

Valid under `Card` (via `CardChildUnion`). All string content is rendered as text; no raw HTML, no arbitrary classes, no nested OpenUI children unless explicitly noted.

| Component | Props (wire order) | Notes and limits |
|---|---|---|
| `Accordion` | `items: [{ label, content }]`, optional `type?: "single" \| "multiple"` | String-only `content`; blank-label items are dropped; empty item lists render nothing. No slot injection or nested components. |
| `Avatar` | `src?`, `alt?`, `text?`, `size?`, `icon?` | `src` is a browser image URL/data URL, never rendered as HTML. Renders nothing unless at least one of `src`/`alt`/`text`/`icon` is usable. |
| `AvatarGroup` | `avatars: [{ src?, alt?, text? }]`, optional `max?` | Renders up to `max` avatars (`max` clamped to 1–8). Entries with no usable field are dropped; renders nothing when empty. No arbitrary child components. |
| `Banner` | `title` (required), optional `icon?` | Informational inline banner only. No dismiss actions, persistence, or raw HTML. |
| `Chip` | `text` (required), optional `color?`, `size?` | Compact status display (`standalone`). `variant` is not exposed — the installed `UChip` has none. No actions or events. |
| `Collapsible` | `label`, `content` (both required) | Display-only disclosure. `content` is string-only; no nested OpenUI components, no slot injection. |
| `Empty` | `title` (required), optional `description?`, `icon?` | Empty-state display only; no actions or slot content. |
| `Kbd` | `keys: string[]` | Visual key hints. Blank/non-string keys dropped; at most 12 key caps rendered. No key bindings or behavior. |
| `Separator` | optional `label?`, optional `orientation?: "horizontal" \| "vertical"` | Purely visual divider. Decorative when no `label` is set. |
| `Skeleton` | optional `width?`, `height?` (pixels), `lines?` | Placeholder only. Width/height clamped to 8–480px; `lines` clamped to 1–6 (default 1); synthesizes its own styles — no model-supplied CSS or classes. |

Model-callable Phase A components compose under `Card` exactly like SP1's existing content components.

## Phase B — display-only chat wrappers (ChatPalette children)

Valid only under a host-selected `ChatPalette` root (via `ChatChildUnion`) — never under `Card`, which filters the six names out. These are **display-only**: they render conversation state supplied as props. They do not own prompt/input state, do not send or persist messages, and do not replace `@ai-sdk/vue` / `DefaultChatTransport` or any host chat runtime. `ChatChildUnion` is the complete allowlist and includes `ChatPalette` itself, so nesting `ChatPalette` inside `ChatPalette` is legal by implementation/contract; everything else is filtered out by the wrapper.

| Component | Props (wire order) | Notes and limits |
|---|---|---|
| `ChatMessage` | `role: "user" \| "assistant" \| "system"`, `text` (required) | Single display-only message. The wrapper synthesizes an index-derived id (`message-0`); no model-supplied IDs, metadata, provider tool calls, or arbitrary parts. Renders nothing without a valid `role` and string `text`. |
| `ChatMessages` | `messages: [{ role, text }]`, optional `status?: "ready" \| "submitted" \| "streaming" \| "error"` | Display-only list; delegates viewport/scrolling to Nuxt UI. Rendered messages are capped at the first **100** entries, with index-derived ids (`message-<index>`). Entries with an unknown `role` or non-string `text` are dropped; an invalid `status` is dropped. No transport, persistence, or actions. |
| `ChatPalette` | `children: ChatChildUnion[]`, optional `title?`, optional `icon?` | Host-selected chat root. Renders children only; does not own prompt/input state, does not send, persist, or stream. Never a child of `Card` and not a member of `CardChildUnion` or `ContentChildUnion` — the host selects it as the root. Within a `ChatPalette` program it is an allowlisted child of itself: `ChatChildUnion` includes `ChatPaletteDef.ref` by implementation/contract, so the model may nest it as a child. |
| `ChatReasoning` | `text` (required string), optional `streaming?: boolean` | Display-only reasoning disclosure. The wrapper renders nothing when `text` is missing, not a string, or zero-length (whitespace-only text passes through); that is wrapper handling, not a schema constraint. No provider metadata, parts, or actions. |
| `ChatShimmer` | `text` (required string) | Display-only loading shimmer. The wrapper renders nothing when `text` is missing, not a string, or all-whitespace (it trims only to check emptiness); that is wrapper handling, not a schema constraint. No state, actions, or callbacks. |
| `ChatTool` | `name` (required), optional `text?`, `suffix?`, `icon?`, `loading?: boolean` | Display-only static tool summary. See the contract below. No tool execution, actions, URLs, or callbacks. |

### ChatTool `name` / `text` contract (as implemented)

The installed `UChatTool` has no `name` prop; the model-facing `name` arrives as an OpenUI model artifact and is **mapped to the component's `text` prop** for display. The optional model-supplied `text` is a **display override**:

1. If `text` is a string with non-whitespace content, the trimmed `text` is displayed.
2. Otherwise the trimmed `name` is displayed (fallback).
3. If neither yields a usable string, the wrapper renders nothing.
4. `name` remains required by the OpenUI schema and is otherwise unused for anything but the display mapping. `suffix`, `icon`, and `loading` are passed through as display-only props.

There is no execution path: the model cannot call tools through `ChatTool`. Privileged actions remain explicit, server-authorized host tools.

## Root selection: Card vs ChatPalette

`ChatPalette` is the only chat root and must be **host-selected**: `createNuxtUILibrary({ root: 'ChatPalette', renderers: { … } })`. Normal generated-card output continues to use the default `root: 'Card'`. `ChatPalette` is never a child of `Card` and is not a member of `CardChildUnion` or `ContentChildUnion`; the host selects it as the root. Within a `ChatPalette` program it is an allowlisted child of itself — `ChatChildUnion` includes `ChatPaletteDef.ref` by implementation/contract, so the model may nest it as a child. A `Card` program can never emit the six chat components (the Card wrapper filters them out), and a `ChatPalette` program never emits Card content components (the ChatPalette wrapper allows only the six).

## Cross-root enforcement (installed 0.4.x stack)

`@openuidev/vue-lang@0.4.2` / `lang-core@0.4.1` do **not** reject out-of-union element references at parse or render time — the `CardChildUnion` / `ChatChildUnion` / `ContentChildUnion` schemas describe the legal wire shape but are not enforced as an element-ref gate in this stack. The enforced boundary is **wrapper-side**:

- `Card.vue` filters out the six chat-only component names (`ChatMessage`, `ChatMessages`, `ChatPalette`, `ChatReasoning`, `ChatShimmer`, `ChatTool`) — they never render under `Card`.
- `ChatPalette.vue` allowlists exactly those six names — anything else (e.g. Phase A widgets) never renders under `ChatPalette`.

Non-element children and unrecognized node shapes pass the filter untouched (vue-lang handles or drops them). Treat the unions as the schema contract and the wrapper filters as the runtime enforcement; both are pinned by tests in `packages/nuxt/test/expanded-components.test.ts` and `packages/components/test/expanded-defs.test.ts`. Do not rely on the parser to reject cross-root references.

## Examples

### Card (default root) — one Lang program

```
root = Card("Deploy Status", [status, divider, skeleton, note])
status = Banner("Release 4.12.0 shipped", "lucide:rocket")
divider = Separator("Checks")
skeleton = Skeleton(240, 16, 2)
note = TextContent("Rollout completed with **zero** errors.")
```

Renders through `<NuxtGenUI :library="createNuxtUILibrary({ renderers })" :response="…" />` with the default `root: 'Card'`. Note the positional argument order matches the Zod schema key order: `Banner(title, icon?)`, `Separator(label?, orientation?)`, `Skeleton(width?, height?, lines?)`.

### ChatPalette (host-selected root) — one Lang program

Host setup (client side, renderers omitted for brevity):

```ts
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { ChatPalette, ChatMessages, ChatTool, ChatShimmer } from '@nuxt-ui-genui/components/sfc'

const library = createNuxtUILibrary({
  root: 'ChatPalette',
  renderers: { ChatPalette, ChatMessages, ChatTool, ChatShimmer }
})
```

```
root = ChatPalette([feed, tool, shimmer])
feed = ChatMessages([{ role: "assistant", text: "Deployed 4.12.0 to production." }], "ready")
tool = ChatTool("deploy_production", "Deployed to production")
shimmer = ChatShimmer("Verifying health checks")
```

`ChatPalette` here is the root selected by the host — not a Card child. `ChatTool("deploy_production", "Deployed to production")` displays the `text` override; without the second argument it would display `deploy_production`. Nothing in this program executes a deployment; tool execution is the host's job.

## Exclusions (deliberately unsupported)

- **Forms and quiz UX** — no inputs, selects, checkbox/radio flows, validation/submission semantics, or quiz components. OpenUI 0.4.x cannot safely bridge model output into form submission semantics here; requires a separate approved design.
- **Overlays and `CommandPalette`** — no modals, drawers, slideovers, popovers, context menus, tooltips, or command actions. Overlays require an interaction design first; `Tooltip` has hover-only value and awkward streaming semantics.
- **`UError`** — intentionally excluded. Use `Alert` with `color="error"` for model diagnostics; `UError` carries error-page/`clearError` semantics that do not fit generated content.
- **Arbitrary classes, HTML, and URLs** — no model-supplied CSS classes, `v-html`, raw HTML, or executable markup anywhere. The only URL-like inputs are normal browser attributes (e.g. `Avatar.src`) and the SP1 `Button` `open_url` action (a plain string URL passed to the host's action handler). The playground's prompt rules ask models for https URLs — that is playground prompt guidance, not library-wide or schema-enforced behavior; nothing in the library validates the scheme. `TextContent` remains marked + DOMPurify. There is deliberately no model-callable standalone `Icon` component; icon fields on approved wrappers are inert names resolved by the icon provider, never evaluated.
- **Privileged actions and tool execution** — `ChatTool` is display-only and cannot call tools. Buttons/actions go through explicit, server-authorized host tools; the model never receives ambient authority.
- **ChatPrompt / ChatPromptSubmit** — input/submit controls with v-model and host callbacks. They remain host-owned chat-shell components and are **not registered as model-callable** components in Phase B.
- **Toast / Toaster** — toast state and host-side effects require an app-level trigger contract; not exposed.
- **App-shell and page/marketing blocks** — `App`, `Container`, `Main`, `Header`, `Footer`, `Page*`, `Dashboard*`, `Sidebar`, pricing/blog/changelog blocks, and raw form primitives are out of scope; they are not model-generated content components.
- **React parity / OpenUI Lang 1.0** — `@openuidev/vue-lang` is 0.4.x and early-stage. No Lang 1.0 APIs, no React-renderer parity work, no Vue renderer rewrite.
- **Public release** — nothing here is published or release-ready.

## v1 lucide-icon policy

Icon fields on approved wrappers (`Avatar.icon`, `Banner.icon`, `Empty.icon`, `ChatTool.icon`, `ChatPalette.icon`, etc.) accept **unrestricted lucide icon names in v1**, per user decision. Unknown or misspelled names render nothing via the icon provider and do not crash the render path. This is a display convenience, not a security boundary: icon names are never evaluated, interpolated into HTML, or treated as code, and no `javascript:` URLs or executable content are accepted anywhere.

## Implementation notes and verification

- The six Phase B definitions form `ChatChildUnion` (`ChatMessageDef`, `ChatMessagesDef`, `ChatPaletteDef`, `ChatReasoningDef`, `ChatShimmerDef`, `ChatToolDef`), all valid only under `ChatPalette`.
- Generated `ChatMessage`/`ChatMessages` UIMessage state uses deterministic index-derived ids; no provider metadata or arbitrary parts are accepted. `@nuxt-ui-genui/components` has no runtime `ai` dependency.
- Verification lives in `packages/components/test/expanded-defs.test.ts` (definitions), `packages/nuxt/test/expanded-components.test.ts` (Lang → `<NuxtGenUI>` render, cross-root filtering, streamed/partial props, clamps and caps), plus the SP1 suite. Components-package tests are Node-only; rendered assertions are Nuxt-environment only.
- Full command set (unchanged from README): `OPENUI_TELEMETRY_DISABLED=1 pnpm install|build|typecheck|test`. No implementation files were changed for this document; no tests were run as part of writing it.
