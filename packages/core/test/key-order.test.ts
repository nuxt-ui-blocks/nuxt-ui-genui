import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { defineGenUIComponent } from '../src/index'

describe('positional argument order (wire format)', () => {
  it('keeps zod shape key order stable', () => {
    const def = defineGenUIComponent({
      name: 'Chart',
      props: z.object({ title: z.string().optional(), type: z.string(), labels: z.array(z.string()), series: z.array(z.unknown()) }),
      description: 'chart'
    })
    expect(Object.keys((def as never as { props: { shape: object } }).props.shape))
      .toEqual(['title', 'type', 'labels', 'series'])
  })
})
