import NuxtGenUI from '../../../src/module'
import { defineNuxtConfig } from 'nuxt/config'
export default defineNuxtConfig({
  modules: [NuxtGenUI, '@nuxt/ui'],
  ssr: false,
  nitro: { externals: { inline: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } },
  vite: { ssr: { noExternal: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } }
})
