import type { GenUIMessage } from './types'

/** Minimal `localStorage` surface; injectable so tests and non-browser hosts work. */
export interface GenUIStorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Persistence seam for a chat transcript. All methods are best-effort. */
export interface GenUIChatStorage {
  load(): GenUIMessage[] | Promise<GenUIMessage[]>
  save(messages: GenUIMessage[]): void | Promise<void>
  clear(): void | Promise<void>
}

function resolveStorage(explicit?: GenUIStorageLike): GenUIStorageLike | undefined {
  if (explicit) return explicit
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage
  }
  catch {
    // Access to storage can be denied (privacy mode, embedded frames).
    return undefined
  }
}

/**
 * Persist a transcript under `key` in `localStorage` (or an injected store).
 * Corrupt data is treated as an empty history, and storage failures never
 * surface as chat errors.
 */
export function createLocalStorageAdapter(key: string, storage?: GenUIStorageLike): GenUIChatStorage {
  return {
    load() {
      const target = resolveStorage(storage)
      if (!target) return []
      try {
        const raw = target.getItem(key)
        if (!raw) return []
        const parsed: unknown = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed as GenUIMessage[] : []
      }
      catch {
        return []
      }
    },
    save(messages) {
      const target = resolveStorage(storage)
      if (!target) return
      try {
        target.setItem(key, JSON.stringify(messages))
      }
      catch {
        // Quota / serialization failures must not break the conversation.
      }
    },
    clear() {
      const target = resolveStorage(storage)
      if (!target) return
      try {
        target.removeItem(key)
      }
      catch {
        // Ignore unavailable storage.
      }
    }
  }
}
