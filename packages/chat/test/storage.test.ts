import { describe, expect, it } from 'vitest'
import {
  createGenUIChat,
  createLocalStorageAdapter,
  type GenUIChatStorage,
  type GenUIMessage,
  type GenUIStorageLike
} from '../src'

function message(role: GenUIMessage['role'], text: string, id = `${role}-1`): GenUIMessage {
  return { id, role, parts: [{ type: 'text', text, state: 'done' }] }
}

function textOf(message: GenUIMessage): string {
  return message.parts
    .map(part => (part as { text?: string }).text ?? '')
    .join('')
}

/** A few microtasks: enough for the debounced writes and async hydration to settle. */
async function flush(): Promise<void> {
  for (let i = 0; i < 12; i++) await Promise.resolve()
}

async function waitFor(predicate: () => boolean, timeout = 2000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > timeout) throw new Error('waitFor timed out')
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

function memoryStore(contents?: string): GenUIStorageLike {
  let value = contents ?? null
  return {
    getItem: () => value,
    setItem: (_key, next) => { value = next },
    removeItem: () => { value = null }
  }
}

interface SpyStorage extends GenUIChatStorage {
  saves: GenUIMessage[][]
  clearCalls: number
  loadCalls: number
}

function spyStorage(loaded: GenUIMessage[] = []): SpyStorage {
  return {
    saves: [],
    clearCalls: 0,
    loadCalls: 0,
    load() { this.loadCalls += 1; return loaded },
    save(messages) { this.saves.push(messages) },
    clear() { this.clearCalls += 1 }
  }
}

describe('createLocalStorageAdapter', () => {
  it('loads a stored transcript from the injected store', () => {
    const saved = [message('user', 'hello')]
    const adapter = createLocalStorageAdapter('genui-test', memoryStore(JSON.stringify(saved)))
    expect(adapter.load()).toEqual(saved)
  })

  it('treats corrupt or non-array data as empty history', () => {
    expect(createLocalStorageAdapter('genui-test', memoryStore('{nope')).load()).toEqual([])
    expect(createLocalStorageAdapter('genui-test', memoryStore('{"a":1}')).load()).toEqual([])
    expect(createLocalStorageAdapter('genui-test', memoryStore()).load()).toEqual([])
  })

  it('saves and clears through the injected store', () => {
    const store = memoryStore()
    const adapter = createLocalStorageAdapter('genui-test', store)
    const saved = [message('user', 'hi')]
    adapter.save(saved)
    expect(adapter.load()).toEqual(saved)
    adapter.clear()
    expect(adapter.load()).toEqual([])
  })

  it('is a safe no-op when there is no browser storage', () => {
    const adapter = createLocalStorageAdapter('genui-test')
    expect(() => {
      expect(adapter.load()).toEqual([])
      adapter.save([message('user', 'hi')])
      adapter.clear()
    }).not.toThrow()
  })
})

describe('createGenUIChat storage integration', () => {
  it('hydrates from storage when no explicit messages are supplied', async () => {
    const saved = [message('user', 'restored')]
    const storage = spyStorage(saved)
    const chat = createGenUIChat({ transport: async function* () {}, storage })

    expect(chat.messages.value).toEqual([])
    await flush()
    expect(storage.loadCalls).toBe(1)
    expect(chat.messages.value).toEqual(saved)
  })

  it('keeps explicit messages instead of hydrating', async () => {
    const explicit = [message('user', 'explicit')]
    const storage = spyStorage([message('user', 'restored')])
    const chat = createGenUIChat({ transport: async function* () {}, messages: explicit, storage })

    await flush()
    expect(storage.loadCalls).toBe(0)
    expect(chat.messages.value).toEqual(explicit)
  })

  it('does not let a late hydration clobber a turn the user started first', async () => {
    let release!: () => void
    const gate = new Promise<void>(resolve => { release = resolve })
    const storage = spyStorage([message('user', 'restored')])
    storage.load = async () => { await gate; return [message('user', 'restored')] }
    const chat = createGenUIChat({ transport: async function* () { yield 'ok' }, storage })

    chat.sendMessage({ text: 'fresh' })
    release()
    await waitFor(() => chat.status.value === 'ready')
    await flush()

    expect(chat.messages.value.some(m => textOf(m) === 'fresh')).toBe(true)
    expect(chat.messages.value.some(m => textOf(m) === 'restored')).toBe(false)
  })

  it('saves the completed transcript after a turn', async () => {
    const storage = spyStorage([])
    const chat = createGenUIChat({
      transport: async function* () { yield 'Hel'; yield 'lo' },
      storage
    })

    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)
    await flush()

    expect(storage.saves.length).toBeGreaterThan(0)
    const last = storage.saves.at(-1)!
    expect(last.map(m => m.role)).toEqual(['user', 'assistant'])
    expect(textOf(last[1]!)).toBe('Hello')
  })

  it('clears storage instead of saving an empty transcript', async () => {
    const storage = spyStorage([])
    const chat = createGenUIChat({ transport: async function* () {}, storage })

    chat.clear()
    await flush()
    expect(storage.clearCalls).toBe(1)
    expect(storage.saves.length).toBe(0)
  })

  it('swallows storage failures so they never become chat errors', async () => {
    const storage = spyStorage([])
    storage.load = () => { throw new Error('denied') }
    storage.save = () => { throw new Error('quota') }
    const chat = createGenUIChat({ transport: async function* () { yield 'ok' }, storage })

    chat.sendMessage({ text: 'hi' })
    await waitFor(() => chat.status.value === 'ready' && chat.messages.value.length === 2)
    await flush()

    expect(chat.error.value).toBeUndefined()
    expect(chat.status.value).toBe('ready')
  })
})
