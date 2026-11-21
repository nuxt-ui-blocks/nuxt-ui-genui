import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod/v4'
import { createGenUILibrary, defineGenUIComponent } from '@nuxt-ui-genui/core'
import { createGenUIChatHandler, type GenUISendRequest } from '../src'
import type { GenUIToolSpec } from '../src'

const library = createGenUILibrary({
  components: [defineGenUIComponent({
    name: 'Card',
    props: z.object({ children: z.array(z.unknown()).optional() }),
    description: 'Content container'
  })],
  root: 'Card'
})

const tools: readonly GenUIToolSpec[] = [{
  name: 'get_server_health',
  description: 'Read server health',
  inputSchema: { type: 'object', properties: { server_id: { type: 'string' } } }
}]

function request(body: unknown, init: RequestInit = {}): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...init
  })
}

describe('createGenUIChatHandler', () => {
  it('streams the sender output and builds a prompt that advertises tools', async () => {
    let captured: GenUISendRequest | undefined
    const handler = createGenUIChatHandler({
      library,
      tools,
      sender: async (sendRequest) => {
        captured = sendRequest
        return 'Card(children: [TextContent(text: "ok")])'
      }
    })

    const response = await handler(request({ messages: [{ role: 'user', content: 'hello' }] }))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toBe('Card(children: [TextContent(text: "ok")])')
    expect(captured?.messages).toEqual([{ role: 'user', content: 'hello' }])
    expect(captured?.systemPrompt).toContain('get_server_health')
  })

  it('accepts plain strings and flattens AI SDK parts', async () => {
    let captured: GenUISendRequest | undefined
    const handler = createGenUIChatHandler({
      library,
      sender: async (sendRequest) => {
        captured = sendRequest
        return 'hi'
      }
    })

    await handler(request({
      messages: [
        'plain',
        { role: 'assistant', parts: [{ type: 'text', text: 'one' }, { type: 'text', text: 'two' }] }
      ]
    }))
    expect(captured?.messages).toEqual([
      { role: 'user', content: 'plain' },
      { role: 'assistant', content: 'onetwo' }
    ])
  })

  it('forwards the abort signal to the sender', async () => {
    const controller = new AbortController()
    // undici derives a new AbortSignal from the one passed to Request, so the
    // platform-level proof is the aborted state, not object identity.
    controller.abort()
    let seen: AbortSignal | undefined
    const handler = createGenUIChatHandler({
      library,
      sender: async ({ signal }) => {
        seen = signal
        return 'ok'
      }
    })
    await handler(request({ messages: ['hi'] }, { signal: controller.signal }))
    expect(seen?.aborted).toBe(true)
  })

  it('rejects malformed bodies with 400', async () => {
    const handler = createGenUIChatHandler({ library, sender: () => 'ok' })
    expect((await handler(request({ nope: true }))).status).toBe(400)
    expect((await handler(request({ messages: [] }))).status).toBe(400)
    expect((await handler(request({ messages: [{ unknown: 1 }] }))).status).toBe(400)
  })

  it('uses an injected system prompt verbatim', async () => {
    let captured: GenUISendRequest | undefined
    const handler = createGenUIChatHandler({
      library,
      systemPrompt: 'CUSTOM',
      sender: async (sendRequest) => {
        captured = sendRequest
        return 'ok'
      }
    })
    await handler(request({ messages: ['hi'] }))
    expect(captured?.systemPrompt).toBe('CUSTOM')
  })

  it('passes through an async iterable sender', async () => {
    async function* chunks() {
      yield 'Card('
      yield 'title: "x")'
    }
    const handler = createGenUIChatHandler({ library, sender: () => chunks() })
    const response = await handler(request({ messages: ['hi'] }))
    expect(await response.text()).toBe('Card(title: "x")')
  })

  it('does not invoke the sender on invalid input', async () => {
    const sender = vi.fn(() => 'ok')
    const handler = createGenUIChatHandler({ library, sender })
    await handler(request({ messages: [] }))
    expect(sender).not.toHaveBeenCalled()
  })
})
