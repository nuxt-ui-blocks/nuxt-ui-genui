import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Escape the characters that could start an HTML tag or entity. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Render model-authored markdown to sanitized HTML. Never bypass — model output is untrusted.
 *
 * DOMPurify needs a DOM: without one (SSR / Node) it sets `isSupported = false` and
 * `sanitize()` returns its input UNCHANGED, which would inject model-authored HTML
 * verbatim. So we fail closed there and return the source as escaped plain text.
 */
export function renderMarkdown(text: string): string {
  const source = text ?? ''
  const html = marked.parse(source, { async: false }) as string
  if (!DOMPurify.isSupported) return escapeHtml(source)
  return DOMPurify.sanitize(html)
}
