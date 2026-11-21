// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { Card, TextContent, Form, InputDate, InputTime, FileUpload, CheckboxGroup } from '@nuxt-ui-genui/components/sfc'
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

const PROGRAM = [
  'root = Card("Dates", [note, form])',
  'note = TextContent("Pick a date and time.")',
  'form = Form("dates", "Schedule", "Save", [date, time, upload, channels])',
  'date = InputDate("launch_date", "Launch date", "2026-11-11", "2026-12-31", "2026-11-25")',
  'time = InputTime("check_time", "Check time", "09:30")',
  'upload = FileUpload("attachments", "Evidence")',
  'channels = CheckboxGroup("channels", "Alert channels", ["pagerduty", "slack", "email"], ["slack"])'
].join('\n')

describe('<NuxtGenUI> date/time/file fields', () => {
  const library = createNuxtUILibrary({ renderers: { Card, TextContent, Form, InputDate, InputTime, FileUpload, CheckboxGroup } })

  it('renders the fields and submits ISO date + HH:mm values', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: PROGRAM, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }
    expect(container.textContent).toContain('Launch date')
    expect(container.textContent).toContain('Check time')
    expect(container.textContent).toContain('Attach file')
    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Save'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()
    const payload = JSON.stringify(actions)
    expect(payload).toContain('submit_form')
    expect(payload).toContain('2026-11-25')
    expect(payload).toContain('09:30')
    expect(payload).toContain('slack')
  })
})
