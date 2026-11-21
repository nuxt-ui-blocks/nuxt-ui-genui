import type { App, Plugin } from 'vue'
import GenUIRenderer from './GenUIRenderer'

export interface GenUIPluginOptions {
  /**
   * Global component name of the renderer. Defaults to `GenUIRenderer`.
   * Use it when the name collides with a component of your own.
   */
  componentName?: string
}

/**
 * Vue plugin for plain Vue 3 hosts (Laravel + Inertia, a Vue SPA, ...).
 *
 * It registers one global component - `<GenUIRenderer>` - that renders an
 * OpenUI Lang program with the library you pass in:
 *
 * ```ts
 * import { createApp } from 'vue'
 * import { createGenUI } from '@nuxt-ui-genui/nuxt/vue-plugin'
 * import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
 * import MyCard from './MyCard.vue'
 *
 * const library = createNuxtUILibrary({ renderers: { Card: MyCard } })
 * createApp(App).use(createGenUI()).mount('#app')
 * ```
 *
 * The built-in Nuxt UI renderers (`@nuxt-ui-genui/components/sfc`) are **not**
 * registered by this plugin: they import `@nuxt/ui` components, which need a
 * Nuxt build (`#imports` / `#build` aliases). A plain Vue host supplies its own
 * renderers through `createNuxtUILibrary({ renderers })`.
 */
export function createGenUI(options: GenUIPluginOptions = {}): Plugin {
  const { componentName = 'GenUIRenderer' } = options
  return {
    install(app: App) {
      app.component(componentName, GenUIRenderer)
    }
  }
}

/** Default plugin instance: `app.use(plugin)`. */
const plugin: Plugin = createGenUI()

export { GenUIRenderer }
export default plugin
