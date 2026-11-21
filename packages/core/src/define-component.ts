import { defineComponent } from '@openuidev/lang-core'
import type { $ZodObject } from 'zod/v4/core'
import { GenUILibraryError } from './errors'

/** Placeholder renderer for server-side spec generation. Safe: renders nothing. */
export const placeholderRenderer = () => null

function assertV4(props: unknown): asserts props is $ZodObject {
  const p = props as { _zod?: { def?: { type?: string } } } | null
  if (!p || typeof p !== 'object' || !p._zod || !p._zod.def || p._zod.def.type !== 'object') {
    throw new GenUILibraryError(
      'NOT_V4_SCHEMA',
      'GenUI components must be defined with an object schema imported from "zod/v4" (got a non-object or non-v4 schema).'
    )
  }
}

export interface GenUIComponentConfig<P extends $ZodObject> {
  name: string
  props: P
  description: string
  /**
   * Client-only renderer. Core never imports Vue, so this stays `unknown` here;
   * it is typed as a Vue component at the `@nuxt-ui-genui/components` seam.
   * Omit for server-side spec generation.
   */
  component?: unknown
}

export function defineGenUIComponent<P extends $ZodObject>(config: GenUIComponentConfig<P>) {
  assertV4(config.props)
  return defineComponent({
    name: config.name,
    props: config.props,
    description: config.description,
    component: (config.component ?? placeholderRenderer) as never
  })
}
