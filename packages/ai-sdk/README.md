# @nuxt-ui-genui/ai-sdk

**Optional** Vercel AI SDK adapter for the Nuxt UI GenUI framework.

The framework itself does not depend on the AI SDK: [`@nuxt-ui-genui/chat`](../chat/README.md) speaks plain OpenUI Lang text and works with any agent backend. Install this package only if your host runs the Vercel AI SDK.

## Install

```bash
pnpm add @nuxt-ui-genui/ai-sdk
```

## Server: stream OpenUI Lang

```ts
import { streamGenUI, streamGenUIText } from '@nuxt-ui-genui/ai-sdk'

// plain text — what the framework's own client reads
return streamGenUIText({ systemPrompt, messages, live })

// the AI SDK's UI-message-stream protocol
return streamGenUI({ systemPrompt, messages, live })
```

Without `live`, both stream a deterministic `mockProgram` through the same `streamText` path (`MockLanguageModelV3`) — no network calls, not AI.

`live` is fully injected — pass `{ apiKey, baseURL?, model }` from your own server code; this adapter never reads `process.env`. The `GENAI_*` variables and `resolveGenUILive`/`resolveGenUIMock` helpers are a **playground convention** (`apps/playground/server/utils/genai.ts`), not part of this adapter's contract. This adapter has **not** been verified against a hosted provider.

## Client: the AI SDK's own `Chat`

```ts
import { createAIChat } from '@nuxt-ui-genui/ai-sdk/chat'

const chat = createAIChat({ api: '/api/chat' })
```

Use this when the host already uses the AI SDK's `Chat` class; otherwise prefer the framework-agnostic client.

## Errors

Upstream stream failures are logged server-side and streamed to the browser as a generic message — endpoint, model and key details never reach the client.
