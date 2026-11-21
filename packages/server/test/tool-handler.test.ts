import { describe, expect, it, vi } from 'vitest'
import { createGenUIToolHandler } from '../src'

function request(body: unknown): Request {
  return new Request('http://localhost/api/tool', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  })
}

describe('createGenUIToolHandler', () => {
  it('executes the named tool with args and the abort signal', async () => {
    const controller = new AbortController()
    // undici derives a new AbortSignal from the one passed to Request, so the
    // platform-level proof is the aborted state, not object identity.
    controller.abort()
    const execute = vi.fn(async (args: Record<string, unknown>, { signal }: { signal: AbortSignal }) => ({
      ok: args.server_id === 'prod',
      aborted: signal.aborted
    }))
    const handler = createGenUIToolHandler({ tools: { get_server_health: execute } })

    const response = await handler(
      new Request('http://localhost/api/tool', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'get_server_health', args: { server_id: 'prod' } }),
        signal: controller.signal
      })
    )
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, aborted: true })
    expect(execute.mock.calls[0][0]).toEqual({ server_id: 'prod' })
    expect(execute.mock.calls[0][1].signal.aborted).toBe(true)
  })

  it('returns JSON even when a tool resolves undefined', async () => {
    const handler = createGenUIToolHandler({ tools: { noop: () => undefined } })
    const response = await handler(request({ name: 'noop' }))
    expect(await response.json()).toEqual({})
  })

  it('rejects a missing or unknown tool with 400', async () => {
    const handler = createGenUIToolHandler({ tools: { known: () => 1 } })
    expect((await handler(request({ args: {} }))).status).toBe(400)
    expect((await handler(request({ name: 'unknown' }))).status).toBe(400)
  })

  it('rejects an invalid body with 400', async () => {
    const handler = createGenUIToolHandler({ tools: { known: () => 1 } })
    const response = await handler(new Request('http://localhost/api/tool', { method: 'POST', body: 'not json' }))
    expect(response.status).toBe(400)
  })

  it('reports an executor failure as 500 JSON', async () => {
    const handler = createGenUIToolHandler({
      tools: { boom: () => { throw new Error('tool exploded') } }
    })
    const response = await handler(request({ name: 'boom' }))
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'tool exploded' })
  })
})
