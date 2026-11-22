/** Web-standard helpers shared by the server handlers. */

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body ?? {}), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  })
}

/** Bounds applied by the generic handlers. Every field is optional per handler. */
export interface GenUIRequestLimits {
  /** Maximum raw request body size in bytes. Default 1 MiB. */
  maxBodyBytes?: number
  /** Maximum number of chat messages. Default 100. */
  maxMessages?: number
  /** Maximum characters of text in a single message. Default 100_000. */
  maxMessageChars?: number
  /** Maximum serialized size of a tool call's `args` in bytes. Default 64 KiB. */
  maxArgsBytes?: number
}

export const DEFAULT_REQUEST_LIMITS: Required<GenUIRequestLimits> = {
  maxBodyBytes: 1024 * 1024,
  maxMessages: 100,
  maxMessageChars: 100_000,
  maxArgsBytes: 64 * 1024
}

export type JsonObjectResult =
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; status: 400 | 413; error: string }

/**
 * Read a JSON object from a Web `Request` with a hard byte cap.
 *
 * The `content-length` header is checked first, then the body stream is read
 * incrementally and abandoned as soon as the cap is exceeded, so an oversized
 * payload is never fully buffered. A `413` result means the cap was hit; `400`
 * means the body was present but not a JSON object.
 */
export async function readJsonObject(
  request: Request,
  maxBodyBytes = DEFAULT_REQUEST_LIMITS.maxBodyBytes
): Promise<JsonObjectResult> {
  const declared = request.headers.get('content-length')
  if (declared !== null) {
    const length = Number(declared)
    if (Number.isFinite(length) && length > maxBodyBytes) {
      return { ok: false, status: 413, error: `Request body exceeds ${maxBodyBytes} bytes.` }
    }
  }

  const text = await readTextWithLimit(request, maxBodyBytes)
  if (text === null) {
    return { ok: false, status: 413, error: `Request body exceeds ${maxBodyBytes} bytes.` }
  }
  if (!text) {
    return { ok: false, status: 400, error: 'Request body must be a JSON object.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, status: 400, error: 'Request body must be valid JSON.' }
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, status: 400, error: 'Request body must be a JSON object.' }
  }
  return { ok: true, value: parsed as Record<string, unknown> }
}

/** Read the body as UTF-8 text, returning `null` when it exceeds `maxBytes`. */
async function readTextWithLimit(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const decoder = new TextDecoder()
  let received = 0
  let text = ''
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      received += value.byteLength
      if (received > maxBytes) {
        await reader.cancel().catch(() => {})
        return null
      }
      text += decoder.decode(value, { stream: true })
    }
    return text + decoder.decode()
  } finally {
    reader.releaseLock()
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
