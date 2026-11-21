import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index'],
  declaration: true,
  rollup: {
    output: {
      entryFileNames: '[name].js'
    }
  },
  externals: ['@nuxt-ui-genui/core', 'vue'],
  failOnWarn: false
})
