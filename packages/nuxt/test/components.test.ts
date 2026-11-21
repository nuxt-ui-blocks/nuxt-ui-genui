// @vitest-environment nuxt
import { describe, expect, it } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h } from 'vue'
import UApp from '@nuxt/ui/components/App.vue'
import { Alert, Badge, Progress, StatsCard, TextContent, DataTable, Chart } from '@nuxt-ui-genui/components/sfc'

async function renderHtml(component: never, props: unknown): Promise<string> {
  const { container } = await renderSuspended(component, { props } as never) as never as { container: { innerHTML: string } }
  return container.innerHTML
}

// UChart renders @nuxt/ui <UTooltip> internally, which requires the app-level TooltipProvider (normally from <UApp>).
// Wrap the Chart in <UApp> to mirror real app usage.
async function renderChartHtml(props: Record<string, unknown>): Promise<string> {
  const Probe = defineComponent({
    render() { return h(UApp as never, () => h(Chart as never, { props })) }
  })
  const { container } = await renderSuspended(Probe as never, { props: {} } as never) as never as { container: { innerHTML: string } }
  return container.innerHTML
}

describe('built-in component render contract', () => {
  it('StatsCard renders label, value, and delta', async () => {
    const html = await renderHtml(StatsCard as never, { props: { label: 'Revenue', value: '$128,430', delta: '+12.5%', trend: 'up' } })
    expect(html).toContain('Revenue')
    expect(html).toContain('$128,430')
    expect(html).toContain('+12.5%')
  })
  it('TextContent renders sanitized markdown', async () => {
    const html = await renderHtml(TextContent as never, { props: { text: '**Bold**<script>window.__x = 1</script>' } })
    expect(html).toContain('<strong>')
    expect(html).not.toContain('<script')
  })
  it('Alert renders title and description', async () => {
    const html = await renderHtml(Alert as never, { props: { title: 'Heads up', description: 'Something happened', color: 'warning' } })
    expect(html).toContain('Heads up')
    expect(html).toContain('Something happened')
  })
  it('Badge renders its label', async () => {
    const html = await renderHtml(Badge as never, { props: { label: 'Stable', color: 'success' } })
    expect(html).toContain('Stable')
  })
  it('Progress renders its label', async () => {
    const html = await renderHtml(Progress as never, { props: { value: 64, label: 'Storage' } })
    expect(html).toContain('Storage')
  })
  it('DataTable renders the positional row matrix', async () => {
    const html = await renderHtml(DataTable as never, { props: { columns: [{ key: 'id', label: 'ID' }, { key: 'customer', label: 'Customer' }], rows: [['#1024', 'Ana Silva']] } })
    expect(html).toContain('#1024')
    expect(html).toContain('Ana Silva')
  })
  it('Chart renders only once labels and series are aligned', async () => {
    const incomplete = await renderChartHtml({ title: 'Monthly Revenue', type: 'bar' })
    expect(incomplete).not.toContain('Monthly Revenue')
    const ready = await renderChartHtml({ title: 'Monthly Revenue', type: 'bar', labels: ['Jun', 'Jul'], series: [{ name: 'Revenue', data: [18, 22] }] })
    expect(ready).toContain('Monthly Revenue')
  })
})
