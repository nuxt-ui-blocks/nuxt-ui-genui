import { describe, expect, it, vi } from 'vitest'
import { createGenUIStandardSchema } from '../src/form-schema'
import type { Rules } from '../src/rules'

function run(state: Record<string, unknown>, fieldNames = ['email'], rules: Map<string, Rules | undefined> = new Map([['email', { required: true, email: true }]])) {
  const schema = createGenUIStandardSchema({ fieldNames: () => fieldNames, rules })
  return schema['~standard'].validate(state)
}

describe('createGenUIStandardSchema', () => {
  it('accepts the standard schema shape', () => {
    const schema = createGenUIStandardSchema({ fieldNames: () => [], rules: new Map() })
    expect(schema['~standard'].version).toBe(1)
    expect(typeof schema['~standard'].vendor).toBe('string')
  })

  it('returns the value when all current fields are valid', () => {
    const result = run({ email: 'person@example.com' })
    expect(result).toEqual({ value: { email: 'person@example.com' } })
  })

  it('reports missing required values with a flat field path', () => {
    const result = run({ email: '' })
    expect(result).toEqual({ issues: [{ message: 'Required', path: ['email'] }] })
  })

  it('preserves the unchecked-checkbox required contract', () => {
    const rules = new Map<string, Rules | undefined>([['agree', { required: true }]])
    const result = run({ agree: false }, ['agree'], rules)
    expect(result).toEqual({ issues: [{ message: 'Required', path: ['agree'] }] })
  })

  it('treats an empty array as absent for required fields', () => {
    const rules = new Map<string, Rules | undefined>([['tags', { required: true }]])
    const result = run({ tags: [] }, ['tags'], rules)
    expect(result).toEqual({ issues: [{ message: 'Required', path: ['tags'] }] })
  })

  it('does not validate or report a stale field that is no longer current', () => {
    const result = run({ oldField: '' }, ['newField'])
    expect(result).toEqual({ value: { oldField: '' } })
  })

  it('continues validating other fields when a rule throws at runtime', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const broken = { toString() { throw new Error('boom') } }
    const rules = new Map<string, Rules | undefined>([
      ['short', { min: broken as unknown as number }],
      ['email', { required: true }],
    ])
    const result = run({ short: '10', email: '' }, ['short', 'email'], rules)
    warn.mockRestore()
    expect(result).toEqual({ issues: [{ message: 'Required', path: ['email'] }] })
  })
})
