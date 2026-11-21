// @vitest-environment nuxt
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

// The built-in Button SFC forwards every action to `triggerAction` (including
// open_url), so the <NuxtGenUI> OpenUrl bridge is exercised end to end here:
// Button -> triggerAction -> ActionEvent `{ type: 'open_url', params: { url } }`
// -> the bridge opens the URL and still forwards the event to the host.
function programFor(url: string) {
  return [
    'root = Card("Probe", [b])',
    `b = Button("Docs", { type: "open_url", url: "${url}" })`
  ].join('\n')
}

async function clickDocs(response: string, onAction: (e: unknown) => void) {
  const library = createNuxtUILibrary({ renderers: { Card, StatsCard, TextContent, Button, Buttons, DataTable, Chart } })
  const { container } = await renderSuspended(NuxtGenUI as never, { props: { library, response, isStreaming: false, onAction } } as never) as never as { container: HTMLElement }
  const button = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Docs'))
  expect(button).toBeTruthy()
  await fireEvent.click(button!)
}

describe('<NuxtGenUI> OpenUrl bridge', () => {
  afterEach(() => { vi.restoreAllMocks() })

  it('opens https OpenUrl actions in a new tab and still forwards the event to onAction', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const actions: unknown[] = []
    await clickDocs(programFor('https://plan.example.com/docs'), (e) => actions.push(e))
    expect(openSpy).toHaveBeenCalledWith('https://plan.example.com/docs', '_blank', 'noopener,noreferrer')
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(actions.length).toBe(1)
    expect(JSON.stringify(actions[0])).toContain('open_url')
    expect(JSON.stringify(actions[0])).toContain('https://plan.example.com/docs')
  })

  it('accepts an uppercase HTTPS scheme (case-insensitive)', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const actions: unknown[] = []
    await clickDocs(programFor('HTTPS://PLAN.EXAMPLE.COM/DOCS'), (e) => actions.push(e))
    expect(openSpy).toHaveBeenCalledWith('HTTPS://PLAN.EXAMPLE.COM/DOCS', '_blank', 'noopener,noreferrer')
    expect(actions.length).toBe(1)
  })

  it('does NOT open non-https OpenUrl actions, but still calls onAction', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const actions: unknown[] = []
    await clickDocs(programFor('http://insecure.example.com/docs'), (e) => actions.push(e))
    expect(openSpy).not.toHaveBeenCalled()
    expect(actions.length).toBe(1)
    expect(JSON.stringify(actions[0])).toContain('open_url')
  })

  it('does NOT open non-URL / javascript: OpenUrl actions, but still calls onAction', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    const actions: unknown[] = []
    await clickDocs(programFor('javascript:alert(1)'), (e) => actions.push(e))
    expect(openSpy).not.toHaveBeenCalled()
    expect(actions.length).toBe(1)
  })
})
