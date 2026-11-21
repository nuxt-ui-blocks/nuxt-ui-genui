// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { createApp, defineComponent, h, reactive, ref } from 'vue'
import { renderSuspended, mountSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import UInputNumber from '@nuxt/ui/components/InputNumber.vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import { provideGenUIUploader } from '@nuxt-ui-genui/components/upload'
import { GENUI_FORM_KEY } from '@nuxt-ui-genui/components/form-context'
import { Card, Form, Input, InputNumber, Checkbox, FileUpload, Button, InputDate, InputTime, Switch, InputRating, Slider, PinInput, SelectMenu, InputTags, ColorPicker } from '@nuxt-ui-genui/components/sfc'

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

const FORM_DEMO = [
  'root = Card("Launch approval", [form])',
  'form = Form("launch-approval", "Launch readiness", "Approve launch", [field])',
  'field = Input("email", "Approver email")'
].join('\n')

const REQUIRED_CHECKBOX_DEMO = [
  'root = Card("Sign-off", [form])',
  'form = Form("signoff", "Sign-off", "Confirm", [ack])',
  'ack = Checkbox("ack", "I confirm", false, { required: true })'
].join('\n')

const NUMBER_DEMO = [
  'root = Card("Budget", [form])',
  'form = Form("budget", "Budget", "Send", [amount])',
  'amount = InputNumber("amount", "Amount", null, 5)'
].join('\n')

const UPLOAD_DEMO = [
  'root = Card("Evidence", [form])',
  'form = Form("evidence", "Evidence", "Save", [files])',
  'files = FileUpload("attachments", "Attachments")'
].join('\n')

const REQUIRED_INPUT_DEMO = [
  'root = Card("Contact", [form])',
  'form = Form("contact", "Contact", "Send", [email])',
  'email = Input("email", "Approver email", null, null, { required: true, email: true })'
].join('\n')

const ORPHAN_FIELD_DEMO = 'root = Input("email", "Approver email")'

const RENAME_DEMO_A = [
  'root = Card("Contact", [form])',
  'form = Form("contact", "Contact", "Send", [field])',
  'field = Input("email", "Approver email")'
].join('\n')

const RENAME_DEMO_B = [
  'root = Card("Contact", [form])',
  'form = Form("contact", "Contact", "Send", [field])',
  'field = Input("phone", "Phone")'
].join('\n')

const STALE_FIELD_DEMO_A = [
  'root = Card("Contact", [form])',
  'form = Form("contact", "Contact", "Send", [email])',
  'email = Input("email", "Approver email")'
].join('\n')

const STALE_FIELD_DEMO_B = [
  'root = Card("Contact", [form])',
  'form = Form("contact-v2", "Contact", "Send", [phone])',
  'phone = Input("phone", "Phone")'
].join('\n')

describe('<NuxtGenUI> forms', () => {
  const library = createNuxtUILibrary({ renderers: { Card, Form, Input, InputNumber, Checkbox, FileUpload, Button, InputDate, InputTime, Switch, InputRating, Slider, PinInput, SelectMenu, InputTags, ColorPicker } })

  it('collects field values and emits submit_form to the host on submit', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: FORM_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const input = container.querySelector('input')
    expect(input).toBeTruthy()
    await fireEvent.update(input!, 'ops@example.com')

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Approve launch'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(1)
    const payload = JSON.stringify(actions[0])
    expect(payload).toContain('submit_form')
    expect(payload).toContain('launch-approval')
    expect(payload).toContain('ops@example.com')
    // The event carries the form identity so the host can scope the submission.
    expect((actions[0] as { formName?: string }).formName).toBe('launch-approval')
  })

  it('blocks submission when a required checkbox is unchecked', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: REQUIRED_CHECKBOX_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Confirm'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(0)
    expect(container.textContent).toContain('Required')
  })

  it('does not remount the field while typing after an invalid submit', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: REQUIRED_INPUT_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const input = container.querySelector('input') as HTMLInputElement
    expect(input).toBeTruthy()
    input.focus()
    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Send'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()
    expect(container.textContent).toContain('Required')

    const typingNode = container.querySelector('input') as HTMLInputElement
    await fireEvent.update(typingNode, 'ops@example.com')
    await flushAsync()
    // The DOM element must survive typing and keep focus; a store-write render
    // per keystroke remounts the subtree and drops focus.
    expect(container.querySelector('input')).toBe(typingNode)
    expect(document.activeElement).toBe(typingNode)
    expect(container.textContent).not.toContain('Required')
  })

  it('stores undefined instead of 0 when a number field is cleared', async () => {
    const actions: unknown[] = []
    const wrapper = await mountSuspended(NuxtGenUI as never, {
      props: { library, response: NUMBER_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as {
      findComponent: (c: unknown) => { vm: { $emit: (e: string, v: unknown) => void } }
      find: (s: string) => { trigger: (e: string) => Promise<void> }
    }

    // Nuxt UI's number input emits null when the field is emptied.
    wrapper.findComponent(UInputNumber).vm.$emit('update:modelValue', null)
    await flushAsync()

    await wrapper.find('form').trigger('submit')
    await flushAsync()

    expect(actions.length).toBe(1)
    const values = (actions[0] as { params?: { values?: Record<string, unknown> } }).params?.values
    expect(values?.amount).toBeUndefined()
    expect(JSON.stringify(actions[0])).not.toContain('"amount":0')
  })

  it('disables the file control when the host provides no uploader', async () => {
    const fetchSpy = vi.fn()
    const originalFetch = globalThis.fetch
    globalThis.fetch = fetchSpy as never
    try {
      const actions: unknown[] = []
      const { container } = await renderSuspended(NuxtGenUI as never, {
        props: { library, response: UPLOAD_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
      } as never) as never as { container: HTMLElement }

      const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null
      expect(fileInput).toBeTruthy()
      expect(fileInput!.disabled).toBe(true)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it('uploads through the host-provided uploader and stores only the metadata refs', async () => {
    const upload = vi.fn(async (files: File[]) => files.map((file) => ({ id: 'ref-1', name: file.name, size: file.size })))
    const actions: unknown[] = []

    const Host = defineComponent({
      setup() {
        provideGenUIUploader({ upload })
        return () => h(NuxtGenUI as never, {
          library,
          response: UPLOAD_DEMO,
          isStreaming: false,
          onAction: (e: unknown) => actions.push(e)
        })
      }
    })

    const { container } = await renderSuspended(Host as never) as never as { container: HTMLElement }
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement | null
    expect(fileInput).toBeTruthy()
    expect(fileInput!.disabled).toBe(false)

    const file = new File(['TOP-SECRET-BYTES'], 'evidence.txt', { type: 'text/plain' })
    await fireEvent.change(fileInput!, { target: { files: [file] } })
    await flushAsync()

    expect(upload).toHaveBeenCalledTimes(1)
    expect(upload.mock.calls[0]![0]![0]!.name).toBe('evidence.txt')

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Save'))
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(1)
    const values = (actions[0] as { params?: { values?: Record<string, unknown> } }).params?.values
    // Only the metadata ref travels with the submission - never the file content.
    expect(values?.attachments).toEqual([{ id: 'ref-1', name: 'evidence.txt', size: file.size }])
    expect(JSON.stringify(actions[0])).not.toContain('TOP-SECRET-BYTES')
  })

  it('clears the error once the value becomes valid', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: REQUIRED_INPUT_DEMO, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Send'))
    await fireEvent.click(submit!)
    await flushAsync()

    expect(container.querySelectorAll('.text-error').length).toBe(1)
    expect(container.textContent).toContain('Required')
    expect(actions.length).toBe(0)

    const input = container.querySelector('input')
    await fireEvent.update(input!, 'ops@example.com')
    await flushAsync()

    // The visible error is gone as soon as the value is valid - typing must not
    // raise new errors, but a shown error may not linger.
    expect(container.querySelectorAll('.text-error').length).toBe(0)
  })

  it('renders a field outside a form as inert', async () => {
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: ORPHAN_FIELD_DEMO, isStreaming: false, onAction: () => {} }
    } as never) as never as { container: HTMLElement }

    const input = container.querySelector('input') as HTMLInputElement | null
    expect(input).toBeTruthy()
    expect(input!.disabled).toBe(true)
    expect(container.textContent).toContain('Not in a form')
  })

  it('re-registers a field when the renderer renames it', async () => {
    const ctx = reactive({
      values: {} as Record<string, unknown>,
      errors: {} as Record<string, string>,
      setField(name: string, value: unknown) {
        ctx.values[name] = value
      },
      register: vi.fn(),
      unregister: vi.fn(),
      revalidate: vi.fn()
    })

    const name = ref('email')
    const Host = defineComponent({
      setup() {
        return () => h(Input as never, { props: { name: name.value, label: 'Contact' } })
      }
    })
    const app = createApp(Host)
    app.provide(GENUI_FORM_KEY, ctx as never)
    app.mount(document.createElement('div'))
    await flushAsync()

    expect(ctx.register).toHaveBeenCalledWith('email', undefined)

    name.value = 'phone'
    await flushAsync()

    // The stale name is dropped from the form, the new one is registered.
    expect(ctx.unregister).toHaveBeenCalledWith('email')
    expect(ctx.register).toHaveBeenLastCalledWith('phone', undefined)
    app.unmount()
  })

  it('never submits a field name that the renderer replaced', async () => {
    const actions: unknown[] = []
    const response = ref(RENAME_DEMO_A)
    const Host = defineComponent({
      setup() {
        return () => h(NuxtGenUI as never, {
          library,
          response: response.value,
          isStreaming: false,
          onAction: (e: unknown) => actions.push(e)
        })
      }
    })

    const { container } = await renderSuspended(Host as never) as never as { container: HTMLElement }
    const input = container.querySelector('input')
    expect(input).toBeTruthy()
    await fireEvent.update(input!, 'ops@example.com')

    // The same field is renamed while the program is patched.
    response.value = RENAME_DEMO_B
    await flushAsync()
    await flushAsync()

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Send'))
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(1)
    const values = (actions[0] as { params?: { values?: Record<string, unknown> } }).params?.values ?? {}
    expect(Object.keys(values)).not.toContain('email')
  })

  it('does not submit a value of a field that is no longer part of the form', async () => {
    const actions: unknown[] = []
    const response = ref(STALE_FIELD_DEMO_A)
    const Host = defineComponent({
      setup() {
        return () => h(NuxtGenUI as never, {
          library,
          response: response.value,
          isStreaming: false,
          onAction: (e: unknown) => actions.push(e)
        })
      }
    })

    const { container } = await renderSuspended(Host as never) as never as { container: HTMLElement }
    const input = container.querySelector('input')
    expect(input).toBeTruthy()
    await fireEvent.update(input!, 'ops@example.com')

    // The form instance is reused for another program: the email field is gone
    // and the form has a new id.
    response.value = STALE_FIELD_DEMO_B
    await flushAsync()
    await flushAsync()

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Send'))
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(1)
    const values = (actions[0] as { params?: { values?: Record<string, unknown> } }).params?.values ?? {}
    expect(Object.keys(values)).not.toContain('email')
    expect(JSON.stringify(actions[0])).not.toContain('ops@example.com')
  })

  it('blocks submission and surfaces Required on every rule-wired field when required and empty', async () => {
    const actions: unknown[] = []
    const demo = [
      'root = Card("Appointment", [form])',
      'form = Form("doctor", "Appointment", "Submit", [date, time, pin, tags, agree])',
      'date = InputDate("preferred_date", "Preferred date", null, null, null, { required: true })',
      'time = InputTime("preferred_time", "Preferred time", null, { required: true })',
      'pin = PinInput("followup_pin", "Follow-up code", null, null, null, { required: true })',
      'tags = InputTags("symptoms", "Symptoms", null, null, null, { required: true })',
      'agree = Switch("agree", "I agree to share records", false, { required: true })'
    ].join('\n')
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library, response: demo, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Submit'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()

    expect(actions.length).toBe(0)
    const errors = [...container.querySelectorAll('.text-error, [data-slot="error"]')].map((e) => e.textContent ?? '')
    const requiredErrors = errors.filter((t) => t.includes('Required'))
    expect(requiredErrors.length).toBeGreaterThanOrEqual(5)
  })
})
