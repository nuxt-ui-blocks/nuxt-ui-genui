// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { renderSuspended } from '@nuxt/test-utils/runtime'
import { fireEvent } from '@testing-library/vue'
import NuxtGenUI from '../src/runtime/NuxtGenUI.vue'
import { createNuxtUILibrary } from '@nuxt-ui-genui/components'
import {
  Card, Form, SelectMenu, PinInput, InputTags, ColorPicker,
  User, Pagination, NavigationMenu, Tree, Popover, DropdownMenu, ContextMenu, Drawer
} from '@nuxt-ui-genui/components/sfc'
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0))

const LIB = createNuxtUILibrary({
  renderers: {
    Card, Form, SelectMenu, PinInput, InputTags, ColorPicker,
    User, Pagination, NavigationMenu, Tree, Popover, DropdownMenu, ContextMenu, Drawer
  }
})

const PROGRAM = [
  'root = Card("Wave2", [user, nav, tree, pagination, popover, dropdown, ctx, drawer, form])',
  'user = User("Ana Silva", "SRE Lead", { src: "https://example.com/a.png", text: "AS" })',
  'nav = NavigationMenu([{ label: "Docs", url: "https://docs.example.com" }, { label: "Internal", url: "http://internal.local" }])',
  'tree = Tree([{ label: "Sev1", children: [{ label: "Mitigated" }, { label: "Monitoring" }] }])',
  'pagination = Pagination(100, 10, 2)',
  'popover = Popover("Rollback", "Show plan", "Rollback to **v2.13.0**.")',
  'dropdown = DropdownMenu("Actions", [{ label: "Runbook", url: "https://example.com/rb" }, { label: "Ask", message: "Summarize INC-2041" }])',
  'ctx = ContextMenu([{ label: "Copy id" }])',
  'drawer = Drawer("Approval", "Review", "Rollback rehearsed.", true)',
  'form = Form("wave2", "Inputs", "Save", [pin, tags, color, menu])',
  'pin = PinInput("otp", "OTP", 4, true, "4242")',
  'tags = InputTags("services", "Services", "Add service", 5, ["api", "web"])',
  'color = ColorPicker("brand", "Brand color", "#22c55e")',
  'menu = SelectMenu("env", "Environment", "Pick one", ["staging", "production"], "production")'
].join('\n')

describe('<NuxtGenUI> full-parity wave 2', () => {
  it('renders user/nav/tree/pagination; https-only links; popover; drawer; form submit_form round trip', async () => {
    const actions: unknown[] = []
    const { container } = await renderSuspended(NuxtGenUI as never, {
      props: { library: LIB, response: PROGRAM, isStreaming: false, onAction: (e: unknown) => actions.push(e) }
    } as never) as never as { container: HTMLElement }

    const body = document.body.textContent ?? ''
    expect(body).toContain('Ana Silva')
    expect(body).toContain('Internal')
    expect(container.querySelector('a[href="https://docs.example.com"]')).toBeTruthy()
    expect(container.querySelector('a[href="http://internal.local"]')).toBeNull()
    expect(container.textContent).toContain('Sev1')

    // Popover trigger renders then opens its markdown body on click.
    const showPlan = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Show plan'))
    expect(showPlan).toBeTruthy()
    await fireEvent.click(showPlan!)
    await flushAsync()
    expect(document.body.textContent ?? '').toContain('Rollback to')

    // Drawer defaultOpen portals its content to the body.
    expect(document.body.textContent ?? '').toContain('Rollback rehearsed.')

    // DropdownMenu trigger opens the menu; the message item dispatches continue_conversation.
    const actionsBtn = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Actions'))
    expect(actionsBtn).toBeTruthy()
    await fireEvent.click(actionsBtn!)
    await flushAsync()
    const ask = [...document.body.querySelectorAll('[role="menuitem"],button,a')].find((el) => el.textContent?.trim() === 'Ask' || el.textContent?.includes('Ask'))
    expect(ask).toBeTruthy()
    await fireEvent.click(ask!)
    await flushAsync()
    expect(JSON.stringify(actions)).toContain('continue_conversation')
    expect(JSON.stringify(actions)).toContain('Summarize INC-2041')

    // Form collects typed values and emits submit_form with the defaults.
    const submit = [...container.querySelectorAll('button')].find((b) => b.textContent?.includes('Save'))
    expect(submit).toBeTruthy()
    await fireEvent.click(submit!)
    await flushAsync()
    const payload = JSON.stringify(actions)
    expect(payload).toContain('submit_form')
    expect(payload).toContain('wave2')
    expect(payload).toContain('4242')
    expect(payload).toContain('production')
    expect(payload).toContain('#22c55e')
  })
})
