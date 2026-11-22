# @nuxt-ui-genui/server

Framework-agnostic server helpers for OpenUI Lang — no AI SDK, no Vue, no Nuxt.

- `createGenUIChatHandler` — a Web-standard `Request => Response` handler that
  builds the system prompt from your library and streams whatever an injected
  sender produces. The sender may use any model backend.
- `createGenUIToolHandler` — executes named server-side tools behind a Web
  handler; the model never receives privileged code.
- `createGenUIToolProxyProvider` — a `toolProvider` that forwards
  `Query()`/`Mutation()` calls to that handler.

The AI SDK (or any other backend) stays in your application or in the optional
`@nuxt-ui-genui/ai-sdk` adapter. Nothing here reads environment variables.

```bash
npm i @nuxt-ui-genui/server
```

## Request limits

Both handlers apply bounded, configurable request limits by default
(`DEFAULT_REQUEST_LIMITS`):

| Limit | Default | Applies to |
| --- | --- | --- |
| `maxBodyBytes` | 1 MiB | JSON request body (checked via `content-length`, then while streaming) |
| `maxMessages` | 100 | chat `messages[]` length |
| `maxMessageChars` | 100,000 | individual chat message text |
| `maxArgsBytes` | 64 KiB | serialized tool `args` |

Override them per handler:

```ts
createGenUIChatHandler({ library, sender, limits: { maxMessages: 20 } })
createGenUIToolHandler({ tools, limits: { maxArgsBytes: 8 * 1024 } })
```

Oversized input returns `413` with a stable `error` message. Malformed or
non-object JSON returns `400`. The incoming `Request.signal` is still forwarded
to the sender/tool executor.

## Tool errors

Tool executors are privileged. By default an executor exception produces:

```json
{ "error": "Tool execution failed.", "id": "<generated-id>" }
```

with status `500`. The raw exception message, stack, and provider details are
never returned to the client. Use `onUnexpectedError(error, { id, tool, request })`
to log the original error alongside the client-facing id, or `mapError` to turn
expected domain errors into safe responses:

```ts
createGenUIToolHandler({
  tools: { place_order },
  mapError(error, { tool }) {
    if (error instanceof OutOfStock) {
      return { status: 409, body: { error: 'Item is out of stock.' } }
    }
  },
  onUnexpectedError(error, { id, tool }) {
    console.error(`[${id}] ${tool} failed`, error)
  }
})
```

Unknown tool names are rejected with `400`. The name allowlist is **not** argument
validation: validate `args` inside your executor (or upstream middleware) for
each tool.

## Host responsibilities

These helpers are transport-neutral building blocks. Authentication,
authorization, per-user/per-IP rate limiting, HTTP method routing, and CORS are
**host responsibilities** — apply them in your framework's middleware before
calling a handler.

MIT licensed.
