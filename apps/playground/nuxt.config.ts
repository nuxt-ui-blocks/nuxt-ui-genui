export default defineNuxtConfig({
  modules: ['@nuxt/ui'],
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2026-11-01',
  build: {
    transpile: ['nuxt-ui-genui-core']
  },
  typescript: {
    strict: true
  }
})
