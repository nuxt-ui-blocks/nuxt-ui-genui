import { describe, expect, it, vi } from 'vitest'
import {
  AdapterConfigError,
  ChatRequestSchema,
  generateUi,
  validateUi
} from '../server/utils/genuiAdapter'

const VALID_UI = 'root = SalesDashboard("Revenue overview", "Monthly snapshot", [{"label":"Revenue","value":"$24,500","change":"+12.5%","trend":"up"}], [{"id":"#1024","customer":"Ada Lovelace","total":"$240.00","status":"Completed"}])'

describe('validateUi', () => {
  it('accepts a valid bare Lang line', () => {
    const result = validateUi(VALID_UI)
    expect(result).toEqual({ ok: true, ui: VALID_UI })
  })

  it('accepts the same line wrapped in one code fence', () => {
    const fenced = '```lang\n' + VALID_UI + '\n```'
    const result = validateUi(fenced)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.ui).toBe(VALID_UI)
  })

  it('rejects non-Lang output with issues', () => {
    const result = validateUi('Here is your dashboard!')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.length).toBeGreaterThan(0)
  })

  it('rejects the wrong number of positional arguments', () => {
    const result = validateUi('root = SalesDashboard("Only title")')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0]).toMatch(/4 positional arguments/)
  })

  it('rejects invalid schema payloads', () => {
    const bad = 'root = SalesDashboard("Title", "Desc", [{"label":"M","value":"1","trend":"sideways"}], [])'
    const result = validateUi(bad)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues.join(' ')).toMatch(/trend|Invalid/i)
  })
})

describe('ChatRequestSchema', () => {
  it('accepts a minimal valid request', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [{ role: 'user', content: 'hi' }] })
    expect(parsed.success).toBe(true)
  })

  it('rejects an empty message list', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [] })
    expect(parsed.success).toBe(false)
  })

  it('rejects unknown roles', () => {
    const parsed = ChatRequestSchema.safeParse({ messages: [{ role: 'tool', content: 'x' }] })
    expect(parsed.success).toBe(false)
  })
})

describe('generateUi', () => {
  it('throws AdapterConfigError when env is missing', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    vi.stubEnv('OPENAI_MODEL', '')
    await expect(
      generateUi({ messages: [{ role: 'user', content: 'dash' }] })
    ).rejects.toBeInstanceOf(AdapterConfigError)
    vi.unstubAllEnvs()
  })

  it('returns validated ui when the model output is valid', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_MODEL', 'gpt-test')
    const mockModel = async () => ({ text: VALID_UI })
    const result = await generateUi(
      { messages: [{ role: 'user', content: 'dashboard' }] },
      mockModel
    )
    expect(result).toEqual({
      ok: true,
      ui: VALID_UI,
      meta: { mode: 'chat', model: 'gpt-test', validated: true }
    })
    vi.unstubAllEnvs()
  })
})
