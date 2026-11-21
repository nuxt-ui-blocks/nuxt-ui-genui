import { describe, expect, it } from 'vitest'
import type { GenUIStreamChunk } from '@nuxt-ui-genui/core'
import { createGenUIChat, latestAssistantText } from '../src/index'
import type { GenUITransport } from '../src/index'

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error('waitFor timed out')
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

function textTransport(...chunks: Array<string | GenUIStreamChunk>): GenUITransport {
  return async function* () {
    for (const chunk of chunks) yield chunk
  }
}

async function runTurn(chunks: Array<string | GenUIStreamChunk>): Promise<string> {
  const chat = createGenUIChat({ transport: textTransport(...chunks) })
  chat.sendMessage({ text: 'hi' })
  await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)
  return latestAssistantText(chat.messages.value)
}

describe('snapshot vs delta streaming', () => {
  it('two successive snapshots replace rather than append', async () => {
    const text = await runTurn([
      { text: 'a', mode: 'snapshot' },
      { text: 'ab', mode: 'snapshot' }
    ])
    expect(text).toBe('ab')
  })

  it('interleaved delta and snapshot behaves as replace-then-append', async () => {
    const text = await runTurn([
      'x',
      { text: 'ab', mode: 'snapshot' },
      'c'
    ])
    expect(text).toBe('abc')
  })

  it('plain string chunks still append as deltas', async () => {
    const text = await runTurn(['Hel', 'lo'])
    expect(text).toBe('Hello')
  })
})
