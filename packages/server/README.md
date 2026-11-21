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

MIT licensed.
