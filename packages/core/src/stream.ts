/**
 * Transport-agnostic streaming helpers.
 *
 * OpenUI is an open standard: the same OpenUI Lang program can arrive from a
 * Vercel AI SDK route, a LangGraph run, Google ADK, Mastra, AG-UI, OpenUI
 * Cloud or a plain `text/plain` response. These helpers read all of them as
 * plain text chunks, so the framework never has to pick one backend.
 *
 * They use Web-standard globals only (`ReadableStream`, `TextDecoder`), so they
 * run in Node (Nitro), the browser and edge runtimes alike.
 */

/** Decode a byte stream into UTF-8 text chunks. */
export async function* readTextChunks(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      if (!value) continue
      const text = decoder.decode(value, { stream: true })
      if (text) yield text
    }
    const tail = decoder.decode()
    if (tail) yield tail
  } finally {
    reader.releaseLock()
  }
}

/**
 * One piece of a streamed OpenUI Lang response.
 *
 * `delta` pieces are appended to the running text. `snapshot` pieces replace
 * it — agent engines that emit a full `messages[]` history on every event send
 * "a", then "ab", then "abc"; appending those would produce "aababc".
 */
export interface GenUIStreamChunk {
  text: string
  mode: 'delta' | 'snapshot'
}

/**
 * Extract one wire payload as a chunk, preserving whether it is incremental
 * text or a full snapshot.
 *
 * Plain payloads are used as-is. JSON payloads are unwrapped from the fields
 * the common agent frameworks use (`delta` for AG-UI, `text`/`content` for
 * OpenAI-style streams, `message` for nested shapes). A `messages[]` payload
 * is a snapshot; every other shape is a delta.
 */
export function extractChunk(payload: string): GenUIStreamChunk {
  const trimmed = payload.trim()
  if (!trimmed) return { text: '', mode: 'delta' }
  if (!trimmed.startsWith('{')) return { text: trimmed, mode: 'delta' }
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>
    for (const key of ['delta', 'text', 'content', 'message']) {
      const value = data[key]
      if (typeof value === 'string') return { text: value, mode: 'delta' }
      if (value && typeof value === 'object' && 'text' in value && typeof (value as { text: unknown }).text === 'string') {
        return { text: (value as { text: string }).text, mode: 'delta' }
      }
    }
    // Standard OpenAI chat-completion chunk shape: choices[0].delta.content.
    const choices = data.choices
    if (Array.isArray(choices)) {
      const delta = (choices[0] as { delta?: unknown } | undefined)?.delta
      if (delta && typeof delta === 'object') {
        const content = (delta as { content?: unknown }).content
        if (typeof content === 'string') return { text: content, mode: 'delta' }
        if (Array.isArray(content)) {
          // content-part arrays: [{ type: 'text', text: '...' }, ...]
          return {
            text: content.map((p) => (p && typeof p === 'object' && typeof (p as { text?: unknown }).text === 'string' ? (p as { text: string }).text : '')).join(''),
            mode: 'delta'
          }
        }
      }
    }
    // AG-UI / agent engines that emit a running message list: a snapshot.
    const messages = data.messages
    if (Array.isArray(messages) && messages.length > 0) {
      const last = messages[messages.length - 1] as { content?: unknown } | undefined
      const content = last?.content
      if (typeof content === 'string') return { text: content, mode: 'snapshot' }
      if (content && typeof content === 'object' && 'text' in content && typeof (content as { text: unknown }).text === 'string') {
        return { text: (content as { text: string }).text, mode: 'snapshot' }
      }
    }
    return { text: '', mode: 'delta' }
  } catch {
    // A payload that only looks like JSON is plain text.
    return { text: trimmed, mode: 'delta' }
  }
}

/** Text-only view of `extractChunk`, kept for compatibility. */
export function extractDelta(payload: string): string {
  return extractChunk(payload).text
}

/** Split a text buffer into complete lines, keeping the remainder in `rest`. */
function takeLines(buffer: string): { lines: string[]; rest: string } {
  const lines: string[] = []
  let index = buffer.indexOf('\n')
  while (index >= 0) {
    lines.push(buffer.slice(0, index).replace(/\r$/, ''))
    buffer = buffer.slice(index + 1)
    index = buffer.indexOf('\n')
  }
  return { lines, rest: buffer }
}

