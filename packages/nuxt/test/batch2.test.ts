// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Form, Slider, StatsCard, AvatarGroup, CommandPalette, DataTable, Button } from '@nuxt-ui-genui/components/sfc'
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

const library = createNuxtUILibrary({
  renderers: { Card, Form, Slider, StatsCard, AvatarGroup, CommandPalette, DataTable, Button }
})

async function render(response: string, onAction: (e: unknown) => void = () => {}) {
  const { container } = await renderSuspended(NuxtGenUI as never, {
    props: { library, response, isStreaming: false, onAction }
  } as never) as never as { container: HTMLElement }
  return container
}

describe('batch-2 component regressions', () => {
  it('seeds the displayed slider value into the form value', async () => {
    const actions: unknown[] = []
    const container = await render([
      'root = Card("Tune", [form])',
      'form = Form("tune", "Tune", "Save", [slider])',
      'slider = Slider("volume", "Volume", 10, 100, 5)'
    ].join('\n'), (e) => actions.push(e))

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Save'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(1)
    const params = (actions[0] as { params: { values: Record<string, unknown> } }).params
    expect(params.values.volume).toBe(10)
  })

  it('renders a flat trend without the success colour', async () => {
    const badgeClass = async (trend: string) => {
      const container = await render(`root = Card("KPI", [stat])\nstat = StatsCard("Churn", "1.6%", "down from 2.2%", "${trend}")`)
      const badge = [...container.querySelectorAll('*')].find((el) => el.textContent?.trim() === 'down from 2.2%')
      return badge?.className ?? ''
    }
    const up = await badgeClass('up')
    const down = await badgeClass('down')
    const flat = await badgeClass('flat')
    expect(up).toContain('success')
    expect(down).toContain('error')
    expect(flat).not.toContain('success')
    expect(flat).not.toContain('error')
    expect(flat).not.toBe(up)
  })

  it('reports the real overflow count in the avatar group', async () => {
    const avatars = Array.from({ length: 10 }, (_, i) => `{ text: "P${i}" }`).join(', ')
    const container = await render(`root = Card("Team", [group])\ngroup = AvatarGroup([${avatars}], 3)`)
    expect(container.textContent).toContain('+7')
  })

  it('renders the command palette item icon', async () => {
    const container = await render('root = Card("Commands", [palette])\npalette = CommandPalette([{ label: "Docs", icon: "i-lucide-search" }])')
    const trigger = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Commands'))
    expect(trigger).toBeTruthy()
    await fireEvent.click(trigger!)
    await flushAsync()
    expect(document.body.querySelector('[data-slot="itemLeadingIcon"]')).toBeTruthy()
  })

  it('applies the column alignment to both the header and the cell', async () => {
    const container = await render([
      'root = Card("Vendors", [table])',
      'table = DataTable([{ key: "vendor", label: "Vendor", align: "right" }], [["Acme"]])'
    ].join('\n'))
    const th = container.querySelector('th')
    const td = container.querySelector('td')
    expect(th?.className).toContain('text-right')
    expect(td?.className).toContain('text-right')
  })
})
