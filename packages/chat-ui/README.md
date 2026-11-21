# @nuxt-ui-genui/chat-ui

A thin, slot-complete Nuxt UI chat shell driven by `@nuxt-ui-genui/chat`.

- `<GenUIChat>` renders `UChatMessages` + `UChatPrompt` from a `GenUIChat` client.
- No transport, model, endpoint or persistence lives here — the host supplies all of it.
- Every message and prompt slot is forwarded, so hosts keep full control of rendering.

```bash
npm i @nuxt-ui-genui/chat-ui
```

MIT licensed.
