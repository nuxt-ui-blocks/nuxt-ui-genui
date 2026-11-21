# @nuxt-ui-genui/core

Server-safe core of the Nuxt GenUI framework: no Vue, no Nuxt, no AI SDK.

- `createLibrary` / `defineGenUIComponent` — describe the component allowlist.
- `generateGenUISystemPrompt` — build the model prompt from the serialized library spec.
- Stream helpers: `responseTextChunks`, `toTextStreamResponse`, `parseSSEChunks`,
  `parseNDJSONChunks`, `extractDelta`, `readTextChunks` — read an OpenUI Lang
  program from a plain text, SSE or NDJSON response.

```bash
npm i @nuxt-ui-genui/core
```

MIT licensed.
