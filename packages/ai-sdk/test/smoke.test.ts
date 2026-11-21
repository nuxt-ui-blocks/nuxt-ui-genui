import { describe, it, expect } from 'vitest'
import { streamGenUI, streamGenUIText } from '../src/index'
import type { UIMessage } from 'ai'

const userMessage = (text: string): UIMessage => ({
  id: `m-${text}`,
  role: 'user',
  parts: [{ type: 'text', text }]
}) as never as UIMessage

describe('streamGenUI', () => {
  it('mock path streams the program into a UI-message response containing the Lang program', async () => {
    const program = 'root = Card("T", [note])\nnote = TextContent("hello mock")'
    const res = await streamGenUI({ systemPrompt: 'sys', messages: [userMessage('anything')], mockProgram: program })
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(text).toContain('hello mock')
    expect(text).toContain('Card(')
  })

  it('a missing mockProgram streams an empty response without throwing', async () => {
    const res = await streamGenUI({ systemPrompt: 'sys', messages: [userMessage('x')] })
    expect(res.status).toBe(200)
  })
})

describe('streamGenUIText', () => {
  it('mock path streams the program as plain text', async () => {
    const program = 'root = Card("T", [note])\nnote = TextContent("hello text")'
    const res = await streamGenUIText({ systemPrompt: 'sys', messages: [userMessage('anything')], mockProgram: program })
    const text = await res.text()
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/plain')
    expect(text).toContain('hello text')
    expect(text).toContain('Card(')
  })

  it('a missing mockProgram streams an empty response without throwing', async () => {
    const res = await streamGenUIText({ systemPrompt: 'sys', messages: [userMessage('x')] })
    expect(res.status).toBe(200)
  })
})

