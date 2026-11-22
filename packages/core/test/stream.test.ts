import { describe, it, expect } from 'vitest'
import {
  extractChunk,
  extractDelta,
  parseNDJSONChunks,
  parseNDJSONChunksDetailed,
  parseSSEChunks,
  parseSSEChunksDetailed,
  readTextChunks,
  responseChunks,
  responseTextChunks,
  toTextStreamResponse
} from '../src/stream'
import type { GenUIStreamChunk } from '../src/stream'

function streamOf(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    }
  })
}

async function collect(iterable: AsyncIterable<string>): Promise<string> {
  let out = ''
  for await (const chunk of iterable) out += chunk
  return out
}

async function collectChunks(iterable: AsyncIterable<GenUIStreamChunk>): Promise<GenUIStreamChunk[]> {
  const chunks: GenUIStreamChunk[] = []
  for await (const chunk of iterable) chunks.push(chunk)
  return chunks
}

describe('readTextChunks', () => {
  it('decodes a byte stream into text', async () => {
    expect(await collect(readTextChunks(streamOf('hello world')))).toBe('hello world')
  })

  it('handles multi-byte characters split across chunks', async () => {
    const encoder = new TextEncoder()
    const bytes = encoder.encode('héllo')
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 2))
        controller.enqueue(bytes.slice(2))
        controller.close()
      }
    })
    expect(await collect(readTextChunks(stream))).toBe('héllo')
  })
})

describe('extractDelta', () => {
  it('returns plain text as-is', () => {
    expect(extractDelta('root = Card()')).toBe('root = Card()')
  })
  it('unwraps the common JSON payload shapes', () => {
    expect(extractDelta('{"delta":"a"}')).toBe('a')
    expect(extractDelta('{"text":"b"}')).toBe('b')
    expect(extractDelta('{"content":"c"}')).toBe('c')
    expect(extractDelta('{"message":{"text":"d"}}')).toBe('d')
  })
  it('returns empty for JSON without a known field', () => {
    expect(extractDelta('{"other":1}')).toBe('')
  })
  it('treats broken JSON as plain text', () => {
    expect(extractDelta('{oops')).toBe('{oops')
  })
})

describe('parseSSEChunks', () => {
  it('reads data records and stops at [DONE]', async () => {
    const body = 'data: {"delta":"a"}\n\ndata: {"delta":"b"}\n\ndata: [DONE]\n\ndata: {"delta":"c"}\n'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('ab')
  })

  it('joins multiple data fields of one event with newlines', async () => {
    const body = 'data: root = Card(\ndata:   Text("hi")\ndata: )\n\n'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('root = Card(\n  Text("hi")\n)')
  })

  it('joins a JSON payload split across data fields', async () => {
    const body = 'data: {"delta":\ndata: "a"}\n\n'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('a')
  })

  it('accepts whitespace-prefixed field names', async () => {
    const body = '  data: {"delta":"a"}\n\ndata: {"delta":"b"}\n\n'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('ab')
  })

  it('ignores comments and non-data fields', async () => {
    const body = ': heartbeat\n\nevent: message\nid: 1\ndata: {"delta":"a"}\n\n: ping\ndata: {"delta":"b"}\n\n'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('ab')
  })

  it('assembles events split across byte chunks', async () => {
    const encoder = new TextEncoder()
    const parts = ['data: {"de', 'lta":"a"}\n\ndata: {"delta":', '"b"}\n\n']
    const stream = new ReadableStream({
      start(controller) {
        for (const part of parts) controller.enqueue(encoder.encode(part))
        controller.close()
      }
    })
    expect(await collect(parseSSEChunks(stream))).toBe('ab')
  })

  it('emits a final event without a trailing blank line', async () => {
    const body = 'data: {"delta":"a"}\n\ndata: {"delta":"b"}'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('ab')
  })

  it('stops at an unterminated [DONE] event', async () => {
    const body = 'data: {"delta":"a"}\n\ndata: [DONE]'
    expect(await collect(parseSSEChunks(streamOf(body)))).toBe('a')
  })
})

describe('parseNDJSONChunks', () => {
  it('reads one JSON object per line', async () => {
    const body = '{"delta":"a"}\n{"delta":"b"}\n'
    expect(await collect(parseNDJSONChunks(streamOf(body)))).toBe('ab')
  })
})

