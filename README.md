# @nuxt-ui-genui

Generative UI for Nuxt 4. Your model returns [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview); this library renders it as allowlisted [Nuxt UI](https://ui.nuxt.com/) components such as cards, charts, tables, forms, and dialogs while the response streams in.

What you get:

- A strict component allowlist: the model picks from defined components, never raw JavaScript or Vue templates.
- A framework-agnostic chat client that speaks plain OpenUI Lang text over any HTTP endpoint or transport.
- Optional Vercel AI SDK integration, kept out of core.
- A reference "AI Operations Center" playground with live and deterministic modes.

> **Alpha, not published.** Packages are not on npm yet and the API is unstable. This project targets **Nuxt 4 + Nuxt UI 4 only** and is built on the pre-1.0 `@openuidev/vue-lang` 0.4.x renderer. See the [release guide](docs/release.md) for the compatibility matrix and the alpha release checklist. The playground chat route is demo-only — no auth, authorization, rate limiting, or production middleware.

## How it works

1. Your library definition becomes a system prompt describing every allowed component and its props.
2. The user sends a message to your backend (`POST /api/chat` in the playground).
3. The backend calls a model, which responds with OpenUI Lang text (optionally after running server-authorized tools).
4. `@nuxt-ui-genui/chat` reads that response as plain text chunks.
5. `<NuxtGenUI>` parses the program and renders each node with the matching Nuxt UI SFC as tokens arrive.

```
User prompt → /api/chat → model → OpenUI Lang text → chat client → renderer → Nuxt UI components
```

## Quick start

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- pnpm 9+
- A Nuxt 4 app with Nuxt UI 4

The packages are not published, so start from this workspace:

```bash
git clone https://github.com/nuxt-ui-blocks/nuxt-ui-genui.git
cd nuxt-ui-genui
OPENUI_TELEMETRY_DISABLED=1 pnpm install --frozen-lockfile
pnpm build
pnpm dev
```

`pnpm dev` builds the packages and starts the playground at http://localhost:3000. Set `OPENUI_TELEMETRY_DISABLED=1` for all repo commands to silence lang-core install telemetry.

### Use the renderer in Nuxt

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt-ui-genui/nuxt', '@nuxt/ui']
})
```

```vue
<script setup lang="ts">
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import * as sfc from '@nuxt-ui-genui/components/sfc'

const library = createNuxtUILibrary({ ...sfc })
</script>

<template>
  <NuxtGenUI
    :library="library"
    :response="program"
    :is-streaming="streaming"
    @action="onAction"
  />
</template>
```

The route behind `program` can answer with plain text, SSE, or NDJSON; `@nuxt-ui-genui/chat` reads all three. Add `?format=ui-stream` to the playground route if you need the Vercel AI SDK UI-message-stream protocol instead.

### Plain Vue 3 hosts

Nuxt UI renderers need a Nuxt build. For a plain Vue SPA, Laravel + Inertia, or similar, register the client-only global component and supply your own renderers:

```ts
import { createApp } from 'vue'
import { createGenUI } from '@nuxt-ui-genui/nuxt/vue-plugin'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import MyCard from './MyCard.vue'

const library = createNuxtUILibrary({ renderers: { Card: MyCard } })
createApp(App).use(createGenUI()).mount('#app')
```

```vue
<GenUIRenderer :library="library" :response="program" @action="onAction" />
```

## Packages

| Package | Purpose |
| --- | --- |
| `@nuxt-ui-genui/core` | Server-safe library creation, Zod 4 schemas, system-prompt generation, stream helpers. |
| `@nuxt-ui-genui/components` | 71 built-in component definitions, helpers, and compiled Vue SFCs (`/sfc` barrel). |
| `@nuxt-ui-genui/nuxt` | Nuxt module with `<NuxtGenUI>`, plus the plain-Vue plugin entry `/vue-plugin`. |
| `@nuxt-ui-genui/chat` | Framework-agnostic chat client, message helpers, and transport seam. No AI SDK dependency. |
| `@nuxt-ui-genui/chat-ui` | Slot-complete Nuxt UI chat shell driven by `@nuxt-ui-genui/chat`. |
| `@nuxt-ui-genui/server` | Framework-agnostic server helpers for tools and streaming. |
| `@nuxt-ui-genui/ai-sdk` | Optional Vercel AI SDK adapter: `streamGenUI`, `streamGenUIText`, `createAIChat`. |
| `apps/playground` | Reference AI Operations Center with live and deterministic modes. |

## Component catalog

The model-facing allowlist has 71 definitions. Full contracts live in [the expanded components guide](docs/nuxt-ui-expanded-components.md) and [the full-parity design note](docs/superpowers/specs/2026-11-11-nuxt-genui-full-parity-design.md).

| Category | Examples |
| --- | --- |
| Content and layout | Card, Stats, StatsCard, TextContent, Accordion, Tabs, Timeline, Stepper, Tree, Carousel, ScrollArea, Splitter |
| Data and charts | DataTable, Table, Chart, Pagination, Breadcrumb, NavigationMenu |
| Forms | Form, Input, Textarea, InputNumber, Select, SelectMenu, InputMenu, Checkbox, CheckboxGroup, RadioGroup, Switch, Slider, PinInput, InputTags, ColorPicker, InputDate, InputTime, FileUpload |
| Feedback and overlays | Alert, Badge, Banner, Progress, ProgressGroup, Skeleton, Empty, Toast, Modal, Slideover, Popover, Drawer, CommandPalette, DropdownMenu, ContextMenu |
| Chat display | ChatPalette, ChatMessage, ChatMessages, ChatReasoning, ChatShimmer, ChatTool (display-only; the host owns the input) |
| Actions | Button, Buttons; action plans are forwarded to the host, and URL opening is handled by `<NuxtGenUI>` |

App chrome (sidebar, header, footer, auth, editors, theme controls) is intentionally host-owned and not model-facing.

## Live and deterministic demo

The playground is live by default. Configure it in `apps/playground/.env` (gitignored):

| Variable | Default | Meaning |
| --- | --- | --- |
| `GENAI_PROVIDER` | unset | Provider selection: `mock`, `openai-compatible`, or `openui-cloud`. Unset keeps the legacy behavior below. |
| `GENAI_API_KEY` | none | API key for the OpenAI-compatible endpoint. `THESYS_API_KEY` is used only as a fallback value. |
| `GENAI_BASE_URL` | `http://127.0.0.1:8317/v1` | OpenAI-compatible gateway. A Thesys endpoint is never assumed. |
| `GENAI_MODEL` | `gemini-3.5-flash-lite` | Model name sent to the gateway. For `openui-cloud`, `GENAI_MODEL` is required and uses `{provider}/{model}` ids (for example `openai/gpt-5`); no default is assumed. |
| `GENAI_MOCK` | unset | Set to `1` to stream fixed, deterministic programs with no network calls. |
| `THESYS_API_KEY` | none | Server-only OpenUI Cloud key for `GENAI_PROVIDER=openui-cloud`. Never sent to the browser. |

