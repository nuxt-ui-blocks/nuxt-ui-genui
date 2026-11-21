// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '@nuxt-ui-genui/components/markdown'

// The nuxt environment provides a DOM, so DOMPurify is supported here: markdown
// must be rendered to HTML *and* stripped of unsafe markup. The node-side
// fail-closed behaviour is covered by packages/components/test/markdown.test.ts.
describe('renderMarkdown in a DOM environment', () => {
  it('renders markdown to HTML', () => {
    const html = renderMarkdown('Fuel load within margin. **Two open issues** remain.')
    expect(html).toContain('<strong>Two open issues</strong>')
  })

  it('strips script tags from model output', () => {
    const html = renderMarkdown('hello <script>alert(1)</script> world')
    expect(html).not.toContain('<script>')
    expect(html).toContain('hello')
  })

  it('strips event handler attributes', () => {
    const html = renderMarkdown('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('onerror')
  })
})
