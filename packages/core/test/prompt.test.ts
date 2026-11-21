import { describe, it, expect } from 'vitest'
import { z } from 'zod/v4'
import { createGenUILibrary, defineGenUIComponent, generateGenUISystemPrompt } from '../src/index'

const mk = (name: string, props: z.ZodTypeAny) =>
  defineGenUIComponent({ name, props: props as never, description: name })

describe('generateGenUISystemPrompt', () => {
  it('produces a non-empty local prompt without network access', () => {
    const lib = createGenUILibrary({ components: [mk('Card', z.object({ children: z.array(z.unknown()).optional() }))], root: 'Card' })
    const prompt = generateGenUISystemPrompt(lib)
    expect(prompt.length).toBeGreaterThan(100)
    expect(prompt).toContain('Card(')
  })
})
