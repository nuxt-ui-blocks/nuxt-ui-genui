// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, Tabs, Stepper, Timeline, Breadcrumb } from '@nuxt-ui-genui/components/sfc'

const LIB = createNuxtUILibrary({ renderers: { Card, Tabs, Stepper, Timeline, Breadcrumb } })

const PROGRAM = [
  'root = Card("Stateful", [tabs, steps, timeline, crumbs])',
  'tabs = Tabs([{ label: "First", content: "alpha" }, { label: "Second", content: "bravo" }], 0)',
  'steps = Stepper([{ title: "Plan" }, { title: "Build" }], 1)',
  'timeline = Timeline([{ title: "Kickoff", date: "Nov 1" }])',
  'crumbs = Breadcrumb([{ label: "Home", url: "https://example.com" }, { label: "Ops", url: "http://evil.example" }])'
].join('\n')

describe('<NuxtGenUI> stateful components', () => {
  it('renders Tabs/Stepper/Timeline/Breadcrumb and switches tab content on click', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, { props: { library: LIB, response: PROGRAM, isStreaming: false } } as never) as never as { container: HTMLElement }
    expect(container.textContent).toContain('alpha')
    expect(container.textContent).not.toContain('bravo')
    expect(container.textContent).toContain('Plan')
    expect(container.textContent).toContain('Kickoff')
    const second = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Second'))
    expect(second).toBeTruthy()
    // reka-ui TabsTrigger activates on keydown (Enter/Space) or focus; a plain
    // click does not reach its handlers under jsdom.
    await fireEvent.keyDown(second!, { key: 'Enter' })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(container.textContent).toContain('bravo')
    const evil = container.querySelector('a[href="http://evil.example"]')
    expect(evil).toBeNull()
  })
})
