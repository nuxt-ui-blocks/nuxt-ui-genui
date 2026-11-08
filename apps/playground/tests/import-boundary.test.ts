import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

const roots = [
  path.resolve(process.cwd(), '../../packages/core/src'),
  path.resolve(process.cwd(), 'server')
]

const banned: Array<[RegExp, string]> = [
  [/\.vue['"]/, '.vue import'],
  [/library\.ts|#shared\/genui\/library/, 'client-only library import'],
  [/#components/, '#components import'],
  [/@nuxt\/ui/, 'Nuxt UI import'],
  [/@openuidev\/vue-lang/, 'OpenUI client renderer import']
]

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]
  )
}

describe('server/client import boundary', () => {
  it('core and server never import client-only surfaces', () => {
    const violations: string[] = []
    for (const root of roots) {
      for (const file of walk(root)) {
        if (!/\.(ts|vue|mjs|js)$/.test(file)) continue
        const source = readFileSync(file, 'utf8')
        for (const [pattern, label] of banned) {
          if (pattern.test(source)) violations.push(`${file}: ${label}`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
