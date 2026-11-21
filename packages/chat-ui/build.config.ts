import { defineBuildConfig } from 'unbuild'

// Ship compiled SFCs like @nuxt/ui does: hosts must not need a raw `.vue`
// import from node_modules (that would require optimizeDeps.extensions).
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
  externals: ['@nuxt-ui-genui/chat', '@nuxt/ui', 'vue'],
  failOnWarn: false
})
