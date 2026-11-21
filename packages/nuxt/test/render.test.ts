// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

const DEMO = [
  'root = Card("Q3 Overview", [stat, note])',
  'stat = StatsCard("Total Revenue", "$128,430", "+12.5%", "up")',
  'note = TextContent("Q3 looks healthy.")'
].join('\n')

const ACTIONS_DEMO = [
  'root = Card("Actions", [buttons])',
  'buttons = Buttons([b1, b2])',
  'b1 = Button("Approve")',
  'b2 = Button("Docs", { type: "open_url", url: "https://example.com" })'
].join('\n')

describe('<NuxtGenUI> full pipeline', () => {
  const library = createNuxtUILibrary({ renderers: { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } })
  it('renders a deterministic demo program through vue-lang into SFCs', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library, response: DEMO, isStreaming: false } } as never) as never as { container: { innerHTML: string } }
    const html = container.innerHTML
    expect(html).toContain('Total Revenue')
    expect(html).toContain('$128,430')
  })
  it('mounts Button and Buttons through the Renderer and fires onAction on click', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library, response: ACTIONS_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) } } as never) as never as { container: HTMLElement }
    const html = container.innerHTML
    expect(html).toContain('Approve')
    expect(html).toContain('Docs')
    const buttons = [...container.querySelectorAll('button')]
    const approve = buttons.find((b) => b.textContent?.includes('Approve'))
    expect(approve).toBeTruthy()
    await fireEvent.click(approve!)
    expect(actions.length).toBe(1)
    expect(JSON.stringify(actions[0])).toContain('continue_conversation')
  })
})
