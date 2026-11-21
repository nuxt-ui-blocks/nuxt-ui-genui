import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { defineGenUIComponent, GenUILibraryError } from '../src/index'

describe('defineGenUIComponent', () => {
  it('rejects zod v3 schemas with a clear error', () => {
    expect(() =>
      defineGenUIComponent({ name: 'Bad', props: { parse: () => ({}), notV4: true } as never, description: 'x' })
    ).toThrow(/zod\/v4/)
  })
  it('creates a component definition with key order preserved', () => {
    const def = defineGenUIComponent({
      name: 'StatsCard',
      props: z.object({ label: z.string(), value: z.string() }),
      description: 'metric'
    })
    expect(Object.keys((def as never as { props: { shape: object } }).props.shape)).toEqual(['label', 'value'])
  })
})