An explicit `GENAI_PROVIDER` overrides legacy `GENAI_MOCK`/`GENAI_LIVE`; with no provider variable, legacy behavior is unchanged. With no key and no mock, `/api/chat` returns 503 instead of silently serving demo data. The UI badge shows `live · <model>`, `mock · deterministic`, or `not configured`; with OpenUI Cloud configured it shows `openui cloud · <model>`. Only a generic local OpenAI-compatible gateway has been verified; hosted providers are not claimed as tested. See the [OpenUI Cloud smoke guide](docs/openui-cloud-smoke.md) for the optional manual check.

> **Demo only:** the playground chat route is a demo, not a production template — no auth, authorization, rate limiting, or production middleware.

## Integrating a backend

`@nuxt-ui-genui/core` and `/chat` do not import any AI SDK. Point the chat client at a route that returns OpenUI Lang text:

```ts
import { createGenUIChat } from '@nuxt-ui-genui/chat'

const chat = createGenUIChat({ api: '/api/chat' })
chat.sendMessage({ text: 'show me the Q4 KPIs' })
```

Or hand it any async iterable of text, so LangGraph, Google ADK, Mastra, AG-UI, or a plain HTTP route can be the backend:

```ts
import { createGenUIChat, type GenUITransport } from '@nuxt-ui-genui/chat'

const transport: GenUITransport = async ({ messages, signal }) => {
  const run = await myAgent.stream(messages, { signal })
  for await (const chunk of run) yield chunk
}

const chat = createGenUIChat({ transport })
```

If you already use the Vercel AI SDK, the optional adapter is available:

```ts
import { streamGenUIText, streamGenUI } from '@nuxt-ui-genui/ai-sdk'
import { createAIChat } from '@nuxt-ui-genui/ai-sdk/chat'
```

The AI SDK lives only in that adapter. Nuxt UI chat components are typed against the AI SDK's `UIMessage`; `GenUIMessage` mirrors that shape, so the playground crosses the type boundary with one cast and imports no `ai` code in its app files.

## Host responsibilities and limits

- **Client-only:** the Vue OpenUI renderer is pre-1.0 and renders an empty wrapper under `renderToString`. Keep `ssr: false` until upstream supports SSR.
- **Actions:** buttons forward action plans to your host handler. Privileged or business actions must be authorized on the server.
- **Forms:** a form submits only the fields that are its children at submit time. Field renaming mid-stream is handled by the field hook.
- **Uploads:** supply `provideGenUIUploader({ upload })` to enable model-facing file fields; otherwise they render disabled. File contents do not reach the model.
- **Markdown:** model-authored markdown is sanitized in the browser and fails closed to escaped HTML without a DOM.
- **No dynamic code:** generated content stays inside the component allowlist. JavaScript and Vue templates are never evaluated.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm install` | Install workspace dependencies. |
| `pnpm build` | Build every package and the playground. |
| `pnpm build:packages` | Build only `packages/*`. |
| `pnpm typecheck` | Typecheck all workspace projects. |
| `pnpm test` | Build packages, then run all tests. |
| `pnpm dev` | Build packages, then start the playground. |

A fresh checkout needs `pnpm install` and `pnpm build` before `pnpm typecheck` or `pnpm test`, because workspace consumers import built `dist` output.

## Learn more

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview)
- [Expanded component contracts](docs/nuxt-ui-expanded-components.md)
- [Full-parity design note](docs/superpowers/specs/2026-11-11-nuxt-genui-full-parity-design.md)
- [SP1 design note](docs/superpowers/specs/2026-11-08-nuxt-genui-sp1-design.md)

## License

[MIT](LICENSE)
