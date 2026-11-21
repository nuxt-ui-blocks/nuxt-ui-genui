// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import GenUIProbe from './fixtures/basic/components/GenUIProbe.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

const DEMO = [
  'root = Card("Q3 Overview", [stat, note])',
  'stat = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")',
  'note = TextContent("Q3 looks healthy.")'
].join('\n')

// Registration-path verification: <NuxtGenUI> is resolved by the fixture app's
// component registry (the module registered it via addComponent), NOT via a
// relative import of ../src/runtime/NuxtGenUI.vue.
describe('<NuxtGenUI> module registration path', () => {
  const library = createNuxtUILibrary({ renderers: { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } })
  it('resolves <NuxtGenUI> from a fixture-app template by its auto-registered name', async () => {
    const { container } = await renderSuspended(GenUIProbe as never, { props: { library, response: DEMO, isStreaming: false } } as never) as never as { container: { innerHTML: string } }
    const html = container.innerHTML
    expect(html).toContain('Total Revenue')
    expect(html).toContain('$128,430')
    expect(html).not.toContain('<nuxt-genui')
  })
})
