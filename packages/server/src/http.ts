/** Web-standard helpers shared by the server handlers. */

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body ?? {}), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null
    return body as Record<string, unknown>
  } catch {
    return null
  }
}

/**
 * Accept a plain string, `{ content: string }` or an AI SDK style
 * `{ parts: [{ text }] }` message and return its text. `null` means the shape
 * is not a message we understand.
 */
export function messageText(value: unknown): string | null {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return null
  const record = value as { content?: unknown; parts?: unknown }
  if (typeof record.content === 'string') return record.content
  if (Array.isArray(record.parts)) {
    return record.parts
      .map((part: unknown) => {
        if (!part || typeof part !== 'object') return ''
        const text = (part as { text?: unknown }).text
        return typeof text === 'string' ? text : ''
      })
      .join('')
  }
  return null
}

export function messageRole(value: unknown): string {
  if (!value || typeof value !== 'object') return 'user'
  const role = (value as { role?: unknown }).role
  return typeof role === 'string' && role ? role : 'user'
}
