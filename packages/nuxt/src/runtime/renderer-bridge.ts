import { computed } from 'vue'
import type { Component } from 'vue'
import type { ActionEvent, Library, McpClientLike, OpenUIError, ParseResult } from '@openuidev/vue-lang'
import { bridgeAction } from './action-bridge'

/**
 * The props shared by the two GenUI renderer entry points: the plain-Vue
 * `GenUIRenderer` render function and the Nuxt `NuxtGenUI` SFC. Keeping the
 * bridge in one place means both forward actions and diagnostics identically.
 */
export interface RendererBridgeProps {
  response?: string | null
  isStreaming?: boolean
  library: Library
  onAction?: (event: ActionEvent) => void
  onError?: (errors: OpenUIError[]) => void
  onParseResult?: (result: ParseResult | null) => void
  onUnresolved?: (names: string[]) => void
  onOrphaned?: (names: string[]) => void
  toolProvider?: Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null
  queryLoader?: Component
  onStateUpdate?: (state: Record<string, any>) => void
  initialState?: Record<string, any>
}

/**
 * OpenUI Lang has no `undefined` literal: the model uses the bareword
 * `undefined` to mean "omit this optional positional argument" and the parser
 * treats it as an identifier reference, producing a bogus unresolved entry.
 * Filter it out of the diagnostic lists (its value is null either way) so dev
 * tooling is not drowned in noise. Real broken references are unaffected.
 */
export function cleanDiagnosticNames(names: string[] | undefined): string[] {
  return (names ?? []).filter((n) => n !== 'undefined' && n !== 'null')
}

/**
 * Shared renderer wiring. Takes a getter so the stable handlers always read the
 * current props, and exposes `rendererProps` as a computed object for hosts
 * that render `<Renderer>` through a render function.
 */
export function useRendererBridge<T extends RendererBridgeProps>(getProps: () => T) {
  function handleError(errors: OpenUIError[]) {
    getProps().onError?.(errors)
  }

  function handleParseResult(result: ParseResult | null) {
    getProps().onUnresolved?.(cleanDiagnosticNames(result?.meta?.unresolved))
    getProps().onOrphaned?.(cleanDiagnosticNames(result?.meta?.orphaned))
    getProps().onParseResult?.(result)
  }

  function handleAction(event: ActionEvent) {
    // Bridge OpenUrl https-only new-tab before the host's onAction.
    bridgeAction(event, getProps().onAction)
  }

  const rendererProps = computed(() => ({
    response: getProps().response ?? null,
    library: getProps().library,
    isStreaming: getProps().isStreaming,
    onAction: handleAction,
    onError: handleError,
    onParseResult: handleParseResult,
    toolProvider: getProps().toolProvider ?? null,
    queryLoader: getProps().queryLoader,
    onStateUpdate: (state: Record<string, any>) => getProps().onStateUpdate?.(state),
    initialState: getProps().initialState
  }))

  return { handleError, handleParseResult, handleAction, rendererProps }
}
