import { GenUIProviderConfigError, resolveGenUIProvider } from '../utils/provider'

/** Client-visible provider badge state. Never exposes the API key. */
export default defineEventHandler(() => {
  try {
    const config = resolveGenUIProvider(process.env)
    return { provider: config.provider, live: Boolean(config.live), mock: config.mock, model: config.live?.model }
  } catch (error) {
    if (error instanceof GenUIProviderConfigError) {
      return { provider: 'mock', live: false, mock: false }
    }
    throw error
  }
})
