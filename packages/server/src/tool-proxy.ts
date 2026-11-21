export interface GenUIToolProxyOptions {
  /** Absolute URL of the endpoint created by `createGenUIToolHandler`. */
  endpoint: string
  headers?: Record<string, string>
  /** Injectable for tests; defaults to the global fetch. */
  fetch?: typeof fetch
  /** When supplied, unknown names are rejected locally, before any request. */
  tools?: readonly { name: string }[]
}

/** Compatible with vue-lang's `toolProvider` prop. */
export type GenUIToolProvider = Record<string, (args: Record<string, unknown>) => Promise<unknown>>

/**
 * Turn a server tool endpoint into a plain provider for `Query()`/`Mutation()`.
 * Authorization belongs on the endpoint; this proxy only forwards name/args.
 */
export function createGenUIToolProxyProvider(options: GenUIToolProxyOptions): GenUIToolProvider {
  const allowed = options.tools ? new Set(options.tools.map((tool) => tool.name)) : null
  const doFetch = options.fetch ?? globalThis.fetch
  const target = Object.create(null) as GenUIToolProvider

  return new Proxy(target, {
    get(_target, name: string | symbol) {
      // `then` would make the provider thenable; symbols are not tool names.
      if (typeof name !== 'string' || name === 'then') return undefined

      return async (args: Record<string, unknown>): Promise<unknown> => {
        if (allowed && !allowed.has(name)) {
          throw new Error(`Tool "${name}" is not registered.`)
        }
        const response = await doFetch(options.endpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', ...options.headers },
          body: JSON.stringify({ name, args })
        })
        if (!response.ok) {
          let detail = ''
          try {
            detail = (await response.text()).slice(0, 400)
          } catch {
            // A missing error body must not mask the status.
          }
          throw new Error(`Tool "${name}" failed (${response.status}): ${detail}`)
        }
        return response.json()
      }
    }
  })
}
