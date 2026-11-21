// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, TextContent, Button } from '@nuxt-ui-genui/components/sfc'

const library = createNuxtUILibrary({ renderers: { Card, TextContent, Button } })

const QUERY_DEMO = [
  'health = Query("get_server_health", {}, { status: "pending", uptime: 0, latency_ms: 0, region: "eu-west-1" })',
  'root = Card("Health", [status])',
  'status = TextContent("Uptime: " + health.uptime + " days")'
].join('\n')

const ORPHAN_DEMO = [
  'orphan = TextContent("unreachable")',
  'root = Card("Uses nothing", [summary])',
  'summary = TextContent("used")'
].join('\n')

const STATE_DEMO = [
  '$count = 0',
  'root = Card("Counter", [status, inc])',
  'status = TextContent("Count: " + $count)',
  'inc = Button("Inc", Action([@Set($count, $count + 1)]))'
].join('\n')

function renderQuery(response: string, extraProps: Record<string, unknown> = {}) {
  return renderSuspended(NuxtGenUI as never, {
    props: { library, response, isStreaming: false, onAction: () => {}, ...extraProps }
  } as never) as never as Promise<{ container: HTMLElement }>
}

describe('<NuxtGenUI> Query() / tool provider wiring', () => {
  it('calls the tool provider and swaps the resolved result in', async () => {
    const getServerHealth = vi.fn(async () => ({ status: 'operational', uptime: 42, latency_ms: 120, region: 'eu-west-1' }))
    const { container } = await renderQuery(QUERY_DEMO, { toolProvider: { get_server_health: getServerHealth } })

    // Query results resolve asynchronously; poll the DOM until the resolved value renders.
    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 25))
      if (container.textContent?.includes('42')) break
    }

    expect(getServerHealth).toHaveBeenCalledTimes(1)
    expect(getServerHealth).toHaveBeenCalledWith({})
    expect(container.textContent).toContain('Uptime: 42 days')
  })

  it('surfaces dead statements in meta.orphaned and through onOrphaned', async () => {
    const onOrphaned = vi.fn()
    const onParseResult = vi.fn()
    const { container } = await renderQuery(ORPHAN_DEMO, { onOrphaned, onParseResult })

    const p = onParseResult.mock.lastCall?.[0] as { meta?: { orphaned?: string[]; unresolved?: string[] } } | null
    expect(p?.meta?.orphaned).toContain('orphan')
    expect(p?.meta?.unresolved ?? []).toEqual([])
    expect(onOrphaned).toHaveBeenCalledWith(expect.arrayContaining(['orphan']))
    expect(container.textContent).not.toContain('unreachable')
  })

  it('seeds $state from initialState and emits changes through onStateUpdate', async () => {
    const onStateUpdate = vi.fn()
    const { container } = await renderQuery(STATE_DEMO, { initialState: { $count: 42 }, onStateUpdate })

    expect(container.textContent).toContain('Count: 42')
    expect(onStateUpdate).not.toHaveBeenCalled()

    const button = [...container.querySelectorAll('button')].find(b => b.textContent?.includes('Inc'))
    expect(button).toBeTruthy()
    button!.click()

    for (let i = 0; i < 200; i++) {
      await new Promise(r => setTimeout(r, 25))
      if (container.textContent?.includes('Count: 43')) break
    }

    expect(container.textContent).toContain('Count: 43')
    expect(onStateUpdate).toHaveBeenCalled()
  })
})
