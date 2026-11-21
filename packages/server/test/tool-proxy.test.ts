import { describe, expect, it, vi } from 'vitest'
import { createGenUIToolProxyProvider } from '../src'

describe('createGenUIToolProxyProvider', () => {
  it('posts the tool name and args and returns the parsed result', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    }))
    const provider = createGenUIToolProxyProvider({
      endpoint: 'https://example.test/api/tool',
      headers: { authorization: 'Bearer test' },
      fetch: fetchMock as never
    })

    await expect(provider.get_server_health({ server_id: 'prod' })).resolves.toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://example.test/api/tool')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toMatchObject({ authorization: 'Bearer test' })
    expect(JSON.parse(String(init?.body))).toEqual({
      name: 'get_server_health',
      args: { server_id: 'prod' }
    })
  })

  it('throws with status and body on a non-2xx response', async () => {
    const fetchMock = vi.fn(async () => new Response('permission denied', { status: 403 }))
    const provider = createGenUIToolProxyProvider({
      endpoint: 'https://example.test/api/tool',
      fetch: fetchMock as never
    })
    await expect(provider.some_tool({})).rejects.toThrow('Tool "some_tool" failed (403): permission denied')
  })

  it('rejects an unlisted tool without calling the network', async () => {
    const fetchMock = vi.fn()
    const provider = createGenUIToolProxyProvider({
      endpoint: 'https://example.test/api/tool',
      tools: [{ name: 'allowed_tool' }],
      fetch: fetchMock as never
    })
    await expect(provider.not_allowed({})).rejects.toThrow('not registered')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not expose a thenable provider to the renderer', () => {
    const provider = createGenUIToolProxyProvider({
      endpoint: 'https://example.test/api/tool',
      fetch: vi.fn() as never
    })
    expect((provider as Record<string, unknown>).then).toBeUndefined()
  })
})
