import { BuiltinActionType } from '@openuidev/lang-core'
import type { ActionEvent } from '@openuidev/vue-lang'

/**
 * Bridge an OpenUI action to the host.
 *
 * `open_url` actions are opened here (https only, `noopener,noreferrer`) so a
 * host that does not handle them itself still gets a working link. Every action
 * is forwarded to the host's `onAction` afterwards, whatever its type.
 */
export function bridgeAction(event: ActionEvent, onAction?: (event: ActionEvent) => void) {
  if (event.type === BuiltinActionType.OpenUrl && typeof window !== 'undefined') {
    const url = event.params?.url
    if (typeof url === 'string' && url.toLowerCase().startsWith('https:')) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }
  onAction?.(event)
}
