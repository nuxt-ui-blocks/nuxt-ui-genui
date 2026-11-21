import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/index', 'src/chat'],
  declaration: true,
  rollup: {
    output: {
      entryFileNames: '[name].js'
    }
  },
  externals: ['@ai-sdk/openai', '@ai-sdk/vue', 'ai', 'ai/test', 'vue'],
  failOnWarn: false
})