describe('responseTextChunks', () => {
  it('reads a plain text response', async () => {
    const response = new Response('root = Card()', { headers: { 'content-type': 'text/plain' } })
    expect(await collect(responseTextChunks(response))).toBe('root = Card()')
  })

  it('reads an SSE response', async () => {
    const response = new Response('data: {"delta":"a"}\n\n', { headers: { 'content-type': 'text/event-stream' } })
    expect(await collect(responseTextChunks(response))).toBe('a')
  })

  it('reads an NDJSON response', async () => {
    const response = new Response('{"delta":"a"}\n', { headers: { 'content-type': 'application/x-ndjson' } })
    expect(await collect(responseTextChunks(response))).toBe('a')
  })
})

describe('extractChunk', () => {
  it('marks a messages[] payload as a snapshot', () => {
    expect(extractChunk('{"messages":[{"role":"user","content":"a"},{"role":"assistant","content":"ab"}]}'))
      .toEqual({ text: 'ab', mode: 'snapshot' })
  })
  it('marks a messages[] payload with a text object as a snapshot', () => {
    expect(extractChunk('{"messages":[{"content":{"text":"ab"}}]}'))
      .toEqual({ text: 'ab', mode: 'snapshot' })
  })
  it('marks the common incremental shapes as deltas', () => {
    expect(extractChunk('{"delta":"a"}')).toEqual({ text: 'a', mode: 'delta' })
    expect(extractChunk('{"text":"b"}')).toEqual({ text: 'b', mode: 'delta' })
    expect(extractChunk('{"content":"c"}')).toEqual({ text: 'c', mode: 'delta' })
    expect(extractChunk('{"message":{"text":"d"}}')).toEqual({ text: 'd', mode: 'delta' })
    expect(extractChunk('{"choices":[{"delta":{"content":"e"}}]}')).toEqual({ text: 'e', mode: 'delta' })
  })
  it('marks plain text and broken JSON as deltas', () => {
    expect(extractChunk('root = Card()')).toEqual({ text: 'root = Card()', mode: 'delta' })
    expect(extractChunk('{oops')).toEqual({ text: '{oops', mode: 'delta' })
  })
})

describe('detailed parsers', () => {
  it('preserves snapshot mode through NDJSON', async () => {
    const body = '{"messages":[{"content":"a"}]}\n{"messages":[{"content":"ab"}]}\n'
    expect(await collectChunks(parseNDJSONChunksDetailed(streamOf(body)))).toEqual([
      { text: 'a', mode: 'snapshot' },
      { text: 'ab', mode: 'snapshot' }
    ])
  })
  it('preserves snapshot mode through SSE', async () => {
    const body = 'data: {"messages":[{"content":"a"}]}\n\ndata: {"delta":"b"}\n\ndata: [DONE]\n\n'
    expect(await collectChunks(parseSSEChunksDetailed(streamOf(body)))).toEqual([
      { text: 'a', mode: 'snapshot' },
      { text: 'b', mode: 'delta' }
    ])
  })
  it('preserves snapshot mode through SSE comments and multi-line data', async () => {
    const body = ': ping\n\ndata: {"messages":\ndata: [{"content":"ab"}]}\n\n'
    expect(await collectChunks(parseSSEChunksDetailed(streamOf(body)))).toEqual([
      { text: 'ab', mode: 'snapshot' }
    ])
  })
})

describe('responseChunks', () => {
  it('reports plain text as deltas', async () => {
    const response = new Response('root = Card()', { headers: { 'content-type': 'text/plain' } })
    expect(await collectChunks(responseChunks(response))).toEqual([
      { text: 'root = Card()', mode: 'delta' }
    ])
  })
  it('preserves snapshots and deltas from an NDJSON response', async () => {
    const body = '{"messages":[{"content":"a"}]}\n{"messages":[{"content":"ab"}]}\n{"delta":"c"}\n'
    const response = new Response(body, { headers: { 'content-type': 'application/x-ndjson' } })
    expect(await collectChunks(responseChunks(response))).toEqual([
      { text: 'a', mode: 'snapshot' },
      { text: 'ab', mode: 'snapshot' },
      { text: 'c', mode: 'delta' }
    ])
  })
})

describe('toTextStreamResponse', () => {
  it('serves the chunks as plain text', async () => {
    const response = toTextStreamResponse(chunks('a', 'b'))
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toBe('ab')
  })
})

async function* chunks(...values: string[]) {
  for (const value of values) yield value
}
