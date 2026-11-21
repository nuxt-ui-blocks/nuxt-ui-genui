import { jsonResponse, readJsonObject } from './http'

export interface GenUIToolContext {
  signal: AbortSignal
}

export type GenUIToolExecutor = (
  args: Record<string, unknown>,
  context: GenUIToolContext
) => unknown | Promise<unknown>

export interface CreateGenUIToolHandlerOptions {
  /** Executors for privileged operations. Keys are the model-visible names. */
  tools: Record<string, GenUIToolExecutor>
}

export type GenUIToolHandler = (request: Request) => Promise<Response>

/**
 * Execute a named tool on the server. The model only ever sees the name and
 * arguments — it cannot supply code or reach host state directly.
 */
export function createGenUIToolHandler(options: CreateGenUIToolHandlerOptions): GenUIToolHandler {
  const names = new Set(Object.keys(options.tools))

  return async (request: Request): Promise<Response> => {
    const body = await readJsonObject(request)
    if (!body) {
      return jsonResponse({ error: 'Request body must be a JSON object.' }, 400)
    }

    const name = body.name
    if (typeof name !== 'string' || !name || !names.has(name)) {
      return jsonResponse({ error: `Unknown tool "${String(name)}".` }, 400)
    }

    const args = body.args && typeof body.args === 'object' && !Array.isArray(body.args)
      ? body.args as Record<string, unknown>
      : {}

    try {
      const result = await options.tools[name](args, { signal: request.signal })
      return jsonResponse(result === undefined ? {} : result)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return jsonResponse({ error: message }, 500)
    }
  }
}
