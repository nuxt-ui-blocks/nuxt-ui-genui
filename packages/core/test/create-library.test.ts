import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { createGenUILibrary, defineGenUIComponent, GenUILibraryError } from '../src/index'

const mk = (name: string) =>
  defineGenUIComponent({ name, props: z.object({ a: z.string() }), description: name + ' comp' })

describe('createGenUILibrary', () => {
  it('rejects duplicate component names at construction', () => {
    expect(() =>
      createGenUILibrary({ components: [mk('A'), mk('A')], root: 'A' })
    ).toThrow(GenUILibraryError)
  })
  it('exposes the upstream library JSON Schema for external tooling', () => {
    const lib = createGenUILibrary({ components: [mk('A')], root: 'A' })
    const schema = lib.toJSONSchema()
    expect(schema.$defs?.A?.properties?.a).toMatchObject({ type: 'string' })
  })
  it('rejects reserved builtin prefix names at construction', () => {
    expect(() =>
      createGenUILibrary({ components: [mk('@Count')], root: '@Count' })
    ).toThrow(/reserved/i)
  })
})
