export default defineNuxtConfig({
  modules: ['@nuxt-ui-genui/nuxt', '@nuxt/ui', '@comark/vue'],
  css: ['~/assets/css/main.css'],
  ssr: false,
  experimental: { viewTransition: true },
  nitro: { externals: { inline: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] } },
  vite: {
    ssr: { noExternal: ['@openuidev/lang-core', '@openuidev/vue-lang', 'zod'] },
    optimizeDeps: {
      include: [
        '@openuidev/lang-core',
        '@openuidev/vue-lang',
        'zod',
        'zod/v4',
        'ai',
        '@internationalized/date',
        '@vueuse/core',
        'marked',
        'dompurify',
        '@comark/vue/plugins/shiki',
        '@shikijs/langs/html',
        '@shikijs/langs/css',
        '@shikijs/langs/python',
        '@shikijs/langs/sql',
        '@shikijs/langs/go',
        '@shikijs/langs/rust',
        '@shikijs/langs/java',
        '@shikijs/langs/c',
        '@shikijs/langs/cpp',
        '@shikijs/langs/ruby',
        '@shikijs/langs/php',
        '@shikijs/langs/swift',
        '@shikijs/langs/kotlin',
        '@shikijs/langs/diff',
        '@shikijs/langs/dockerfile',
        '@shikijs/langs/xml',
        '@shikijs/langs/toml',
        '@shikijs/langs/graphql'
      ]
    }
  }
})
