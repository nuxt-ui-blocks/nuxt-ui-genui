// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { createGenUI, GenUIRenderer } from '../src/runtime/plugin'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, TextContent } from '@nuxt-ui-genui/components/sfc'

const PROGRAM = [
  'root = Card("Plugin", [note])',
  'note = TextContent("Rendered by the Vue plugin.")'
].join('\n')

describe('Vue plugin (@nuxt-ui-genui/nuxt/vue-plugin)', () => {
  const library = createNuxtUILibrary({ renderers: { Card, TextContent } })

  it('registers the renderer as a global component', () => {
    const app = createApp(defineComponent({ render: () => null }))
    app.use(createGenUI())
    expect(app.component('GenUIRenderer')).toBeTruthy()
  })

  it('honours a custom component name', () => {
    const app = createApp(defineComponent({ render: () => null }))
    app.use(createGenUI({ componentName: 'GenUI' }))
    expect(app.component('GenUI')).toBeTruthy()
    expect(app.component('GenUIRenderer')).toBeUndefined()
  })

  it('renders an OpenUI program through the renderer component', async () => {
    const { container } = await renderSuspended(GenUIRenderer as never, { props: { library, response: PROGRAM, isStreaming: false } } as never) as never as { container: { innerHTML: string } }
    expect(container.innerHTML).toContain('Rendered by the Vue plugin.')
  })
})
