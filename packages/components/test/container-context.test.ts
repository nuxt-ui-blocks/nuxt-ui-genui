import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideGenUIContainerChildren, useGenUIContainerChildren } from '../src/container-context'

const Probe = defineComponent({
  setup() {
    const names = useGenUIContainerChildren('Card', ['Fallback'])
    return () => h('span', names.join(','))
  }
})

describe('container children context', () => {
  it('falls back when the host provides nothing', async () => {
    expect(await renderToString(createSSRApp(Probe))).toContain('Fallback')
  })

  it('reads the provided allowlist for the container', async () => {
    const App = defineComponent({
      setup() {
        provideGenUIContainerChildren({ Card: ['TextContent', 'WeatherCard'] })
        return () => h(Probe)
      }
    })
    expect(await renderToString(createSSRApp(App))).toContain('TextContent,WeatherCard')
  })
})
