import { describe, it, expect } from 'vitest'
import { actionSchema, rulesSchema } from '../src/index'
describe('action/rules schemas', () => {
  it('parses continue_conversation and open_url actions', () => {
    expect(actionSchema.parse({ type: 'continue_conversation' })).toBeTruthy()
    expect(actionSchema.parse({ type: 'open_url', url: 'https://example.com' })).toBeTruthy()
  })
  it('rejects a builtin action that is missing its required payload', () => {
    // The custom branch used to swallow every builtin type, so `open_url`
    // without a url parsed successfully.
    expect(() => actionSchema.parse({ type: 'open_url' })).toThrow()
  })
  it('still accepts custom actions with params', () => {
    expect(actionSchema.parse({ type: 'refresh_dashboard', params: { id: 7 } })).toEqual({
      type: 'refresh_dashboard',
      params: { id: 7 }
    })
  })
  it('parses empty rules as undefined-safe', () => {
    expect(rulesSchema.parse({ required: true })).toEqual({ required: true })
    expect(rulesSchema.parse(undefined)).toBeUndefined()
  })
})
