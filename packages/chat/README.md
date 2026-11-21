# @nuxt-ui-genui/chat

Chat client for the Nuxt UI GenUI framework — **no AI SDK required**.

OpenUI is an open standard with many backends (LangGraph, Google ADK, Mastra, AG-UI, OpenUI Cloud, a plain HTTP route, the Vercel AI SDK, …). This package therefore speaks **plain OpenUI Lang text** and never imports `ai` or `@ai-sdk/*`.

## Install

```bash
pnpm add @nuxt-ui-genui/chat
```

## Use it against an endpoint

The endpoint receives `{ messages }` and answers with a streamed OpenUI Lang program. `text/plain`, `text/event-stream` (SSE) and `application/x-ndjson` are all read as text.

```ts
import { createGenUIChat } from '@nuxt-ui-genui/chat'

const chat = createGenUIChat({ api: '/api/chat' })

chat.sendMessage({ text: 'show me the Q4 KPIs' })

chat.messages.value      // GenUIMessage[] — ready for <UChatMessages>
chat.status.value        // 'ready' | 'submitted' | 'streaming' | 'error'
chat.error.value         // Error | undefined
chat.stop()              // abort the running turn
chat.regenerate()        // drop the last answer and ask again
chat.clear()             // empty the transcript
```

## Use it with your own agent backend

Any async iterable of OpenUI Lang text is a transport:

```ts
import { createGenUIChat, type GenUITransport } from '@nuxt-ui-genui/chat'

const transport: GenUITransport = async ({ messages, signal }) => {
  const run = await myAgent.stream(messages, { signal })
  for await (const chunk of run) yield chunk
}

const chat = createGenUIChat({ transport })
```

A custom transport **must observe `input.signal`** — aborting it is how `stop()` ends a turn.

## Message shape

`GenUIMessage` mirrors the Vercel AI SDK's `UIMessage` exactly (`id`, `role`, `parts[]`, `state: 'streaming' | 'done'`) so Nuxt UI's chat components (`UChatMessages`, `UChatPrompt`, …) accept the transcript unchanged. Only the type identity differs, so a host crosses that one boundary with a cast.

Helpers: `isTextPart`, `isReasoningPart`, `isPartStreaming`, `collectAssistantText`, `latestAssistantText`, `isAssistantActive`.

## Server side

The wire helpers live in `@nuxt-ui-genui/core`: `responseTextChunks(response)` (plain / SSE / NDJSON), `toTextStreamResponse(chunks)` (serve plain-text OpenUI Lang) and `extractDelta(payload)`.

For the Vercel AI SDK specifically, use the optional adapter [`@nuxt-ui-genui/ai-sdk`](../ai-sdk/README.md) — it is never required.
