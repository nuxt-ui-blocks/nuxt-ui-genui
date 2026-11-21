# @nuxt-ui-genui/components

The built-in component allowlist of the Nuxt GenUI framework: 71 OpenUI Lang
definitions plus the Vue renderers for them.

```ts
import { createNuxtUILibrary, ALL_DEFS } from '@nuxt-ui-genui/components'
import * as sfc from '@nuxt-ui-genui/components/sfc'

const library = createNuxtUILibrary({ renderers: sfc })
```

- `.` — the definitions (`ALL_DEFS`), helpers and the library factory. Nuxt-free.
- `./sfc` — the Vue renderers (they import `@nuxt/ui`).
- `./form-context`, `./upload`, `./markdown` — the host seams (form context,
  file uploader, markdown rendering).

The component names and their props are the wire format: the positional
arguments of an OpenUI Lang program map onto the Zod property order, so the
schemas are append-only.

MIT licensed.
