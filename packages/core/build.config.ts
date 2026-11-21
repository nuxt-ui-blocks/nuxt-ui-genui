import { defineBuildConfig } from 'unbuild'

// No explicit entries: unbuild infers them from package.json `exports`,
// which declares ./dist/index.js + ./dist/index.d.ts (type: module → ESM).
export default defineBuildConfig({
  declaration: true,
  rollup: {
    output: {
      entryFileNames: '[name].js'
    }
  }
})
