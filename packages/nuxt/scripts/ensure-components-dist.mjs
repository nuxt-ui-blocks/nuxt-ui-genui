// The Nuxt test suite renders the *built* components package (that is the
// artifact a host installs), so it needs `packages/components/dist` to exist.
// The root `pnpm test` builds every package before running the suites; this
// guard makes a standalone `pnpm --filter @nuxt-ui-genui/nuxt test` work too,
// instead of failing with "Cannot find module .../components/dist/index.js".
//
// It only builds when the build is missing - after editing the components you
// still need `pnpm build:packages` (or `pnpm --filter @nuxt-ui-genui/components
// build`) for the suite to see the change.
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(here, '../../..')
const distEntry = resolve(repoRoot, 'packages/components/dist/index.js')

if (existsSync(distEntry)) {
  process.exit(0)
}

console.log('[nuxt] @nuxt-ui-genui/components is not built - building it first...')
execFileSync('pnpm', ['--filter', '@nuxt-ui-genui/components', 'build'], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32'
})
