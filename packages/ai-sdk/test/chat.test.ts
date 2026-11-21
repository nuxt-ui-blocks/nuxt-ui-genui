import { describe, expect, it, vi, afterEach } from 'vitest'
import { DefaultChatTransport, TextStreamChatTransport } from 'ai'
import { createAIChat } from '../src/chat'

const transportOf = (chat: unknown) => (chat as { transport: unknown }).transport

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createAIChat', () => {
  it('defaults to a plain-text OpenUI Lang transport for /api/chat', () => {
    const chat = createAIChat()
    expect(transportOf(chat)).toBeInstanceOf(TextStreamChatTransport)
    expect((transportOf(chat) as any).api).toBe('/api/chat')
  })

  it('selects the AI SDK UI message stream when protocol is ui-stream', () => {
    const chat = createAIChat({ protocol: 'ui-stream' })
    expect(transportOf(chat)).toBeInstanceOf(DefaultChatTransport)
    expect((transportOf(chat) as any).api).toBe('/api/chat')
  })

  it('honors custom api, headers and credentials on either transport', () => {
    const headers = { 'x-genui': '1' }
    const textChat = createAIChat({ api: '/custom/text', headers, credentials: 'include' })
    expect((transportOf(textChat) as any).api).toBe('/custom/text')
    expect((transportOf(textChat) as any).headers).toEqual(headers)
    expect((transportOf(textChat) as any).credentials).toBe('include')

    const uiChat = createAIChat({ api: '/custom/ui', protocol: 'ui-stream', headers, credentials: 'include' })
    expect((transportOf(uiChat) as any).api).toBe('/custom/ui')
    expect((transportOf(uiChat) as any).headers).toEqual(headers)
    expect((transportOf(uiChat) as any).credentials).toBe('include')
  })

  it('lets a host pass its own transport unchanged for any backend', () => {
    const transport = { sendMessages: vi.fn(), dispose: vi.fn() } as any
    const chat = createAIChat({ transport, api: '/ignored', protocol: 'ui-stream' })
    expect(transportOf(chat)).toBe(transport)
  })

  it('streams plain text into an assistant message via fetch when protocol is text', async () => {
    const body = 'root = Card("T", [note])\nnote = TextContent("hello via fetch")'
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(body, { status: 200, headers: { 'content-type': 'text/plain' } })
    ))
    const chat = createAIChat()
    await chat.sendMessage({ text: 'build it' })
    const assistant = [...chat.messages].reverse().find((m: any) => m.role === 'assistant')
    expect(assistant).toBeTruthy()
    expect(assistant).toMatchObject({ role: 'assistant' })
    expect(JSON.stringify((assistant as any).parts)).toContain('hello via fetch')
  })
})
