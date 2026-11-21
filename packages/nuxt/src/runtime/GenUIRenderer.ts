import { defineComponent, h, type Component, type PropType } from 'vue'
import { Renderer, type ActionEvent, type Library, type McpClientLike, type OpenUIError, type ParseResult } from '@openuidev/vue-lang'
import { provideGenUIContainerChildren } from '@nuxt-ui-genui/components'
import { useRendererBridge } from './renderer-bridge'

/**
 * The renderer without any Nuxt-only wrapper.
 *
 * It is written as a render function (not an SFC) on purpose: the plugin entry
 * (`@nuxt-ui-genui/nuxt/vue-plugin`) is consumed by plain Vite apps, and a raw
 * `.vue` import from `node_modules` would need `optimizeDeps.extensions`
 * tweaks the host cannot be expected to make.
 *
 * The OpenUI Vue renderer is client-only upstream (SSR renders an empty
 * wrapper), so a plain-Vue host should render it on the client - hiding it
 * behind a mounted flag is the caller's choice; this component does not.
 */
export const GenUIRenderer = defineComponent({
  name: 'GenUIRenderer',
  props: {
    /** The OpenUI Lang program (text) to render. */
    response: { type: String as PropType<string | null>, default: null },
    /** True while the program is still streaming. */
    isStreaming: { type: Boolean, default: false },
    /** Library created from `@nuxt-ui-genui/core` (component allowlist). */
    library: { type: Object as PropType<Library>, required: true },
    /** Called for every action the program triggers. */
    onAction: { type: Function as PropType<(event: ActionEvent) => void>, default: undefined },
    /** Called with parse errors. */
    onError: { type: Function as PropType<(errors: OpenUIError[]) => void>, default: undefined },
    /** Called with the parse result. */
    onParseResult: { type: Function as PropType<(result: ParseResult | null) => void>, default: undefined },
    /** Called with the names of references used in the program but never defined. */
    onUnresolved: { type: Function as PropType<(names: string[]) => void>, default: undefined },
    /** Called with the names of value statements the model defined but never used. */
    onOrphaned: { type: Function as PropType<(names: string[]) => void>, default: undefined },
    /** Resolve `Query()`/`Mutation()` tool calls in the program (host-supplied). */
    toolProvider: { type: [Object, Function] as unknown as PropType<Record<string, (args: Record<string, unknown>) => Promise<unknown>> | McpClientLike | null>, default: undefined },
    /** Vue component rendered in place while a Query() is resolving. */
    queryLoader: { type: [Object, Function] as unknown as PropType<Component>, default: undefined },
    /** Called with the renderer's $state snapshot on every change. */
    onStateUpdate: { type: Function as PropType<(state: Record<string, any>) => void>, default: undefined },
    /** Seed value for the renderer's $state. */
    initialState: { type: Object as PropType<Record<string, any>>, default: undefined },
    /**
     * Extra component names Card may render. Defaults to the built-in
     * `CARD_CHILD_NAMES`; pass the list you registered through
     * `createNuxtUILibrary({ extraCardChildren })` so the runtime filter matches
     * the library the model was given.
     */
    cardChildren: { type: Array as PropType<readonly string[]>, default: undefined }
  },
  setup(props) {
    if (props.cardChildren?.length) {
      provideGenUIContainerChildren({ Card: props.cardChildren })
    }
    const { rendererProps } = useRendererBridge(() => props)
    return () => h(Renderer, rendererProps.value)
  }
})

export default GenUIRenderer
