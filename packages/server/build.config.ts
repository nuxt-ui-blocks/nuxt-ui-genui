import { defineBuildConfig } from 'unbuild'

// Same shape as @nuxt-ui-genui/core: unbuild infers entries from package.json
// `exports` and emits .js/.d.ts under type: module.
export default defineBuildConfig({
  declaration: true,
  rollup: {
    output: {
      entryFileNames: '[name].js'
    }
  }
})
