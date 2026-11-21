// @vitest-environment node
// SSR spike: does @openuidev/vue-lang's <Renderer> render under renderToString?
// Test 1 probes the renderer with Nuxt UI SFCs (the production path).
// Test 2 probes the renderer with a dependency-free probe component (isolates vue-lang from Nuxt UI).
import { describe, it, expect } from 'vitest'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, h, defineComponent } from 'vue'
import { Renderer } from '@openuidev/vue-lang'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, StatsCard, TextContent, Button } from '@nuxt-ui-genui/components/sfc'

const DEMO = [
  'root = Card("SSR Probe", [stat, note])',
  'stat = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")',
  'note = TextContent("Rendered on the server.")'
].join('\n')

const LIB = createNuxtUILibrary({ renderers: { Card, StatsCard, TextContent, Button } })

describe('SSR spike — @openuidev/vue-lang Renderer', () => {
  it('Nuxt UI path: fails to emit markup under a plain SSR context (documents the ssr:false boundary)', async () => {
    const app = createSSRApp(defineComponent({
      render: () => h(Renderer as never, { response: DEMO, library: LIB, isStreaming: false } as never)
    }))
    const html = await renderToString(app)
    console.log('[ssr-probe] nuxt-ui path html bytes:', html.length)
    expect(html).not.toContain('Total Revenue') // SFCs need the Nuxt runtime; empty output today
  })

  it('Isolated path: renderer does not mount content server-side either (upstream boundary: vue-lang 0.4.x hydration-mounts only)', async () => {
    const ProbeSfc = defineComponent({
      name: 'Card',
      props: ['props'],
      render() {
        return h('div', 'SSR-CONTENT-PROBE')
      }
    })
    const probeLib = createNuxtUILibrary({ renderers: { Card: ProbeSfc } as never })
    const app = createSSRApp(defineComponent({
      render: () => h(Renderer as never, { response: 'root = Card("probe")', library: probeLib, isStreaming: false } as never)
    }))
    const html = await renderToString(app)
    console.log('[ssr-probe] isolated html bytes:', html.length, '| contains marker:', html.includes('SSR-CONTENT-PROBE'))
    // Verified 2026-11-11: vue-lang 0.4.x emits an empty wrapper under renderToString (no hydration host).
    expect(html).not.toContain('SSR-CONTENT-PROBE')
  })
})
