import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

// Explicit annotation: without it, TS2742 (the inferred default-export type
// cannot be named without a reference to vite) fails the build gate.
const config: ReturnType<typeof defineVitestConfig> = defineVitestConfig({
  test: {
    environment: 'nuxt',
    // Every file boots its own Nuxt + jsdom environment. The render tests need
    // ~1s in isolation, but with 17 files in parallel the default 5s budget is
    // not enough on a loaded machine and the suite reports false failures
    // ("Test timed out in 5000ms"). Give the suite room instead.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    setupFiles: ['./test/setup.ts'],
    environmentOptions: {
      nuxt: {
        rootDir: fileURLToPath(new URL('./test/fixtures/basic', import.meta.url)),
        domEnvironment: 'jsdom'
      }
    }
  }
})

export default config
