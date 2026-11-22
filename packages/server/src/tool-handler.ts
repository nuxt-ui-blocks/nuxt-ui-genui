import {
  DEFAULT_REQUEST_LIMITS,
  jsonResponse,
  readJsonObject,
  type GenUIRequestLimits
} from './http'

export interface GenUIToolContext {
  signal: AbortSignal
}

export type GenUIToolExecutor = (
  args: Record<string, unknown>,
  context: GenUIToolContext
) => unknown | Promise<unknown>

/** A deliberately user-safe response produced by `mapError`. */
export interface GenUIToolErrorResponse {
  status: number
  body: unknown
}

export interface GenUIToolErrorContext {
  /** Correlates the client response with the server-side log entry. */
  id: string
  tool: string
  request: Request
}

export interface CreateGenUIToolHandlerOptions {
  /** Executors for privileged operations. Keys are the model-visible names. */
  tools: Record<string, GenUIToolExecutor>
  /** Bounds for the request body and serialized arguments. */
  limits?: GenUIRequestLimits
  /**
   * Map a known exception to a user-safe response. Return `undefined` for
   * anything unexpected so it stays generic. Never receives the raw response.
   */
  mapError?: (error: unknown, context: { tool: string }) => GenUIToolErrorResponse | undefined
  /**
   * Observe unexpected failures server-side (e.g. a structured logger).
   * Receives the same `id` returned to the client for correlation.
   */
  onUnexpectedError?: (error: unknown, context: GenUIToolErrorContext) => void
}

export type GenUIToolHandler = (request: Request) => Promise<Response>

function errorId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
}

/**
 * Execute a named tool on the server. The model only ever sees the name and
 * arguments — it cannot supply code or reach host state directly.
 *
 * Unknown executor failures are deliberately generic on the wire: the original
 * error is only passed to the optional `onUnexpectedError` hook so the host can
 * log it with a matching correlation id. Argument validation is a per-tool
 * responsibility (the name allowlist alone is not validation).
 */
export function createGenUIToolHandler(options: CreateGenUIToolHandlerOptions): GenUIToolHandler {
  const names = new Set(Object.keys(options.tools))
  const limits = { ...DEFAULT_REQUEST_LIMITS, ...options.limits }

  return async (request: Request): Promise<Response> => {
    const read = await readJsonObject(request, limits.maxBodyBytes)
    if (!read.ok) {
      return jsonResponse({ error: read.error }, read.status)
    }
    const body = read.value

    const name = body.name
    if (typeof name !== 'string' || !name || !names.has(name)) {
      return jsonResponse({ error: `Unknown tool "${String(name)}".` }, 400)
    }

    const args = body.args && typeof body.args === 'object' && !Array.isArray(body.args)
      ? body.args as Record<string, unknown>
      : {}
    // `.length` counts UTF-16 code units, not bytes: multibyte JSON (emoji, CJK)
    // could exceed the cap while passing. Measure the actual UTF-8 byte size.
    const argsBytes = new TextEncoder().encode(JSON.stringify(args)).byteLength
    if (argsBytes > limits.maxArgsBytes) {
      return jsonResponse({ error: `Tool arguments exceed ${limits.maxArgsBytes} bytes.` }, 413)
    }

    try {
      const result = await options.tools[name](args, { signal: request.signal })
      return jsonResponse(result === undefined ? {} : result)
    } catch (error) {
      // Host-supplied hooks are untrusted callbacks: a throwing mapper or logger
      // must never turn a handled tool failure into an unhandled rejection.
      try {
        const mapped = options.mapError?.(error, { tool: name })
        if (mapped) {
          return jsonResponse(mapped.body, mapped.status)
        }
      } catch {
        // A failing mapper falls through to the generic, safe response below.
      }

      const id = errorId()
      try {
        options.onUnexpectedError?.(error, { id, tool: name, request })
      } catch {
        // A failing logger must not prevent the response either.
      }
      return jsonResponse({ error: 'Tool execution failed.', id }, 500)
    }
  }
}
