import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../src/markdown'

// The components package tests run in the node environment: there is no DOM, so
// DOMPurify reports `isSupported === false` and returns its input unchanged.
// `renderMarkdown` must fail closed in that case instead of emitting raw HTML.
describe('renderMarkdown', () => {
  it('escapes the source instead of returning raw HTML when no DOM is available', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })

  it('escapes markup that would otherwise be injected', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;img')
  })

  it('never returns the raw input for empty text', () => {
    expect(renderMarkdown('')).toBe('')
  })
})
