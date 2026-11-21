// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Modal, CommandPalette } from '@nuxt-ui-genui/components/sfc'
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

const PROGRAM = [
  'root = Card("Overlays", [modal, palette])',
  'modal = Modal("Details", "View details", "Nothing critical. **Safe.**", true)',
  'palette = CommandPalette([{ label: "Docs", url: "https://example.com" }, { label: "Ask", message: "Summarize the incident" }])'
].join('\n')

describe('<NuxtGenUI> overlays', () => {
  const library = createNuxtUILibrary({ renderers: { Card, Modal, CommandPalette } })

  it('renders Modal defaultOpen body and dispatches continue_conversation from CommandPalette', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: PROGRAM, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }
    // Modal content portals outside the container — check the document body.
    expect(document.body.textContent).toContain('Nothing critical.')
    // Open the palette before its items exist in the DOM.
    const trigger = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Commands'))
    expect(trigger).toBeTruthy()
    await fireEvent.click(trigger!)
    await flushAsync()
    // UPopover portals the palette into the document body; its items are reka-ui options.
    const ask = [...document.body.querySelectorAll('[role="option"]')].find((el) => el.textContent?.includes('Ask'))
    expect(ask).toBeTruthy()
    await fireEvent.click(ask!)
    expect(JSON.stringify(actions)).toContain('continue_conversation')
    expect(JSON.stringify(actions)).toContain('Summarize the incident')
  })
})
