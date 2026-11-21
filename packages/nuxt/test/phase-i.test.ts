// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Table, Listbox, Marquee } from '@nuxt-ui-genui/components/sfc'

const PROGRAM = [
  'root = Card("WaveI", [tbl, box, marquee])',
  'tbl = Table([{ accessorKey: "id", header: "ID" }, { accessorKey: "name", header: "Name" }], [{ id: "T-1", name: "Falcon" }, { id: "T-2", name: "Horizon" }], true)',
  'box = Listbox("Severity", ["Sev1", "Sev2", "Sev3"])',
  'marquee = Marquee("Deploy freeze ends Nov 25", false, true, 3)'
].join('\n')

describe('<NuxtGenUI> Table/Listbox/Marquee', () => {
  const library = createNuxtUILibrary({ renderers: { Card, Table, Listbox, Marquee } })

  it('renders table rows, listbox items, and the marquee text', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library, response: PROGRAM, isStreaming: false } } as never) as never as { container: HTMLElement }
    expect(container.textContent).toContain('T-1')
    expect(container.textContent).toContain('Falcon')
    expect(container.textContent).toContain('Sev2')
    expect(container.textContent).toContain('Deploy freeze ends Nov 25')
  })
})
