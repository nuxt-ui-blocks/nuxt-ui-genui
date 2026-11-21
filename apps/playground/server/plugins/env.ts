import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Load the app's `.env` into `process.env` at Nitro startup.
 *
 * Nuxt loads `.env` in dev, but a production build (`node .output/server/index.mjs`)
 * starts with a bare environment — which used to silently downgrade the console to
 * the deterministic demo. Existing environment variables always win, so a real
 * deployment (or `GENAI_MOCK=1`) is never overridden by the file on disk.
 */
export default defineNitroPlugin(() => {
  if (process.env.GENAI_API_KEY) return

  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), 'apps', 'playground', '.env')
  ]

  for (const path of candidates) {
    if (!existsSync(path)) continue
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      if (!key || key in process.env) continue
      let value = trimmed.slice(eq + 1).trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
    console.info(`[genui] loaded env file ${path} (GENAI_API_KEY ${process.env.GENAI_API_KEY ? 'present' : 'missing'})`)
    return
  }
})
