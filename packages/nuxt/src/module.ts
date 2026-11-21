import { addComponent, createResolver, defineNuxtModule } from '@nuxt/kit'
import type { NuxtModule } from '@nuxt/schema'

export interface GenUIModuleOptions {
  /**
   * Name of the auto-imported renderer component. Use it when `NuxtGenUI`
   * collides with a component of your own.
   */
  componentName?: string
  /**
   * Register the renderer component at all. Set to `false` to import
   * `<NuxtGenUI>` manually from `@nuxt-ui-genui/nuxt/runtime`.
   */
  registerComponent?: boolean
}

// Explicit annotation: without it, TS2742 (the inferred default-export type
// cannot be named without a reference to @nuxt/schema) fails the build gate.
const genuiModule: NuxtModule<any, any, any> = defineNuxtModule<GenUIModuleOptions>({
  meta: { name: '@nuxt-ui-genui/nuxt', configKey: 'genui', compatibility: { nuxt: '^4.0.0' } },
  defaults: {
    componentName: 'NuxtGenUI',
    registerComponent: true
  },
  // `schema` is a unjs schema at runtime (kit applies it with `applyDefaults`
  // when resolving the module options), but `@nuxt/schema` 4.4.x types the
  // field as the options object itself - hence the cast.
  schema: {
    componentName: { type: 'string', default: 'NuxtGenUI' },
    registerComponent: { type: 'boolean', default: true }
  } as unknown as GenUIModuleOptions,
  setup(options) {
    if (!options.registerComponent) return
    const resolver = createResolver(import.meta.url)
    addComponent({ name: options.componentName ?? 'NuxtGenUI', filePath: resolver.resolve('./runtime/NuxtGenUI.vue') })
  }
})

export default genuiModule
