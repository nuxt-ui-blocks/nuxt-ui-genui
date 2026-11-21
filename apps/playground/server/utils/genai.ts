import type { GenUILiveOptions } from '@nuxt-ui-genui/ai-sdk'

/**
 * Playground-only environment convention.
 *
 * The `GENAI_*` variables and these resolvers are NOT part of the
 * `@nuxt-ui-genui/*` adapter contract: `@nuxt-ui-genui/ai-sdk` receives `live`
 * fully injected (`apiKey`, `baseURL`, `model`) and never reads `process.env`.
 * This helper is where the playground chooses mock vs live and supplies the
 * local gateway defaults.
 */
type GenUIEnv = Record<string, string | undefined>

/**
 * Is the deterministic mock explicitly requested? The mock is opt-in only:
 * `GENAI_MOCK=1` (or the legacy `GENAI_LIVE=0`) turns it on, and it wins over a
 * configured live endpoint so the demo stays reproducible.
 */
export function resolveGenUIMock(env: GenUIEnv = process.env): boolean {
  return env.GENAI_MOCK === '1' || env.GENAI_LIVE === '0'
}

/**
 * Resolve live options from the playground's env convention. Live activates
 * automatically when a key is present (GENAI_API_KEY, or THESYS_API_KEY as
 * fallback) against the local default gateway; `GENAI_MOCK=1` (or
 * `GENAI_LIVE=0`) forces the deterministic mock even with a key present.
 */
export function resolveGenUILive(env: GenUIEnv = process.env): GenUILiveOptions | undefined {
  if (resolveGenUIMock(env)) return undefined
  const apiKey = env.GENAI_API_KEY ?? env.THESYS_API_KEY
  if (!apiKey) return undefined
  return {
    apiKey,
    baseURL: env.GENAI_BASE_URL ?? 'http://127.0.0.1:8317/v1',
    model: env.GENAI_MODEL ?? 'gemini-3.5-flash-lite'
  }
}
