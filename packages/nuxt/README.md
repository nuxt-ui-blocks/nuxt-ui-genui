# @nuxt-ui-genui/nuxt

The Nuxt module of the Nuxt GenUI framework — and a plain-Vue plugin.

## Nuxt host

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt-ui-genui/nuxt']
})
```

```vue
<NuxtGenUI :library="library" :response="program" :on-action="onAction" />
```

The module registers `<NuxtGenUI>` globally.

## Plain Vue host

```ts
import { createGenUI } from '@nuxt-ui-genui/nuxt/vue-plugin'

createApp(App).use(createGenUI()).mount('#app')
```

`<GenUIRenderer>` is then available globally. The built-in Nuxt UI renderers
stay Nuxt-only (they import `@nuxt/ui`); a plain-Vue host passes its own
renderers to `createNuxtUILibrary({ renderers })`.

MIT licensed.
