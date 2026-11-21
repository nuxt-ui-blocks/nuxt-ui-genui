import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateGenUISystemPrompt } from '../src/index'

const { generateSystemPrompt } = vi.hoisted(() => ({ generateSystemPrompt: vi.fn(() => 'prompt') }))
vi.mock('@openuidev/lang-core', () => ({ generateSystemPrompt }))

describe('generateGenUISystemPrompt promptOptions split', () => {
  beforeEach(() => generateSystemPrompt.mockClear())

  it('keeps local spec shape and passes options separately', () => {
    const spec = {
      foo: 'x',
      promptOptions: { examples: ['stale'], preamble: 'stale', additionalRules: ['stale'] }
    }
    const library = { toSpec: () => spec }
    generateGenUISystemPrompt(library, { examples: ['ex'], additionalRules: ['rule'], preamble: 'pre' })
    expect(generateSystemPrompt).toHaveBeenCalledWith({
      library: spec,
      promptOptions: { examples: ['ex'], additionalRules: ['rule'], preamble: 'pre' }
    })
  })

  it('strips promptOptions from the cloud library before calling the Cloud helper', () => {
    const spec = {
      foo: 'x',
      promptOptions: { examples: ['stale'], preamble: 'stale', additionalRules: ['stale'] }
    }
    const library = { toSpec: () => spec }
    generateGenUISystemPrompt(library, { cloud: true, examples: ['ex'], preamble: 'pre' })
    expect(generateSystemPrompt).toHaveBeenCalledWith({
      cloud: true,
      library: { foo: 'x' },
      promptOptions: { examples: ['ex'], preamble: 'pre' }
    })
  })

  it('replaces stored array fields instead of concatenating them', () => {
    const library = {
      toSpec: () => ({ foo: 'x' }),
      promptOptions: { examples: ['stored-a', 'stored-b'], preamble: 'stored' }
    }
    generateGenUISystemPrompt(library, { examples: ['explicit'] })
    expect(generateSystemPrompt).toHaveBeenCalledWith({
      library: { foo: 'x' },
      promptOptions: { examples: ['explicit'], preamble: 'stored' }
    })
  })
})
