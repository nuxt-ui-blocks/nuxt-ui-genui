import { describe, expect, it, vi } from 'vitest'
import { streamChat } from '../app/utils/streamChat'

function sseResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/event-stream' } })
}

describe('streamChat', () => {
  it('parses chunk/done frames split across reads', async () => {
    const frames =
      'event: chunk\ndata: {"text":"root"}\n\n' +
      'event: chunk\ndata: {"text":" = SalesDashboard("}\n\n' +
      'event: done\ndata: {"ok":true,"ui":"root = SalesDashboard()","meta":{"mode":"chat","model":"gpt-test","validated":true}}\n\n'
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse(frames)))

    const events: any[] = []
    await streamChat(
      { messages: [{ role: 'user', content: 'dash' }] },
      (e) => events.push(e)
    )
    expect(events.map((e) => e.type)).toEqual(['chunk', 'chunk', 'done'])
    expect(events[2].ui).toBe('root = SalesDashboard()')
    vi.unstubAllGlobals()
  })

  it('throws with the server message on non-200 responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ statusMessage: 'OPENAI_API_KEY and OPENAI_MODEL must be set (see .env.example). No default model is provided.' }), {
          status: 500,
          headers: { 'content-type': 'application/json' }
        })
      )
    )

    await expect(
      streamChat({ messages: [{ role: 'user', content: 'dash' }] }, () => {})
    ).rejects.toThrow(/OPENAI_API_KEY/)
    vi.unstubAllGlobals()
  })

  it('throws on malformed SSE data lines', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => sseResponse('event: chunk\ndata: {not-json}\n\n')))
    await expect(
      streamChat({ messages: [{ role: 'user', content: 'dash' }] }, () => {})
    ).rejects.toThrow()
    vi.unstubAllGlobals()
  })
})
