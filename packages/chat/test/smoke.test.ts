import { describe, it, expect } from 'vitest'
import { collectAssistantText, createGenUIChat, createFetchTransport, isAssistantActive, latestAssistantText } from '../src/index'
import type { GenUITransport } from '../src/index'

async function waitFor(fn: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now()
  while (!fn()) {
    if (Date.now() - start > timeout) throw new Error('waitFor timed out')
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

async function* chunks(...values: string[]) {
  for (const value of values) yield value
}

describe('createGenUIChat', () => {
  it('starts ready and empty', () => {
    const chat = createGenUIChat({ transport: () => chunks('x') })
    expect(chat.status.value).toBe('ready')
    expect(chat.messages.value).toEqual([])
  })

  it('appends the user message and streams the answer into the transcript', async () => {
    const transport: GenUITransport = () => chunks('root = ', 'Card("T", [])')
    const chat = createGenUIChat({ transport })

    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)

    const [user, assistant] = chat.messages.value
    expect(user.role).toBe('user')
    expect(collectAssistantText(user)).toBe('hi')
    expect(assistant.role).toBe('assistant')
    expect(collectAssistantText(assistant)).toBe('root = Card("T", [])')
    expect(assistant.parts[0]).toMatchObject({ type: 'text', state: 'done' })
  })

  it('reports streaming while the transport is running', async () => {
    let release: (() => void) | undefined
    const gate = new Promise<void>(resolve => { release = resolve })
    const transport: GenUITransport = async function* () {
      await gate
      yield 'done'
    }
    const chat = createGenUIChat({ transport })

    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'submitted' || chat.status.value === 'streaming')
    release?.()
    await waitFor(() => chat.status.value === 'ready')
    expect(chat.status.value).toBe('ready')
  })

  it('surfaces a transport failure as an error without throwing', async () => {
    const transport: GenUITransport = () => {
      throw new Error('boom')
    }
    const chat = createGenUIChat({ transport })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'error')
    expect(chat.error.value?.message).toBe('boom')
  })

  it('stops an in-flight response without turning it into an error', async () => {
    // A custom transport must observe the abort signal — that is how a stopped
    // turn ends (the built-in fetch transport aborts the request itself).
    const transport: GenUITransport = async function* ({ signal }) {
      yield 'partial'
      await new Promise((_resolve, reject) => {
        if (signal?.aborted) {
          reject(new Error('aborted'))
          return
        }
        signal?.addEventListener('abort', () => reject(new Error('aborted')))
      })
    }
    const chat = createGenUIChat({ transport })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => collectAssistantText(chat.messages.value[1]) === 'partial')
    chat.stop()
    await waitFor(() => chat.status.value === 'ready')
    expect(chat.error.value).toBeUndefined()
    expect(collectAssistantText(chat.messages.value[1])).toBe('partial')
  })

  it('regenerate drops the last answer and asks again', async () => {
    let calls = 0
    const transport: GenUITransport = () => {
      calls += 1
      return chunks(`answer ${calls}`)
    }
    const chat = createGenUIChat({ transport })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)

    chat.regenerate()
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)
    expect(calls).toBe(2)
    expect(collectAssistantText(chat.messages.value[1])).toBe('answer 2')
  })

  it('clear empties the transcript', async () => {
    const chat = createGenUIChat({ transport: () => chunks('ok') })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)
    chat.clear()
    expect(chat.messages.value).toEqual([])
    expect(chat.status.value).toBe('ready')
  })

  it('ignores an empty turn', () => {
    const chat = createGenUIChat({ transport: () => chunks('x') })
    chat.sendMessage({ text: '   ' })
    expect(chat.messages.value).toEqual([])
  })
})

describe('createFetchTransport', () => {
  it('posts the conversation and reads plain text back', async () => {
    let sent: unknown
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body))
      return new Response('root = Card("T", [])', { status: 200, headers: { 'content-type': 'text/plain' } })
    }) as unknown as typeof globalThis.fetch

    const transport = createFetchTransport({ api: '/api/chat', fetch: fetchImpl })
    const chat = createGenUIChat({ transport })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)

    expect(sent).toEqual({ messages: [{ id: expect.any(String), role: 'user', parts: [{ type: 'text', text: 'hi', state: 'done' }] }] })
    expect(collectAssistantText(chat.messages.value[1])).toBe('root = Card("T", [])')
  })

  it('throws with the status when the server rejects the turn', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof globalThis.fetch
    const transport = createFetchTransport({ api: '/api/chat', fetch: fetchImpl })
    const chat = createGenUIChat({ transport })
    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'error')
    expect(chat.error.value?.message).toContain('500')
  })
})

describe('collectAssistantText', () => {
  it('joins only text parts and ignores other parts', () => {
    const text = collectAssistantText({
      parts: [
        { type: 'text', text: 'a' } as never,
        { type: 'tool-getWeather' } as never,
        { type: 'text', text: 'b' } as never
      ]
    })
    expect(text).toBe('ab')
  })
  it('returns empty string for missing parts / message', () => {
    expect(collectAssistantText(undefined)).toBe('')
    expect(collectAssistantText({})).toBe('')
  })
})

describe('isAssistantActive', () => {
  it('is true only while submitted or streaming', () => {
    expect(isAssistantActive('submitted')).toBe(true)
    expect(isAssistantActive('streaming')).toBe(true)
    expect(isAssistantActive('ready')).toBe(false)
    expect(isAssistantActive('error')).toBe(false)
    expect(isAssistantActive(undefined)).toBe(false)
  })
})

describe('latestAssistantText', () => {
  it('returns the text of the last assistant message', () => {
    expect(latestAssistantText([
      { role: 'assistant', parts: [{ type: 'text', text: 'first' }] },
      { role: 'user', parts: [{ type: 'text', text: 'hi' }] },
      { role: 'assistant', parts: [{ type: 'text', text: 'second' }] }
    ])).toBe('second')
  })
  it('returns empty when no assistant message exists', () => {
    expect(latestAssistantText([{ role: 'user', parts: [{ type: 'text', text: 'hi' }] }])).toBe('')
  })
})
