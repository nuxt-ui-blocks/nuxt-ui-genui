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

  it('does not leak raw executor errors and reports them via the hook', async () => {
    const onUnexpectedError = vi.fn()
    const handler = createGenUIToolHandler({
      tools: { boom: () => { throw new Error('db password is hunter2 at /srv/prod') } },
      onUnexpectedError
    })
    const response = await handler(request({ name: 'boom' }))
    expect(response.status).toBe(500)
    const body = await response.json() as { error: string; id: string }
    expect(body.error).toBe('Tool execution failed.')
    expect(body.id).toBeTruthy()
    expect(body).not.toHaveProperty('db password is hunter2 at /srv/prod')
    expect(JSON.stringify(body)).not.toContain('hunter2')

    expect(onUnexpectedError).toHaveBeenCalledTimes(1)
    const [thrown, context] = onUnexpectedError.mock.calls[0] as [Error, { id: string; tool: string; request: Request }]
    expect(thrown.message).toBe('db password is hunter2 at /srv/prod')
    expect(context.id).toBe(body.id)
    expect(context.tool).toBe('boom')
    expect(context.request).toBeInstanceOf(Request)
  })

  it('uses a mapped, user-safe error when the host supplies one', async () => {
    const handler = createGenUIToolHandler({
      tools: { doomed: () => { throw new Error('row id 42 missing in table X') } },
      mapError: (error) => error instanceof Error && error.message.includes('42')
        ? { status: 404, body: { error: 'Record not found.' } }
        : undefined
    })
    const response = await handler(request({ name: 'doomed' }))
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toEqual({ error: 'Record not found.' })
    expect(JSON.stringify(body)).not.toContain('table X')
  })

  it('rejects oversized tool arguments with 413', async () => {
    const handler = createGenUIToolHandler({
      tools: { echo: (args) => args },
      limits: { maxArgsBytes: 32 }
    })
    const response = await handler(request({ name: 'echo', args: { blob: 'x'.repeat(100) } }))
    expect(response.status).toBe(413)
    expect((await response.json() as { error: string }).error).toContain('arguments exceed')
  })

  it('measures argument size in UTF-8 bytes, not UTF-16 code units', async () => {
    const handler = createGenUIToolHandler({
      tools: { echo: (args) => args },
      limits: { maxArgsBytes: 40 }
    })
    // 20 CJK chars: 20 code units but 60 UTF-8 bytes; the serialized args are
    // ~31 code units (would pass the old check) yet ~71 bytes (must be rejected).
    const args = { blob: '\u4E2D'.repeat(20) }
    expect(JSON.stringify(args).length).toBeLessThanOrEqual(40)
    expect(new TextEncoder().encode(JSON.stringify(args)).byteLength).toBeGreaterThan(40)
    const response = await handler(request({ name: 'echo', args }))
    expect(response.status).toBe(413)
    expect((await response.json() as { error: string }).error).toContain('arguments exceed')
  })

  it('returns a safe 500 even when mapError itself throws', async () => {
    const handler = createGenUIToolHandler({
      tools: { boom: () => { throw new Error('secret detail') } },
      mapError: () => { throw new Error('mapper crashed') }
    })
    const response = await handler(request({ name: 'boom' }))
    expect(response.status).toBe(500)
    const body = await response.json() as { error: string; id: string }
    expect(body.error).toBe('Tool execution failed.')
    expect(body.id).toBeTruthy()
    expect(JSON.stringify(body)).not.toContain('secret')
  })

  it('returns a safe 500 even when the logging hook throws', async () => {
    const handler = createGenUIToolHandler({
      tools: { boom: () => { throw new Error('secret detail') } },
      onUnexpectedError: () => { throw new Error('logger crashed') }
    })
    const response = await handler(request({ name: 'boom' }))
    expect(response.status).toBe(500)
    const body = await response.json() as { error: string; id: string }
    expect(body.error).toBe('Tool execution failed.')
    expect(body.id).toBeTruthy()
    expect(JSON.stringify(body)).not.toContain('secret')
  })
})
