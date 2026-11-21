/** Slots forwarded from GenUIChat to UChatMessages. */
export const MESSAGE_SLOTS = [
  'default', 'indicator', 'viewport', 'header', 'leading', 'files', 'body', 'content', 'actions'
] as const

/** Only slots actually supplied by the host are declared on the child, so
 * Nuxt UI can keep its own defaults for the rest. */
export function activeSlots<T extends string>(names: readonly T[], available: Record<string, unknown>): T[] {
  return names.filter((name) => name in available)
}