/** Parse an SSE body into text payloads (`data:` records). */
export async function* parseSSEChunks(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  let buffer = ''
  for await (const chunk of readTextChunks(stream)) {
    buffer += chunk
    const { lines, rest } = takeLines(buffer)
    buffer = rest
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      const delta = extractDelta(payload)
      if (delta) yield delta
    }
  }
  const last = buffer.trim()
  if (last.startsWith('data:')) {
    const payload = last.slice(5).trim()
    if (payload && payload !== '[DONE]') {
      const delta = extractDelta(payload)
      if (delta) yield delta
    }
  }
}

/** Parse an NDJSON body into text payloads (one JSON object per line). */
export async function* parseNDJSONChunks(stream: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  let buffer = ''
  for await (const chunk of readTextChunks(stream)) {
    buffer += chunk
    const { lines, rest } = takeLines(buffer)
    buffer = rest
    for (const line of lines) {
      const delta = extractDelta(line)
      if (delta) yield delta
    }
  }
  const delta = extractDelta(buffer)
  if (delta) yield delta
}

/** Parse an SSE body into chunks, preserving snapshot vs delta. */
export async function* parseSSEChunksDetailed(stream: ReadableStream<Uint8Array>): AsyncGenerator<GenUIStreamChunk> {
  let buffer = ''
  for await (const chunk of readTextChunks(stream)) {
    buffer += chunk
    const { lines, rest } = takeLines(buffer)
    buffer = rest
    for (const line of lines) {
      if (!line.startsWith('data:')) continue
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') return
      const parsed = extractChunk(payload)
      if (parsed.text) yield parsed
    }
  }
  const last = buffer.trim()
  if (last.startsWith('data:')) {
    const payload = last.slice(5).trim()
    if (payload && payload !== '[DONE]') {
      const parsed = extractChunk(payload)
      if (parsed.text) yield parsed
    }
  }
}

/** Parse an NDJSON body into chunks, preserving snapshot vs delta. */
export async function* parseNDJSONChunksDetailed(stream: ReadableStream<Uint8Array>): AsyncGenerator<GenUIStreamChunk> {
  let buffer = ''
  for await (const chunk of readTextChunks(stream)) {
    buffer += chunk
    const { lines, rest } = takeLines(buffer)
    buffer = rest
    for (const line of lines) {
      const parsed = extractChunk(line)
      if (parsed.text) yield parsed
    }
  }
  const parsed = extractChunk(buffer)
  if (parsed.text) yield parsed
}

/**
 * Read any streamed response body as detailed chunks. The wire format is
 * chosen from the content type; plain text is reported as deltas.
 */
export async function* responseChunks(response: Response): AsyncGenerator<GenUIStreamChunk> {
  if (!response.body) return
  const type = (response.headers.get('content-type') ?? '').toLowerCase()
  if (type.includes('text/event-stream')) {
    yield* parseSSEChunksDetailed(response.body)
    return
  }
  if (type.includes('application/x-ndjson')) {
    yield* parseNDJSONChunksDetailed(response.body)
    return
  }
  for await (const text of readTextChunks(response.body)) {
    yield { text, mode: 'delta' }
  }
}

/**
 * Read any streamed response body as OpenUI Lang text chunks.
 *
 * The wire format is chosen from the content type, so the same helper reads a
 * `text/plain` OpenUI Lang stream, an SSE agent stream and an NDJSON stream.
 */
export async function* responseTextChunks(response: Response): AsyncGenerator<string> {
  for await (const chunk of responseChunks(response)) {
    yield chunk.text
  }
}

/** Serve text chunks as a plain-text stream response. */
export function toTextStreamResponse(chunks: AsyncIterable<string>, init: ResponseInit = {}): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      } catch (error) {
        controller.error(error)
        return
      }
      controller.close()
    }
  })
  return new Response(stream, {
    ...init,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      ...(init.headers ?? {})
    }
  })
}
