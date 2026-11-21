import { useCookie } from '#imports'

/**
 * Prompt settings mirroring the nuxt-ui-templates/chat prompt menu.
 * They live in cookies so a reload keeps the user's choice.
 */
export function useChatSettings() {
  const webSearch = useCookie<boolean>('web-search', { default: () => true })
  const reasoning = useCookie<boolean>('reasoning', { default: () => true })

  return { webSearch, reasoning }
}
