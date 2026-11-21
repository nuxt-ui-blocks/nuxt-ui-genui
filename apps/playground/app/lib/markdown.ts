import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Render assistant markdown to sanitized HTML. Never bypass — model output is untrusted. */
export function renderMarkdown(text: string): string {
  return DOMPurify.sanitize(marked.parse(text ?? '', { async: false }) as string)
}
