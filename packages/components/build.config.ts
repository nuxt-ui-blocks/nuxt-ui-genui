import { defineBuildConfig } from 'unbuild'

/**
 * The components package ships two kinds of artifacts:
 *
 * - plain TS (defs, helpers, rules, unions, contexts) - transpiled by mkdist
 * - Vue SFCs (`src/components/*.vue`) - compiled by vue-sfc-transformer
 *
 * mkdist handles both in one pass and emits the `.vue` files next to generated
 * `.vue.d.ts` declarations, exactly like `@nuxt/ui` ships its runtime components.
 * The `.` entry (`dist/index.js`) stays Nuxt-free: it only contains the
 * serializable definitions, so a plain Vue host can build a library from it.
 */
export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: './src',
      outDir: './dist',
      format: 'esm',
      ext: 'js',
      declaration: true,
      addRelativeDeclarationExtensions: true
    }
  ],
  externals: [
    '@internationalized/date',
    '@nuxt-ui-genui/core',
    '@nuxt/ui',
    '@openuidev/lang-core',
    '@openuidev/vue-lang',
    '@tanstack/charts',
    'dompurify',
    'marked',
    'vue',
    'zod'
  ],
  failOnWarn: false
})
