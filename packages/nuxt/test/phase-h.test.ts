// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { defineComponent, h } from 'vue'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import UApp from '@nuxt/ui/components/App.vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Toast, Tooltip, Calendar, DataTable } from '@nuxt-ui-genui/components/sfc'

const PROGRAM = [
  'root = Card("PhaseH", [tip, cal, table])',
  'tip = Tooltip("SLO budget", "Remaining error budget for the quarter.")',
  'cal = Calendar("Go/no-go", "2026-11-21", "2026-11-01", "2026-12-31")',
  'table = DataTable([{ key: "a", label: "A" }, { key: "b", label: "B" }], [["one", "1"], ["two", "2"]], true)'
].join('\n')

describe('<NuxtGenUI> phase H', () => {
  const library = createNuxtUILibrary({ renderers: { Card, Tooltip, Calendar, DataTable } })

  it('renders tooltip trigger, calendar, and striped data table', async () => {
    // UTooltip needs the host UApp tooltip provider, so the tree is wrapped in it.
    const host = defineComponent({
      components: { UApp },
      render() {
        return h(UApp, null, { default: () => h(NuxtGenUI as never, { library, response: PROGRAM, isStreaming: false }) })
      }
    })
    const { container } = await renderSuspended(host as never) as never as { container: HTMLElement }
    // The tooltip is a real UTooltip, so the text lives in the portalled content,
    // not in a native title attribute.
    const tip = [...container.querySelectorAll('span')].find((s) => s.textContent === 'SLO budget')
    expect(tip).toBeTruthy()
    expect(container.querySelector('[title="Remaining error budget for the quarter."]')).toBeNull()
    await fireEvent.focus(tip!)
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(document.body.textContent).toContain('Remaining error budget for the quarter.')
    expect(container.textContent).toContain('Go/no-go')
    const rowTwo = [...container.querySelectorAll('tr')].find((tr) => tr.textContent?.includes('two'))
    expect(rowTwo?.className).toContain('bg-elevated')
  })

  it('Toast inside UApp dispatches a visible toast via useToast()', async () => {
    const wrapper = defineComponent({
      components: { UApp, Toast },
      render() {
        return h(UApp, null, { default: () => h(Toast as never, { props: { label: 'Ping team', title: 'Rollout reached 82%', description: 'Canary healthy for 30m.', color: 'success' } }) })
      }
    })
    const { container } = await renderSuspended(wrapper as never) as never as { container: HTMLElement }
    const ping = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Ping team'))
    expect(ping).toBeTruthy()
    await fireEvent.click(ping!)
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect((document.body.textContent ?? '') + container.innerHTML).toContain('Rollout reached 82%')
  })
})
